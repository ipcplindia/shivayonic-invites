import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { recordSecurityAudit } from "@/auth/audit";
import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { assertPublishableMedia } from "@/core/website-publication";
import { prisma } from "@/db/client";
import { publicPathsForPlacement, websitePublicationUpdateSchema } from "@/shared/website-publication";

type RouteContext = { params: Promise<{ publicationId: string }> };
function failure(error: unknown) {
  if (error instanceof AppAuthError) return authErrorResponse(error);
  if (error instanceof Error && error.message === "PUBLICATION_MEDIA_NOT_READY") return NextResponse.json({ error: { code: "PUBLICATION_MEDIA_NOT_READY" } }, { status: 409 });
  return NextResponse.json({ error: { code: "PUBLICATION_UNAVAILABLE" } }, { status: 503 });
}

export async function GET(request: Request, route: RouteContext) {
  try {
    const context = await requirePermission("PUBLISH_CONTENT", { headers: request.headers });
    const { publicationId } = await route.params;
    const publication = await prisma.websitePublication.findFirst({ where: { id: publicationId, organizationId: context.organization.id }, include: { mediaAsset: { select: { id: true, kind: true, status: true, originalFilename: true, mimeType: true, displayTitle: true, altText: true, description: true } } } });
    return publication ? NextResponse.json({ publication }) : NextResponse.json({ error: { code: "PUBLICATION_NOT_FOUND" } }, { status: 404 });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: Request, route: RouteContext) {
  try {
    const context = await requirePermission("PUBLISH_CONTENT", { headers: request.headers });
    const { publicationId } = await route.params;
    const parsed = websitePublicationUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_PUBLICATION_INPUT" } }, { status: 400 });
    const publication = await prisma.websitePublication.findFirst({ where: { id: publicationId, organizationId: context.organization.id }, include: { mediaAsset: true } });
    if (!publication) return NextResponse.json({ error: { code: "PUBLICATION_NOT_FOUND" } }, { status: 404 });
    if (parsed.data.action === "publish") assertPublishableMedia(publication.mediaAsset, context.organization.id);
    const now = new Date();
    const { action, ...fields } = parsed.data;
    const next = await prisma.websitePublication.update({ where: { id: publication.id }, data: {
      ...fields, updatedByUserId: context.user.id,
      ...(action === "publish" ? { status: "PUBLISHED", publishedAt: now, unpublishedAt: null } : {}),
      ...(action === "unpublish" ? { status: "UNPUBLISHED", unpublishedAt: now } : {}),
    } });
    for (const path of publicPathsForPlacement[next.placement]) revalidatePath(path);
    await recordSecurityAudit({ action: action === "publish" ? "WEBSITE_PUBLICATION_PUBLISHED" : action === "unpublish" ? "WEBSITE_PUBLICATION_UNPUBLISHED" : "WEBSITE_PUBLICATION_UPDATED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "WebsitePublication", entityId: next.id });
    return NextResponse.json({ publication: next });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request, route: RouteContext) {
  try {
    const context = await requirePermission("PUBLISH_CONTENT", { headers: request.headers });
    const { publicationId } = await route.params;
    const publication = await prisma.websitePublication.findFirst({ where: { id: publicationId, organizationId: context.organization.id } });
    if (!publication) return NextResponse.json({ error: { code: "PUBLICATION_NOT_FOUND" } }, { status: 404 });
    await prisma.websitePublication.delete({ where: { id: publication.id } });
    for (const path of publicPathsForPlacement[publication.placement]) revalidatePath(path);
    await recordSecurityAudit({ action: "WEBSITE_PUBLICATION_DELETED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "WebsitePublication", entityId: publication.id });
    return NextResponse.json({ ok: true });
  } catch (error) { return failure(error); }
}
