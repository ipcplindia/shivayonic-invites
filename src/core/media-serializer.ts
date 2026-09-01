import type { MediaAssetDetail, MediaAssetSummary, MediaKind, MediaStatus } from "@/shared/media";

type SerializedMediaInput = {
  id: string; projectId: string | null; kind: string; status: string; originalFilename: string; mimeType: string; sizeBytes: bigint;
  width: number | null; height: number | null; durationMs: number | null; createdAt: Date; updatedAt: Date; archivedAt: Date | null;
};

export function serializeMedia(media: SerializedMediaInput): MediaAssetSummary {
  return {
    id: media.id, projectId: media.projectId, kind: media.kind as MediaKind, status: media.status as MediaStatus,
    originalFilename: media.originalFilename, mimeType: media.mimeType, sizeBytes: media.sizeBytes.toString(),
    width: media.width, height: media.height, durationMs: media.durationMs,
    createdAt: media.createdAt.toISOString(), updatedAt: media.updatedAt.toISOString(), archivedAt: media.archivedAt?.toISOString() ?? null,
  };
}

export function serializeMediaDetail(media: SerializedMediaInput & {
  project: { id: string; name: string } | null;
  createdBy: { id: string; name: string | null };
}): MediaAssetDetail {
  return { ...serializeMedia(media), project: media.project, creator: media.createdBy };
}
