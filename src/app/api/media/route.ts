import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { requirePermission } from "@/auth/context";
import { createMediaInputSchema, createMediaStorageKey, mediaKindForMimeType, validateMediaSize } from "@/core/media";
import { MediaError } from "@/core/media-errors";
import { mediaCursorWhere, pageMedia, parseMediaListRequest } from "@/core/media-list";
import { mediaRouteError, serializeMedia } from "@/core/media-api";
import { getObjectStorage } from "@/core/storage-provider";
import { prisma } from "@/db/client";
import type { MediaListResponse } from "@/shared/media";

export async function GET(request: Request) {
  try {
    const context = await requirePermission("MEDIA_READ", { headers: request.headers });
    const { searchParams } = new URL(request.url);
    const { cursor, limit, projectId, status, kind, q } = parseMediaListRequest(searchParams);
    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: context.organization.id }, select: { id: true } });
      if (!project) throw new MediaError("MEDIA_NOT_FOUND", 404);
    }
    const media = await prisma.mediaAsset.findMany({
      where: {
        organizationId: context.organization.id,
        projectId,
        ...(status ? { status: status as never } : {}),
        ...(kind ? { kind: kind as never } : {}),
        ...(q ? { originalFilename: { contains: q, mode: "insensitive" } } : {}),
        ...mediaCursorWhere(cursor),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const page = pageMedia(media, limit);
    const response: MediaListResponse = { media: page.items.map(serializeMedia), pageInfo: page.pageInfo };
    return NextResponse.json(response);
  } catch (error) {
    return mediaRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requirePermission("MEDIA_WRITE", { headers: request.headers });
    const parsed = createMediaInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new MediaError("INVALID_MEDIA_INPUT", 400);
    validateMediaSize(parsed.data.mimeType, parsed.data.sizeBytes);
    if (parsed.data.projectId) {
      const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, organizationId: context.organization.id }, select: { id: true } });
      if (!project) throw new MediaError("MEDIA_NOT_FOUND", 404);
    }

    const id = randomUUID();
    const storageKey = createMediaStorageKey(context.organization.id, id, parsed.data.mimeType);
    const media = await prisma.mediaAsset.create({
      data: {
        id,
        organizationId: context.organization.id,
        projectId: parsed.data.projectId,
        kind: mediaKindForMimeType(parsed.data.mimeType),
        originalFilename: parsed.data.originalFilename,
        storageKey,
        mimeType: parsed.data.mimeType,
        sizeBytes: BigInt(parsed.data.sizeBytes),
        createdByUserId: context.user.id,
      },
    });
    const target = await getObjectStorage().createUploadTarget({ storageKey, contentType: media.mimeType, sizeBytes: Number(media.sizeBytes) });
    await recordSecurityAudit({ action: "MEDIA_UPLOAD_CREATED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "MediaAsset", entityId: media.id, metadata: { mimeType: media.mimeType, sizeBytes: parsed.data.sizeBytes } });
    return NextResponse.json({ media: serializeMedia(media), upload: target ?? { url: `/api/media/${media.id}/upload`, method: "PUT", headers: { "content-type": media.mimeType } } }, { status: 201 });
  } catch (error) {
    return mediaRouteError(error);
  }
}
