import { NextResponse } from "next/server";

import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { adminFailure, assertReadyMedia, auditCatalogue, revalidateCatalogue } from "@/core/catalogue-admin";
import { categoryInputSchema } from "@/core/catalogue-management";
import { prisma } from "@/db/client";

type RouteContext = { params: Promise<{ categoryId: string }> };
function failure(error: unknown) {
  if (error instanceof AppAuthError) return authErrorResponse(error);
  const result = adminFailure(error);
  return NextResponse.json({ error: { code: result.code } }, { status: result.status });
}

export async function PATCH(request: Request, route: RouteContext) {
  try {
    const context = await requirePermission("CATALOGUE_MANAGE", { headers: request.headers });
    const { categoryId } = await route.params;
    const parsed = categoryInputSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_CATEGORY_INPUT" } }, { status: 400 });
    await assertReadyMedia(parsed.data.mediaAssetId, context.organization.id);
    const category = await prisma.publicCategory.update({ where: { id: categoryId, organizationId: context.organization.id }, data: { ...parsed.data, ...(parsed.data.status ? { active: parsed.data.status === "PUBLISHED" } : {}) } });
    await auditCatalogue(context, "CATALOGUE_CATEGORY_CHANGED", "PublicCategory", category.id);
    revalidateCatalogue();
    return NextResponse.json({ category });
  } catch (error) { return failure(error); }
}
