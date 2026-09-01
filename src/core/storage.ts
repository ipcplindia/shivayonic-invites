import { createReadStream } from "node:fs";
import { mkdir, open, rm, stat } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UploadTarget = { url: string; headers: Record<string, string>; expiresAt: Date };
export type DownloadTarget = { url: string; expiresAt: Date };
export type ByteRange = { start: number; end: number };
export type StoredObject = { body: globalThis.ReadableStream<Uint8Array>; sizeBytes: number; totalSize: number; range?: ByteRange };

export interface ObjectStorage {
  readonly driver: "local" | "s3";
  createUploadTarget(input: { storageKey: string; contentType: string; sizeBytes: number }): Promise<UploadTarget | null>;
  createDownloadTarget(input: { storageKey: string; disposition: "attachment" | "inline"; filename: string }): Promise<DownloadTarget | null>;
  putObject(input: { storageKey: string; body: globalThis.ReadableStream<Uint8Array>; maxBytes: number }): Promise<{ sizeBytes: number }>;
  getObject(input: { storageKey: string; range?: ByteRange }): Promise<StoredObject>;
  deleteObject(input: { storageKey: string }): Promise<void>;
  headObject(input: { storageKey: string }): Promise<{ sizeBytes: number } | null>;
}

export class LocalObjectStorage implements ObjectStorage {
  readonly driver = "local" as const;
  private readonly rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = resolve(rootPath);
  }

  async createUploadTarget(input: { storageKey: string; contentType: string; sizeBytes: number }): Promise<UploadTarget | null> { void input; return null; }
  async createDownloadTarget(input: { storageKey: string; disposition: "attachment" | "inline"; filename: string }): Promise<DownloadTarget | null> { void input; return null; }

  async putObject({ storageKey, body, maxBytes }: { storageKey: string; body: globalThis.ReadableStream<Uint8Array>; maxBytes: number }) {
    const filePath = this.toPath(storageKey);
    await mkdir(dirname(filePath), { recursive: true });
    const file = await open(filePath, "wx");
    let sizeBytes = 0;
    try {
      const reader = body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sizeBytes += value.byteLength;
        if (sizeBytes > maxBytes) throw new Error("OBJECT_MAX_SIZE_EXCEEDED");
        await file.write(value);
      }
      return { sizeBytes };
    } catch (error) {
      await file.close();
      await rm(filePath, { force: true });
      throw error;
    } finally {
      await file.close().catch(() => undefined);
    }
  }

  async getObject({ storageKey, range }: { storageKey: string; range?: ByteRange }): Promise<StoredObject> {
    const filePath = this.toPath(storageKey);
    const details = await stat(filePath);
    const selected = range ? { start: range.start, end: range.end } : undefined;
    return { body: Readable.toWeb(createReadStream(filePath, selected)) as unknown as globalThis.ReadableStream<Uint8Array>, sizeBytes: range ? range.end - range.start + 1 : details.size, totalSize: details.size, range };
  }

  async deleteObject({ storageKey }: { storageKey: string }) {
    await rm(this.toPath(storageKey), { force: true });
  }

  async headObject({ storageKey }: { storageKey: string }) {
    try {
      const details = await stat(this.toPath(storageKey));
      return details.isFile() ? { sizeBytes: details.size } : null;
    } catch {
      return null;
    }
  }

  private toPath(storageKey: string) {
    const filePath = resolve(this.rootPath, storageKey);
    if (!filePath.startsWith(`${this.rootPath}${sep}`)) throw new Error("INVALID_STORAGE_KEY");
    return filePath;
  }
}

export class S3ObjectStorage implements ObjectStorage {
  readonly driver = "s3" as const;

  constructor(private readonly client: S3Client, private readonly bucket: string) {}

  async createUploadTarget({ storageKey, contentType }: { storageKey: string; contentType: string; sizeBytes: number }) {
    const expiresIn = 15 * 60;
    return {
      url: await getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, ContentType: contentType }), { expiresIn }),
      headers: { "content-type": contentType },
      expiresAt: new Date(Date.now() + expiresIn * 1_000),
    };
  }

  async createDownloadTarget({ storageKey, disposition, filename }: { storageKey: string; disposition: "attachment" | "inline"; filename: string }) {
    const expiresIn = 15 * 60;
    return { url: await getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: storageKey, ResponseContentDisposition: `${disposition}; filename="${filename}"` }), { expiresIn }), expiresAt: new Date(Date.now() + expiresIn * 1_000) };
  }

  async putObject(input: { storageKey: string; body: globalThis.ReadableStream<Uint8Array>; maxBytes: number }): Promise<{ sizeBytes: number }> {
    void input;
    throw new Error("S3_DIRECT_UPLOAD_REQUIRED");
  }

  async getObject({ storageKey, range }: { storageKey: string; range?: ByteRange }): Promise<StoredObject> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey, ...(range ? { Range: `bytes=${range.start}-${range.end}` } : {}) }));
    if (!result.Body) throw new Error("OBJECT_NOT_FOUND");
    const totalSize = Number(result.ContentRange?.split("/")[1] ?? result.ContentLength ?? 0);
    return { body: result.Body.transformToWebStream() as unknown as globalThis.ReadableStream<Uint8Array>, sizeBytes: result.ContentLength ?? totalSize, totalSize, range };
  }

  async deleteObject({ storageKey }: { storageKey: string }) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }

  async headObject({ storageKey }: { storageKey: string }) {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }));
      return typeof result.ContentLength === "number" ? { sizeBytes: result.ContentLength } : null;
    } catch {
      return null;
    }
  }
}
