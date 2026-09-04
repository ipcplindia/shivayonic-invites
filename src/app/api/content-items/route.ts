import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { createContentItem } from "@/core/publishing";
import { prisma } from "@/db/client";
import { contentItemCreateSchema } from "@/shared/content";

function failure(error: unknown) {
  if (error instanceof AppAuthError) return authErrorResponse(error);
  return NextResponse.json({ error: { code: "CONTENT_UNAVAILABLE" } }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const context = await requirePermission("CONTENT_MANAGE", { headers: request.headers });
    const items = await prisma.contentItem.findMany({
      where: { organizationId: context.organization.id },
      include: { masterMedia: { select: { id: true, kind: true, status: true, displayTitle: true, originalFilename: true } }, destinations: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const context = await requirePermission("CONTENT_MANAGE", { headers: request.headers });
    const parsed = contentItemCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_CONTENT_INPUT" } }, { status: 400 });
    const item = await createContentItem({ ...parsed.data, organizationId: context.organization.id, actorUserId: context.user.id });
    await recordSecurityAudit({ action: "CONTENT_ITEM_CREATED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "ContentItem", entityId: item.id });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) { return failure(error); }
}
