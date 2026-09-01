import { describe, expect, it } from "vitest";

import {
  mediaAcceptAttribute,
  mediaUploadRules,
  prevalidateFile,
  resolveUploadMimeType,
} from "@/features/media/upload";

const validVideo = { name: "mehta-film.mp4", size: 40 * 1024 * 1024, type: "video/mp4" };

describe("upload prevalidation", () => {
  it("accepts a supported master within its size limit", () => {
    expect(prevalidateFile(validVideo)).toBeNull();
  });

  it("rejects an unsupported format before any request is made", () => {
    const failure = prevalidateFile({ name: "brief.pdf", size: 1024, type: "application/pdf" });

    expect(failure?.code).toBe("UNSUPPORTED_TYPE");
    expect(failure?.message).toMatch(/MP4/);
  });

  it("rejects a file past the family limit, naming the limit", () => {
    const failure = prevalidateFile({
      name: "poster.png",
      size: 30 * 1024 * 1024,
      type: "image/png",
    });

    expect(failure?.code).toBe("TOO_LARGE");
    expect(failure?.message).toMatch(/25 MB/);
  });

  it("rejects an empty file", () => {
    expect(prevalidateFile({ name: "empty.mp4", size: 0, type: "video/mp4" })?.code).toBe(
      "EMPTY_FILE",
    );
  });

  it("allows a large video that is still under the 2 GB video limit", () => {
    expect(prevalidateFile({ ...validVideo, size: 1.5 * 1024 ** 3 })).toBeNull();
  });
});

describe("mime resolution", () => {
  it("trusts the browser's reported type first", () => {
    expect(resolveUploadMimeType({ name: "clip.bin", size: 1, type: "video/mp4" })).toBe("video/mp4");
  });

  it("falls back to the extension only when the browser reports nothing", () => {
    expect(resolveUploadMimeType({ name: "score.WAV", size: 1, type: "" })).toBe("audio/wav");
  });

  it("does not reject a file on extension alone — the server decides", () => {
    // An unusual reported type is passed through, and the server refuses it if it must.
    expect(resolveUploadMimeType({ name: "clip.mp4", size: 1, type: "video/x-odd" })).toBe(
      "video/x-odd",
    );
  });
});

describe("accept guidance", () => {
  it("offers every allowed mime type and its extensions to the file picker", () => {
    for (const mimeType of Object.keys(mediaUploadRules)) {
      expect(mediaAcceptAttribute).toContain(mimeType);
    }
    expect(mediaAcceptAttribute).toContain(".mov");
    expect(mediaAcceptAttribute).not.toContain(".pdf");
  });

  it("matches the server's documented limits", () => {
    expect(mediaUploadRules["video/mp4"].maxBytes).toBe(2 * 1024 ** 3);
    expect(mediaUploadRules["audio/wav"].maxBytes).toBe(250 * 1024 ** 2);
    expect(mediaUploadRules["image/png"].maxBytes).toBe(25 * 1024 ** 2);
  });
});
