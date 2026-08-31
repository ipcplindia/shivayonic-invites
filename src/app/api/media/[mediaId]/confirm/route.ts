import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { MediaError } from "@/core/media-errors";
import { mediaRouteError, requireAuthorizedMedia, serializeMedia } from "@/core/media-api";
import { getObjectStorage } from "@/core/storage-provider";
import { prisma } from "@/db/client";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function POST(request: Request, route: RouteContext) {
  try {
    const { mediaId } = await route.params;
    const { context, media } = await requireAuthorizedMedia(request, mediaId, "MEDIA_WRITE");
    if (media.status !== "UPLOADED") throw new MediaError("MEDIA_STATE_INVALID", 409);
    const object = await getObjectStorage().headObject({ storageKey: media.storageKey });
    if (!object || object.sizeBytes !== Number(media.sizeBytes)) throw new MediaError("MEDIA_OBJECT_INVALID", 422);
    const ready = await prisma.mediaAsset.update({ where: { id: media.id }, data: { status: "READY" } });
    await recordSecurityAudit({ action: "MEDIA_READY", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "MediaAsset", entityId: media.id });
    return NextResponse.json({ media: serializeMedia(ready) });
  } catch (error) {
    return mediaRouteError(error);
  }
}
