export type MediaKind = "VIDEO" | "IMAGE" | "AUDIO" | "DOCUMENT";
export type MediaStatus = "PENDING_UPLOAD" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | "ARCHIVED";

export type MediaAssetSummary = {
  id: string; projectId: string | null; kind: MediaKind; status: MediaStatus; originalFilename: string; mimeType: string; sizeBytes: string;
  width: number | null; height: number | null; durationMs: number | null; createdAt: string; updatedAt: string; archivedAt: string | null;
  displayTitle?: string | null; altText?: string | null; description?: string | null;
};

export type MediaAssetDetail = MediaAssetSummary & {
  project: { id: string; name: string } | null;
  creator: { id: string; name: string | null };
};

export type MediaListRequest = { cursor?: string; limit?: number; kind?: MediaKind; status?: MediaStatus; projectId?: string; q?: string };
export type MediaPagination = { nextCursor: string | null; hasMore: boolean };
export type MediaListResponse = { media: MediaAssetSummary[]; pageInfo: MediaPagination };
export type MediaAccessResponse = { url: string; expiresAt: string };
export type CreateMediaRequest = { originalFilename: string; mimeType: string; sizeBytes: number; projectId?: string };
export type CreateMediaResponse = { media: MediaAssetSummary; upload: { url: string; method?: "PUT"; headers: Record<string, string>; expiresAt?: string } };
export type CompleteMediaResponse = { media: MediaAssetSummary };
export type ArchiveMediaResponse = { media: MediaAssetSummary };
export type UpdateMediaRequest = { displayTitle?: string; altText?: string; description?: string };
