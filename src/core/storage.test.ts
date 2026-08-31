import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalObjectStorage } from "./storage";

describe("LocalObjectStorage", () => {
  it("stores, verifies, streams, and deletes media outside the database", async () => {
    const rootPath = await mkdtemp(join(tmpdir(), "shivayonic-storage-"));
    const storage = new LocalObjectStorage(rootPath);
    const body = new globalThis.ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new globalThis.TextEncoder().encode("media")); controller.close(); } });
    try {
      expect(await storage.createUploadTarget({ storageKey: "org/asset.mp4", contentType: "video/mp4", sizeBytes: 5 })).toBeNull();
      await expect(storage.putObject({ storageKey: "org/asset.mp4", body, maxBytes: 5 })).resolves.toEqual({ sizeBytes: 5 });
      await expect(storage.headObject({ storageKey: "org/asset.mp4" })).resolves.toEqual({ sizeBytes: 5 });
      const object = await storage.getObject({ storageKey: "org/asset.mp4" });
      await expect(new Response(object.body).text()).resolves.toBe("media");
      await storage.deleteObject({ storageKey: "org/asset.mp4" });
      await expect(storage.headObject({ storageKey: "org/asset.mp4" })).resolves.toBeNull();
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });
});
