import { Buffer } from "node:buffer";
import { URLSearchParams } from "node:url";

import { MediaError } from "@/core/media-errors";
import type { MediaKind, MediaListRequest, MediaPagination, MediaStatus } from "@/shared/media";

const mediaStatuses = new Set<MediaStatus>(["PENDING_UPLOAD", "UPLOADED", "PROCESSING", "READY", "FAILED", "ARCHIVED"]);
const mediaKinds = new Set<MediaKind>(["VIDEO", "IMAGE", "AUDIO", "DOCUMENT"]);
export const maxMediaListLimit = 100;

type MediaCursor = { createdAt: string; id: string };
export type ParsedMediaListRequest = Omit<MediaListRequest, "cursor" | "limit"> & { limit: number; cursor: MediaCursor | null };

export function parseMediaListRequest(searchParams: URLSearchParams): ParsedMediaListRequest {
  const rawLimit = searchParams.get("limit");
  const limit = rawLimit ? Number(rawLimit) : 50;
  const status = searchParams.get("status") || undefined;
  const kind = searchParams.get("kind") || undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > maxMediaListLimit || (q && q.length > 120)) throw new MediaError("INVALID_MEDIA_INPUT", 400);
  if (status && !mediaStatuses.has(status as MediaStatus)) throw new MediaError("INVALID_MEDIA_INPUT", 400);
  if (kind && !mediaKinds.has(kind as MediaKind)) throw new MediaError("INVALID_MEDIA_INPUT", 400);
  const rawCursor = searchParams.get("cursor");
  return { cursor: rawCursor ? decodeMediaCursor(rawCursor) : null, limit, status: status as MediaStatus | undefined, kind: kind as MediaKind | undefined, projectId: searchParams.get("projectId") || undefined, q };
}

export function mediaCursorWhere(cursor: MediaCursor | null) {
  return cursor ? { OR: [{ createdAt: { lt: new Date(cursor.createdAt) } }, { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } }] } : {};
}

export function pageMedia<T extends { id: string; createdAt: Date }>(items: T[], limit: number): { items: T[]; pageInfo: MediaPagination } {
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  return { items: page, pageInfo: { hasMore, nextCursor: hasMore ? encodeMediaCursor(page.at(-1)!) : null } };
}

function decodeMediaCursor(value: string): MediaCursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as MediaCursor;
    if (!parsed.id || Number.isNaN(Date.parse(parsed.createdAt))) throw new Error();
    return parsed;
  } catch {
    throw new MediaError("INVALID_MEDIA_INPUT", 400);
  }
}

function encodeMediaCursor(media: { id: string; createdAt: Date }) {
  return Buffer.from(JSON.stringify({ id: media.id, createdAt: media.createdAt.toISOString() })).toString("base64url");
}
