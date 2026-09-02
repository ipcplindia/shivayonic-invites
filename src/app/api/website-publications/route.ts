import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { assertPublishableMedia, publicationCreateData } from "@/core/website-publication";
import { prisma } from "@/db/client";
import { websitePublicationInputSchema } from "@/shared/website-publication";

function failure(error: unknown) {
  if (error instanceof AppAuthError) return authErrorResponse(error);
  if (error instanceof Error && error.message === "PUBLICATION_MEDIA_NOT_READY") return NextResponse.json({ error: { code: "PUBLICATION_MEDIA_NOT_READY" } }, { status: 409 });
  return NextResponse.json({ error: { code: "PUBLICATION_UNAVAILABLE" } }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const context = await requirePermission("PUBLISH_CONTENT", { headers: request.headers });
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get("placement") || undefined;
    const status = searchParams.get("status") || undefined;
    const publications = await prisma.websitePublication.findMany({
      where: { organizationId: context.organization.id, ...(placement ? { placement: placement as never } : {}), ...(status ? { status: status as never } : {}) },
      include: { mediaAsset: { select: { id: true, kind: true, status: true, originalFilename: true, mimeType: true, displayTitle: true } } },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json({ publications });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const context = await requirePermission("PUBLISH_CONTENT", { headers: request.headers });
    const parsed = websitePublicationInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_PUBLICATION_INPUT" } }, { status: 400 });
    const media = await prisma.mediaAsset.findFirst({ where: { id: parsed.data.mediaId, organizationId: context.organization.id } });
    if (!media) return NextResponse.json({ error: { code: "MEDIA_NOT_FOUND" } }, { status: 404 });
    assertPublishableMedia(media, context.organization.id);
    const { mediaId, ...input } = publicationCreateData(parsed.data, context.user.id);
    const publication = await prisma.websitePublication.create({ data: { ...input, mediaAssetId: mediaId, organizationId: context.organization.id } });
    await recordSecurityAudit({ action: "WEBSITE_PUBLICATION_CREATED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "WebsitePublication", entityId: publication.id });
    return NextResponse.json({ publication }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: { code: "PUBLICATION_EXISTS" } }, { status: 409 });
    return failure(error);
  }
}
