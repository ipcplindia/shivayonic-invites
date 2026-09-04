import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { canConfirmMediaUpload } from "@/core/media";
import { MediaError } from "@/core/media-errors";
import { mediaRouteError, requireAuthorizedMedia, serializeMedia } from "@/core/media-api";
import { getObjectStorage } from "@/core/storage-provider";
import { prisma } from "@/db/client";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function POST(request: Request, route: RouteContext) {
  try {
    const { mediaId } = await route.params;
    const { context, media } = await requireAuthorizedMedia(request, mediaId, "MEDIA_WRITE");
    const storage = getObjectStorage();
    if (!canConfirmMediaUpload(media.status, storage.driver)) throw new MediaError("MEDIA_STATE_INVALID", 409);
    const object = await storage.headObject({ storageKey: media.storageKey });
    if (!object || object.sizeBytes !== Number(media.sizeBytes)) throw new MediaError("MEDIA_OBJECT_INVALID", 422);
    const finalStorageKey = await storage.promoteUpload({ storageKey: media.storageKey, etag: object.etag, versionId: object.versionId });
    const ready = await prisma.mediaAsset.update({ where: { id: media.id }, data: { status: "READY", storageKey: finalStorageKey } });
    if (finalStorageKey !== media.storageKey) {
      await storage.deleteObject({ storageKey: media.storageKey }).catch(() => undefined);
    }
    await recordSecurityAudit({ action: "MEDIA_READY", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "MediaAsset", entityId: media.id });
    return NextResponse.json({ media: serializeMedia(ready) });
  } catch (error) {
    return mediaRouteError(error);
  }
}
