import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MediaCard } from "@/features/media/media-client";
import { MediaInspector } from "@/features/media/media-inspector";
import {
  MEDIA_PAGE_SIZE,
  MEDIA_QUERY_MAX_LENGTH,
  MEDIA_VIEW_STORAGE_KEY,
  buildMediaListQuery,
  isDownloadable,
  mediaKinds,
  mediaStatuses,
  mediaViewModes,
  parseOption,
  readViewPreference,
} from "@/features/media/media";
// The contract itself is imported from the shared module, not mirrored locally.
import type { MediaAssetDetail, MediaAssetSummary, MediaListResponse } from "@/shared/media";

const video: MediaAssetSummary = {
  id: "a4f1c2e0-0000-4000-8000-000000000000",
  projectId: null,
  kind: "VIDEO",
  status: "READY",
  originalFilename: "mehta-wedding-film-master.mp4",
  mimeType: "video/mp4",
  sizeBytes: "734003200",
  width: 3840,
  height: 2160,
  durationMs: 185000,
  createdAt: "2026-08-30T09:15:00.000Z",
  updatedAt: "2026-08-30T09:15:00.000Z",
  archivedAt: null,
};

const audio: MediaAssetSummary = {
  ...video,
  id: "b5",
  kind: "AUDIO",
  status: "PROCESSING",
  originalFilename: "sharma-invitation-song.wav",
  mimeType: "audio/wav",
  width: null,
  height: null,
};

describe("URL and storage state", () => {
  it("accepts only known values from the query string", () => {
    expect(parseOption("grid", mediaViewModes)).toBe("grid");
    expect(parseOption("list", mediaViewModes)).toBe("list");
    expect(parseOption("<script>", mediaViewModes)).toBe("");
    expect(parseOption(null, mediaViewModes)).toBe("");
  });

  it("persists a layout preference and nothing else", () => {
    const store = new Map<string, string>([[MEDIA_VIEW_STORAGE_KEY, "list"]]);
    const storage = { getItem: (key: string) => store.get(key) ?? null };

    expect(MEDIA_VIEW_STORAGE_KEY).toBe("shivayonic.media.view");
    expect(readViewPreference(storage)).toBe("list");

    // Anything unexpected in storage falls back to the safe default.
    store.set(MEDIA_VIEW_STORAGE_KEY, "OWNER");
    expect(readViewPreference(storage)).toBe("");
  });

  it("falls back safely when the browser refuses storage", () => {
    const blocked = {
      getItem() {
        throw new Error("SecurityError");
      },
    };

    expect(readViewPreference(blocked)).toBe("");
    expect(readViewPreference(undefined)).toBe("");
  });
});

