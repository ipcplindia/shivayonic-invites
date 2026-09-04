import { NextResponse } from "next/server";

import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { adminFailure, assertReadyMedia, auditCatalogue, revalidateCatalogue } from "@/core/catalogue-admin";
import { categoryInputSchema } from "@/core/catalogue-management";
import { prisma } from "@/db/client";

function failure(error: unknown) {
  if (error instanceof AppAuthError) return authErrorResponse(error);
  const result = adminFailure(error);
  return NextResponse.json({ error: { code: result.code } }, { status: result.status });
}

export async function GET(request: Request) {
  try {
    const context = await requirePermission("CATALOGUE_MANAGE", { headers: request.headers });
    const rows = await prisma.publicCategory.findMany({ where: { OR: [{ organizationId: context.organization.id }, { organizationId: null }] }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    return NextResponse.json({ categories: rows });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const context = await requirePermission("CATALOGUE_MANAGE", { headers: request.headers });
    const parsed = categoryInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_CATEGORY_INPUT" } }, { status: 400 });
    await assertReadyMedia(parsed.data.mediaAssetId, context.organization.id);
    const category = await prisma.publicCategory.create({ data: { ...parsed.data, active: parsed.data.status === "PUBLISHED", organizationId: context.organization.id } });
    await auditCatalogue(context, "CATALOGUE_CATEGORY_CHANGED", "PublicCategory", category.id);
    revalidateCatalogue();
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) { return failure(error); }
}
