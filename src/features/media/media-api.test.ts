import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MediaApiError,
  archiveMedia,
  completeMedia,
  createMedia,
  deleteMedia,
  describeMediaError,
  fetchMediaDetail,
  listMedia,
} from "@/features/media/media-api";

type Call = { url: string; init: RequestInit | undefined };

function stubFetch(responder: (url: string) => { status: number; body?: unknown }) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const { status, body } = responder(url);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body ?? null,
    } as Response;
  });
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

const summary = {
  id: "m1",
  projectId: null,
  kind: "VIDEO",
  status: "PENDING_UPLOAD",
  originalFilename: "master.mp4",
  mimeType: "video/mp4",
  sizeBytes: "1024",
  width: null,
  height: null,
  durationMs: null,
  createdAt: "2026-08-30T09:15:00.000Z",
  updatedAt: "2026-08-30T09:15:00.000Z",
  archivedAt: null,
};

describe("create media", () => {
  it("sends only the four fields the create schema accepts", async () => {
    const calls = stubFetch(() => ({
      status: 201,
      body: { media: summary, upload: { url: "/api/media/m1/upload" } },
    }));

    await createMedia({
      originalFilename: "master.mp4",
      mimeType: "video/mp4",
      sizeBytes: 1024,
    });

    const body = JSON.parse(String(calls[0].init?.body));
    expect(Object.keys(body).sort()).toEqual(["mimeType", "originalFilename", "sizeBytes"]);
  });

  it("never sends server-owned fields, even if handed extra properties", async () => {
    const calls = stubFetch(() => ({
      status: 201,
      body: { media: summary, upload: { url: "/api/media/m1/upload" } },
    }));

    await createMedia({
      originalFilename: "master.mp4",
      mimeType: "video/mp4",
      sizeBytes: 1024,
      // Not part of the request type; deliberately smuggled in to prove it is dropped.
      ...({ organizationId: "org-2", storageKey: "organizations/x/y", status: "READY" } as object),
    });

    const raw = String(calls[0].init?.body);
    for (const forbidden of ["organizationId", "storageKey", "status", "createdByUserId"]) {
      expect(raw).not.toContain(forbidden);
    }
  });

  it("returns the upload target exactly as the server described it", async () => {
    stubFetch(() => ({
      status: 201,
      body: {
        media: summary,
        upload: { url: "/api/media/m1/upload", method: "PUT", headers: { "content-type": "video/mp4" } },
      },
    }));

    const created = await createMedia({
      originalFilename: "master.mp4",
      mimeType: "video/mp4",
      sizeBytes: 1024,
    });

    expect(created.upload.url).toBe("/api/media/m1/upload");
    expect(created.upload.method).toBe("PUT");
    expect(created.upload.headers).toEqual({ "content-type": "video/mp4" });
  });
});

describe("lifecycle calls", () => {
  it("confirms through the server and reports the status it returns", async () => {
    stubFetch(() => ({ status: 200, body: { media: { ...summary, status: "READY" } } }));
    const media = await completeMedia("m1");
    expect(media.status).toBe("READY");
  });

  it("does not treat a non-READY confirm answer as success", async () => {
    stubFetch(() => ({ status: 200, body: { media: { ...summary, status: "FAILED" } } }));
    const media = await completeMedia("m1");
    expect(media.status).toBe("FAILED");
  });

  it("archives with mode=archive and deletes with mode=delete", async () => {
    const calls = stubFetch((url) =>
      url.includes("mode=delete") ? { status: 204 } : { status: 200, body: { media: summary } },
    );

    await archiveMedia("m1");
    await deleteMedia("m1");

    expect(calls[0].url).toBe("/api/media/m1?mode=archive");
    expect(calls[0].init?.method).toBe("DELETE");
    expect(calls[1].url).toBe("/api/media/m1?mode=delete");
  });

  it("reads detail from the media detail route", async () => {
    const calls = stubFetch(() => ({
      status: 200,
      body: { media: { ...summary, project: null, creator: { id: "u1", name: "Aarav" } } },
    }));

    const detail = await fetchMediaDetail("m1");

    expect(calls[0].url).toBe("/api/media/m1");
    expect(detail.creator.name).toBe("Aarav");
  });

  it("lists through the media route with the query it was given", async () => {
    const calls = stubFetch(() => ({
      status: 200,
      body: { media: [], pageInfo: { nextCursor: null, hasMore: false } },
    }));

    await listMedia("limit=50&kind=VIDEO");

    expect(calls[0].url).toBe("/api/media?limit=50&kind=VIDEO");
  });
});

describe("error handling", () => {
  it("raises operator-facing copy and marks only server faults retryable", async () => {
    stubFetch(() => ({ status: 403, body: { error: { code: "ROLE_NOT_ALLOWED" } } }));

    const error = await deleteMedia("m1").catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(MediaApiError);
    expect((error as MediaApiError).message).toMatch(/owner/i);
    expect((error as MediaApiError).retryable).toBe(false);
  });

  it("treats a 503 from storage as worth retrying", async () => {
    stubFetch(() => ({ status: 503, body: { error: { code: "MEDIA_STORAGE_UNAVAILABLE" } } }));

    const error = (await archiveMedia("m1").catch((thrown) => thrown)) as MediaApiError;

    expect(error.retryable).toBe(true);
    expect(error.message).toMatch(/storage/i);
  });

  it("never surfaces a raw code or trace to the operator", () => {
    for (const code of [
      "MEDIA_STATE_INVALID",
      "MEDIA_OBJECT_INVALID",
      "MEDIA_TYPE_NOT_ALLOWED",
      "MEDIA_SIZE_INVALID",
      "MEDIA_NOT_FOUND",
      "PERMISSION_DENIED",
      "SESSION_EXPIRED",
    ]) {
      const message = describeMediaError(code, 400);
      expect(message).not.toContain("_");
      expect(message.length).toBeGreaterThan(20);
    }
  });
});
