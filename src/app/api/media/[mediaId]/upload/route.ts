import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { MediaError } from "@/core/media-errors";
import { mediaRouteError, requireAuthorizedMedia, serializeMedia } from "@/core/media-api";
import { getObjectStorage } from "@/core/storage-provider";
import { prisma } from "@/db/client";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function PUT(request: Request, route: RouteContext) {
  let mediaId: string | undefined;
  let failureContext: { organizationId: string; actorUserId: string; storageKey: string } | undefined;
  try {
    mediaId = (await route.params).mediaId;
    const { context, media } = await requireAuthorizedMedia(request, mediaId, "MEDIA_WRITE");
    failureContext = { organizationId: context.organization.id, actorUserId: context.user.id, storageKey: media.storageKey };
    if (media.status !== "PENDING_UPLOAD" || !request.body) throw new MediaError("MEDIA_STATE_INVALID", 409);
    const contentType = request.headers.get("content-type")?.split(";", 1)[0];
    if (contentType !== media.mimeType) throw new MediaError("MEDIA_TYPE_NOT_ALLOWED", 415);
    const declaredLength = Number(request.headers.get("content-length"));
    if (!Number.isSafeInteger(declaredLength) || declaredLength !== Number(media.sizeBytes)) throw new MediaError("MEDIA_SIZE_INVALID", 413);
    const storage = getObjectStorage();
    if (storage.driver !== "local") throw new MediaError("MEDIA_STORAGE_UNAVAILABLE", 503);
    const written = await storage.putObject({ storageKey: media.storageKey, body: request.body, maxBytes: Number(media.sizeBytes) });
    const object = await storage.headObject({ storageKey: media.storageKey });
    if (!object || written.sizeBytes !== Number(media.sizeBytes) || object.sizeBytes !== Number(media.sizeBytes)) throw new MediaError("MEDIA_OBJECT_INVALID", 422);
    const uploaded = await prisma.mediaAsset.update({ where: { id: media.id }, data: { status: "UPLOADED" } });
    await recordSecurityAudit({ action: "MEDIA_UPLOADED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "MediaAsset", entityId: media.id, metadata: { sizeBytes: written.sizeBytes } });
    return NextResponse.json({ media: serializeMedia(uploaded) });
  } catch (error) {
    if (mediaId && failureContext) {
      const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } }).catch(() => null);
      if (media?.status === "PENDING_UPLOAD") {
        await getObjectStorage().deleteObject({ storageKey: media.storageKey }).catch(() => undefined);
        await prisma.mediaAsset.update({ where: { id: media.id }, data: { status: "FAILED" } }).catch(() => undefined);
        if (failureContext) await recordSecurityAudit({ action: "MEDIA_UPLOAD_FAILED", organizationId: failureContext.organizationId, actorUserId: failureContext.actorUserId, entityType: "MediaAsset", entityId: media.id }).catch(() => undefined);
      }
    }
    return mediaRouteError(error);
  }
}
