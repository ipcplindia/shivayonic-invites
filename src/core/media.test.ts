import { describe, expect, it } from "vitest";

import { createMediaStorageKey, mediaKindForMimeType, parseByteRange, validateMediaSize } from "./media";
import { serializeMedia, serializeMediaDetail } from "./media-serializer";

describe("media rules", () => {
  it("uses server-generated, tenant-scoped keys and allowlisted limits", () => {
    const key = createMediaStorageKey("org_123", "media_123", "video/mp4");
    expect(key).toMatch(/^organizations\/org_123\/media\/media_123\/[\w-]+\.mp4$/);
    expect(mediaKindForMimeType("video/mp4")).toBe("VIDEO");
    expect(() => validateMediaSize("application/pdf", 10)).toThrow("MEDIA_TYPE_NOT_ALLOWED");
    expect(() => validateMediaSize("image/png", 26 * 1024 * 1024)).toThrow("MEDIA_SIZE_INVALID");
  });
});

describe("byte ranges", () => {
  it("accepts one bounded range and rejects invalid ranges", () => {
    expect(parseByteRange("bytes=2-4", 10)).toEqual({ start: 2, end: 4 });
    expect(parseByteRange("bytes=-3", 10)).toEqual({ start: 7, end: 9 });
    expect(parseByteRange("bytes=8-99", 10)).toEqual({ start: 8, end: 9 });
    expect(parseByteRange("bytes=10-11", 10)).toBeUndefined();
    expect(parseByteRange("bytes=0-1,3-4", 10)).toBeUndefined();
  });
});

describe("media contracts", () => {
  const media = {
    id: "asset-1", projectId: "project-1", kind: "VIDEO", status: "READY", originalFilename: "master.mp4", mimeType: "video/mp4", sizeBytes: 12n,
    width: 1920, height: 1080, durationMs: 5000, createdAt: new Date("2026-09-01T00:00:00.000Z"), updatedAt: new Date("2026-09-01T01:00:00.000Z"), archivedAt: null,
  };

  it("serializes a safe shared summary and richer detail", () => {
    expect(serializeMedia(media)).toMatchObject({ id: "asset-1", sizeBytes: "12", kind: "VIDEO", status: "READY" });
    expect(serializeMediaDetail({ ...media, project: { id: "project-1", name: "Wedding" }, createdBy: { id: "user-1", name: "Amit" } }))
      .toMatchObject({ project: { name: "Wedding" }, creator: { id: "user-1" } });
  });
});
