import { NextResponse } from "next/server";

import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { MediaError, mediaErrorResponse } from "@/core/media-errors";
import { prisma } from "@/db/client";

export async function requireAuthorizedMedia(request: Request, mediaId: string, permission: "MEDIA_READ" | "MEDIA_WRITE") {
  const context = await requirePermission(permission, { headers: request.headers });
  const media = await prisma.mediaAsset.findFirst({ where: { id: mediaId, organizationId: context.organization.id } });
  if (!media) throw new MediaError("MEDIA_NOT_FOUND", 404);
  return { context, media };
}

export function serializeMedia(media: {
  id: string; projectId: string | null; kind: string; status: string; originalFilename: string; mimeType: string; sizeBytes: bigint;
  width: number | null; height: number | null; durationMs: number | null; createdAt: Date; updatedAt: Date; archivedAt: Date | null;
}) {
  return {
    id: media.id,
    projectId: media.projectId,
    kind: media.kind,
    status: media.status,
    originalFilename: media.originalFilename,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes.toString(),
    width: media.width,
    height: media.height,
    durationMs: media.durationMs,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
    archivedAt: media.archivedAt?.toISOString() ?? null,
  };
}

export function mediaRouteError(error: unknown) {
  if (error instanceof AppAuthError) return authErrorResponse(error);
  if (error instanceof MediaError) return mediaErrorResponse(error);
  return NextResponse.json({ error: { code: "MEDIA_STORAGE_UNAVAILABLE" } }, { status: 503 });
}
