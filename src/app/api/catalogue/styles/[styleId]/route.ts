import { NextResponse } from "next/server";

import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { adminFailure, assertReadyMedia, auditCatalogue, revalidateCatalogue } from "@/core/catalogue-admin";
import { styleInputSchema } from "@/core/catalogue-management";
import { prisma } from "@/db/client";

type RouteContext = { params: Promise<{ styleId: string }> };
function failure(error: unknown) {
  if (error instanceof AppAuthError) return authErrorResponse(error);
  const result = adminFailure(error);
  return NextResponse.json({ error: { code: result.code } }, { status: result.status });
}

export async function PATCH(request: Request, route: RouteContext) {
  try {
    const context = await requirePermission("CATALOGUE_MANAGE", { headers: request.headers });
    const { styleId } = await route.params;
    const parsed = styleInputSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_STYLE_INPUT" } }, { status: 400 });
    await assertReadyMedia(parsed.data.mediaAssetId, context.organization.id);
    const style = await prisma.visualStyle.update({ where: { id: styleId, organizationId: context.organization.id }, data: { ...parsed.data, ...(parsed.data.status ? { active: parsed.data.status === "PUBLISHED" } : {}) } });
    await auditCatalogue(context, "CATALOGUE_STYLE_CHANGED", "VisualStyle", style.id);
    revalidateCatalogue();
    return NextResponse.json({ style });
  } catch (error) { return failure(error); }
}
