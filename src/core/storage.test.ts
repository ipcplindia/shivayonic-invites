import { describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalObjectStorage, S3ObjectStorage } from "./storage";

describe("LocalObjectStorage", () => {
  it("stores, verifies, streams, and deletes media outside the database", async () => {
    const rootPath = await mkdtemp(join(tmpdir(), "shivayonic-storage-"));
    const storage = new LocalObjectStorage(rootPath);
    const body = new globalThis.ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new globalThis.TextEncoder().encode("media")); controller.close(); } });
    try {
      expect(await storage.createUploadTarget({ storageKey: "org/asset.mp4", contentType: "video/mp4", sizeBytes: 5 })).toBeNull();
      await expect(storage.putObject({ storageKey: "org/asset.mp4", body, maxBytes: 5 })).resolves.toEqual({ sizeBytes: 5 });
      await expect(storage.headObject({ storageKey: "org/asset.mp4" })).resolves.toEqual({ sizeBytes: 5 });
      await expect(storage.promoteUpload({ storageKey: "org/asset.mp4" })).resolves.toBe("org/asset.mp4");
      const object = await storage.getObject({ storageKey: "org/asset.mp4" });
      await expect(new Response(object.body).text()).resolves.toBe("media");
      const range = await storage.getObject({ storageKey: "org/asset.mp4", range: { start: 1, end: 3 } });
      expect(range.sizeBytes).toBe(3);
      await expect(new Response(range.body).text()).resolves.toBe("edi");
      await storage.deleteObject({ storageKey: "org/asset.mp4" });
      await expect(storage.headObject({ storageKey: "org/asset.mp4" })).resolves.toBeNull();
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });
});

describe("S3ObjectStorage", () => {
  it("promotes the verified version to an unguessable final key", async () => {
    const send = vi.fn().mockResolvedValue({});
    const storage = new S3ObjectStorage({ send } as never, "private-bucket");
    const finalKey = await storage.promoteUpload({ storageKey: "organizations/org/media/id/upload.jpg", versionId: "v1" });
    expect(finalKey).toMatch(/upload-ready-[\w-]+\.jpg$/);
    expect(send.mock.calls[0][0].input).toMatchObject({
      Bucket: "private-bucket",
      Key: finalKey,
      CopySource: "private-bucket/organizations/org/media/id/upload.jpg?versionId=v1",
    });
  });

  it("permanently removes every version for an exact object key", async () => {
    const send = vi.fn(async (command: { constructor: { name: string } }) =>
      command.constructor.name === "ListObjectVersionsCommand"
        ? { Versions: [{ Key: "org/object", VersionId: "v2" }, { Key: "org/object-other", VersionId: "v3" }], DeleteMarkers: [{ Key: "org/object", VersionId: "hide" }], IsTruncated: false }
        : {},
    );
    const storage = new S3ObjectStorage({ send } as never, "private-bucket");
    await storage.deleteObject({ storageKey: "org/object" });
    const deletes = send.mock.calls.slice(1).map(([command]) => (command as unknown as { input: object }).input);
    expect(deletes).toEqual([
      { Bucket: "private-bucket", Key: "org/object", VersionId: "v2" },
      { Bucket: "private-bucket", Key: "org/object", VersionId: "hide" },
    ]);
  });
});
