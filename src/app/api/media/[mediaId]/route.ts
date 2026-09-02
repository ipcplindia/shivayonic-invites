import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { AppAuthError } from "@/auth/errors";
import { hasPermission, permissionPolicy } from "@/auth/permissions";
import { MediaError } from "@/core/media-errors";
import { mediaRouteError, requireAuthorizedMedia, serializeMedia, serializeMediaDetail } from "@/core/media-api";
import { getObjectStorage } from "@/core/storage-provider";
import { prisma } from "@/db/client";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function GET(request: Request, route: RouteContext) {
  try {
    const { mediaId } = await route.params;
    const { context } = await requireAuthorizedMedia(request, mediaId, "MEDIA_READ");
    const media = await prisma.mediaAsset.findFirst({
      where: { id: mediaId, organizationId: context.organization.id },
      include: { project: { select: { id: true, name: true } }, createdBy: { select: { id: true, name: true } } },
    });
    if (!media) throw new MediaError("MEDIA_NOT_FOUND", 404);
    return NextResponse.json({ media: serializeMediaDetail(media) });
  } catch (error) {
    return mediaRouteError(error);
  }
}

export async function DELETE(request: Request, route: RouteContext) {
  try {
    const { mediaId } = await route.params;
    const { context, media } = await requireAuthorizedMedia(request, mediaId, "MEDIA_WRITE");
    const mode = new URL(request.url).searchParams.get("mode") ?? "archive";
    if (mode === "archive") {
      if (media.status === "ARCHIVED") throw new MediaError("MEDIA_STATE_INVALID", 409);
      const archived = await prisma.mediaAsset.update({ where: { id: media.id }, data: { status: "ARCHIVED", archivedAt: new Date() } });
      await recordSecurityAudit({ action: "MEDIA_ARCHIVED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "MediaAsset", entityId: media.id });
      return NextResponse.json({ media: serializeMedia(archived) });
    }
    if (mode !== "delete") throw new MediaError("INVALID_MEDIA_INPUT", 400);
    if (!hasPermission(context, permissionPolicy.canHardDeleteMedia)) {
      throw new AppAuthError("ROLE_NOT_ALLOWED", 403);
    }
    await getObjectStorage().deleteObject({ storageKey: media.storageKey });
    await prisma.mediaAsset.delete({ where: { id: media.id } });
    await recordSecurityAudit({ action: "MEDIA_DELETED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "MediaAsset", entityId: media.id });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return mediaRouteError(error);
  }
}
