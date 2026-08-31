import { describe, expect, it } from "vitest";

import { createMediaStorageKey, mediaKindForMimeType, validateMediaSize } from "./media";

describe("media rules", () => {
  it("uses server-generated, tenant-scoped keys and allowlisted limits", () => {
    const key = createMediaStorageKey("org_123", "media_123", "video/mp4");
    expect(key).toMatch(/^organizations\/org_123\/media\/media_123\/[\w-]+\.mp4$/);
    expect(mediaKindForMimeType("video/mp4")).toBe("VIDEO");
    expect(() => validateMediaSize("application/pdf", 10)).toThrow("MEDIA_TYPE_NOT_ALLOWED");
    expect(() => validateMediaSize("image/png", 26 * 1024 * 1024)).toThrow("MEDIA_SIZE_INVALID");
  });
});
