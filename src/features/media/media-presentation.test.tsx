import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MediaCard, MediaCardSkeleton } from "@/features/media/media-client";
import {
  describeApiError,
  formatBytes,
  formatDuration,
  presentStatus,
  type MediaAssetSummary,
} from "@/features/media/media";

const sample: MediaAssetSummary = {
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

describe("MediaCard", () => {
  it("shows operator-facing metadata only", () => {
    const markup = renderToStaticMarkup(<MediaCard media={sample} />);

    expect(markup).toContain("mehta-wedding-film-master.mp4");
    expect(markup).toContain("700 MB");
    expect(markup).toContain("3840×2160");
    expect(markup).toContain("3:05");
    expect(markup).toContain("Ready");
  });

  it("never renders storage internals, even if the payload carries them", () => {
    const contaminated = {
      ...sample,
      storageKey: "organizations/org-1/media/a4f1/secret.mp4",
    } as MediaAssetSummary;

    const markup = renderToStaticMarkup(<MediaCard media={contaminated} />);

    expect(markup).not.toContain("organizations/");
    expect(markup).not.toContain("storageKey");
    expect(markup).not.toContain("secret.mp4");
  });

  it("renders a skeleton for the loading state", () => {
    const markup = renderToStaticMarkup(<MediaCardSkeleton />);
    expect(markup).toContain('aria-hidden="true"');
  });
});

describe("media formatting", () => {
  it("formats sizes from the serialised bigint string", () => {
    expect(formatBytes("0")).toBe("—");
    expect(formatBytes("1024")).toBe("1.0 KB");
    expect(formatBytes("734003200")).toBe("700 MB");
  });

  it("formats duration, and omits it when unknown", () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(65000)).toBe("1:05");
  });

  it("distinguishes statuses by tone and by dot shape", () => {
    expect(presentStatus("READY")).toEqual({ label: "Ready", tone: "success", shape: "solid" });
    expect(presentStatus("FAILED").shape).toBe("square");
    expect(presentStatus("PROCESSING").shape).toBe("hollow");
    expect(presentStatus("SOMETHING_NEW").label).toBe("SOMETHING_NEW");
  });
});

describe("API error copy", () => {
  it("maps the backend error envelope onto operator-facing language", () => {
    expect(describeApiError("PERMISSION_DENIED", 403)).toMatch(/role/i);
    expect(describeApiError("SESSION_EXPIRED", 401)).toMatch(/sign in/i);
    expect(describeApiError("MEDIA_STORAGE_UNAVAILABLE", 503)).toMatch(/storage/i);
    expect(describeApiError(undefined, 500)).toMatch(/try again/i);
  });
});