describe("server filter contract", () => {
  it("sends every filter to the list route, and asks for one page", () => {
    const query = new URLSearchParams(
      buildMediaListQuery({ kind: "VIDEO", status: "READY", q: "mehta" }),
    );

    expect(query.get("limit")).toBe(String(MEDIA_PAGE_SIZE));
    expect(query.get("kind")).toBe("VIDEO");
    expect(query.get("status")).toBe("READY");
    expect(query.get("q")).toBe("mehta");
  });

  it("omits empty filters rather than sending blanks the route would reject", () => {
    const query = new URLSearchParams(buildMediaListQuery({ kind: "", status: "", q: "   " }));

    expect([...query.keys()]).toEqual(["limit"]);
  });

  it("carries a cursor when one is supplied", () => {
    const query = new URLSearchParams(buildMediaListQuery({ cursor: "abc123" }));
    expect(query.get("cursor")).toBe("abc123");
  });

  it("offers exactly the kinds and statuses the shared contract defines", () => {
    expect(mediaKinds).toEqual(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"]);
    expect(mediaStatuses).toContain("ARCHIVED");
    expect(parseOption("DOCUMENT", mediaKinds)).toBe("DOCUMENT");
    expect(parseOption("EVERYTHING", mediaKinds)).toBe("");
    expect(MEDIA_QUERY_MAX_LENGTH).toBe(120);
  });
});

describe("MediaCard", () => {
  it("becomes a button that opens a dialog once it is openable", () => {
    const plain = renderToStaticMarkup(<MediaCard media={video} />);
    const openable = renderToStaticMarkup(<MediaCard media={video} onOpen={() => {}} />);

    expect(plain).toMatch(/^<article/);
    expect(openable).toMatch(/^<button/);
    expect(openable).toContain('aria-haspopup="dialog"');
  });
});

describe("MediaInspector", () => {
  it("shows operator-facing metadata for the selected master", () => {
    const markup = renderToStaticMarkup(<MediaInspector media={video} onClose={() => {}} />);

    expect(markup).toContain("mehta-wedding-film-master.mp4");
    expect(markup).toContain("video/mp4");
    expect(markup).toContain("700 MB");
    expect(markup).toContain("3840×2160");
    expect(markup).toContain("3:05");
  });

  it("offers download through the authorised route, never a storage URL", () => {
    const markup = renderToStaticMarkup(<MediaInspector media={video} onClose={() => {}} />);

    expect(markup).toContain(`href="/api/media/${video.id}/download"`);
    expect(markup).not.toContain("http");
    expect(markup).not.toContain("organizations/");
    expect(markup).not.toContain("s3");
  });

  it("withholds download and preview until the master is ready", () => {
    expect(isDownloadable(audio)).toBe(false);

    const markup = renderToStaticMarkup(<MediaInspector media={audio} onClose={() => {}} />);

    expect(markup).not.toContain("/download");
    expect(markup).toContain("finishes processing");
  });

  it("does not autoplay, and loads no media until asked", () => {
    const markup = renderToStaticMarkup(<MediaInspector media={video} onClose={() => {}} />);

    expect(markup).toContain("Load preview");
    expect(markup).not.toContain("<video");
    expect(markup).not.toContain("autoplay");
  });

  it("never renders storage internals, even if the payload carries them", () => {
    const contaminated = {
      ...video,
      storageKey: "organizations/org-1/media/a4f1/secret.mp4",
    } as MediaAssetSummary;

    const markup = renderToStaticMarkup(
      <MediaInspector media={contaminated} onClose={() => {}} />,
    );

    expect(markup).not.toContain("storageKey");
    expect(markup).not.toContain("secret.mp4");
  });

  it("prefers the detail contract's project name and uploader when present", () => {
    const detail: MediaAssetDetail = {
      ...video,
      projectId: "p1",
      project: { id: "p1", name: "Mehta Wedding" },
      creator: { id: "u1", name: "Aarav Mehta" },
    };

    const markup = renderToStaticMarkup(<MediaInspector media={detail} onClose={() => {}} />);

    expect(markup).toContain("Mehta Wedding");
    expect(markup).toContain("Uploaded by");
    expect(markup).toContain("Aarav Mehta");
    // Internal identifiers stay out of the interface.
    expect(markup).not.toContain("u1");
  });

  it("renders nothing selectable when no master is open", () => {
    const markup = renderToStaticMarkup(<MediaInspector media={null} onClose={() => {}} />);

    expect(markup).not.toContain("<dialog open");
    expect(markup).not.toContain("mehta-wedding-film-master.mp4");
  });
});

describe("paginated list contract", () => {
  it("understands the cursor page the list route returns", () => {
    // Typed against the shared contract: a shape change breaks this at compile time.
    const response: MediaListResponse = {
      media: [video],
      pageInfo: { nextCursor: "eyJpZCI6ImE0ZjEifQ", hasMore: true },
    };

    expect(response.media).toHaveLength(1);
    expect(response.pageInfo.hasMore).toBe(true);
    expect(response.pageInfo.nextCursor).toBeTypeOf("string");
  });

  it("treats an exhausted page as having no cursor", () => {
    const response: MediaListResponse = {
      media: [],
      pageInfo: { nextCursor: null, hasMore: false },
    };

    expect(response.pageInfo.nextCursor).toBeNull();
  });
});
