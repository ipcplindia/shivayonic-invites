import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { prisma } from "@/db/client";
import { contentItemUpdateSchema } from "@/shared/content";

function failure(error: unknown) {
  if (error instanceof AppAuthError) return authErrorResponse(error);
  return NextResponse.json({ error: { code: "CONTENT_UNAVAILABLE" } }, { status: 503 });
}

export async function PATCH(request: Request, route: { params: Promise<{ contentItemId: string }> }) {
  try {
    const context = await requirePermission("CONTENT_MANAGE", { headers: request.headers });
    const { contentItemId } = await route.params;
    const parsed = contentItemUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_CONTENT_INPUT" } }, { status: 400 });
    const current = await prisma.contentItem.findFirst({ where: { id: contentItemId, organizationId: context.organization.id }, select: { id: true } });
    if (!current) return NextResponse.json({ error: { code: "CONTENT_NOT_FOUND" } }, { status: 404 });
    const item = await prisma.contentItem.update({ where: { id: current.id }, data: { ...parsed.data, updatedByUserId: context.user.id } });
    await recordSecurityAudit({ action: "CONTENT_ITEM_UPDATED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "ContentItem", entityId: item.id });
    return NextResponse.json({ item });
  } catch (error) { return failure(error); }
}
