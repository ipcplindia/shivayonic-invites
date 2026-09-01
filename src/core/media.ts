import { randomUUID } from "node:crypto";
import { z } from "zod";

import { MediaError } from "@/core/media-errors";

export const mediaMimeTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime", "audio/mpeg", "audio/wav", "audio/ogg"] as const;
export type SupportedMediaMimeType = (typeof mediaMimeTypes)[number];
export type MediaKindValue = "IMAGE" | "VIDEO" | "AUDIO";

const mediaRules: Record<SupportedMediaMimeType, { kind: MediaKindValue; maxBytes: number; extension: string }> = {
  "image/jpeg": { kind: "IMAGE", maxBytes: 25 * 1024 * 1024, extension: "jpg" },
  "image/png": { kind: "IMAGE", maxBytes: 25 * 1024 * 1024, extension: "png" },
  "image/webp": { kind: "IMAGE", maxBytes: 25 * 1024 * 1024, extension: "webp" },
  "video/mp4": { kind: "VIDEO", maxBytes: 2 * 1024 * 1024 * 1024, extension: "mp4" },
  "video/webm": { kind: "VIDEO", maxBytes: 2 * 1024 * 1024 * 1024, extension: "webm" },
  "video/quicktime": { kind: "VIDEO", maxBytes: 2 * 1024 * 1024 * 1024, extension: "mov" },
  "audio/mpeg": { kind: "AUDIO", maxBytes: 250 * 1024 * 1024, extension: "mp3" },
  "audio/wav": { kind: "AUDIO", maxBytes: 250 * 1024 * 1024, extension: "wav" },
  "audio/ogg": { kind: "AUDIO", maxBytes: 250 * 1024 * 1024, extension: "ogg" },
};

export const createMediaInputSchema = z.object({
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.enum(mediaMimeTypes),
  sizeBytes: z.number().int().positive(),
  projectId: z.string().cuid().optional(),
});
export type CreateMediaInput = z.infer<typeof createMediaInputSchema>;

export function getMediaRule(mimeType: string) {
  const rule = mediaRules[mimeType as SupportedMediaMimeType];
  if (!rule) throw new MediaError("MEDIA_TYPE_NOT_ALLOWED", 415);
  return rule;
}

export function validateMediaSize(mimeType: string, sizeBytes: number) {
  const rule = getMediaRule(mimeType);
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > rule.maxBytes) throw new MediaError("MEDIA_SIZE_INVALID", 413);
}

export function createMediaStorageKey(organizationId: string, mediaId: string, mimeType: string) {
  return `organizations/${organizationId}/media/${mediaId}/${randomUUID()}.${getMediaRule(mimeType).extension}`;
}

export function mediaKindForMimeType(mimeType: string): MediaKindValue {
  return getMediaRule(mimeType).kind;
}

export function safeDownloadFilename(filename: string) {
  return Array.from(filename, (character) => character.charCodeAt(0) < 32 ? "_" : character).join("").replace(/[\\/:*?"<>|]/g, "_").slice(0, 255) || "media";
}

export function parseByteRange(header: string | null, totalSize: number) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || totalSize < 1) return undefined;
  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return undefined;
  if (!rawStart) {
    const suffix = Number(rawEnd);
    return Number.isSafeInteger(suffix) && suffix > 0 ? { start: Math.max(totalSize - suffix, 0), end: totalSize - 1 } : undefined;
  }
  const start = Number(rawStart);
  const end = rawEnd ? Number(rawEnd) : totalSize - 1;
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && start <= end && start < totalSize
    ? { start, end: Math.min(end, totalSize - 1) }
    : undefined;
}
