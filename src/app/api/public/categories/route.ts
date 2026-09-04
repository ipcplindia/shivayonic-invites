import { NextResponse } from "next/server";

import { catalogueCategoryTree } from "@/core/catalogue";
import { prisma } from "@/db/client";
import { getPublicOrganizationId } from "@/core/public-organization";

export async function GET() {
  const categories = await prisma.publicCategory.findMany({ where: { active: true, organizationId: await getPublicOrganizationId() }, select: { id: true, slug: true, name: true, parent: { select: { slug: true } } }, orderBy: { name: "asc" } });
  return NextResponse.json({ categories: catalogueCategoryTree(categories.map((category) => ({ id: category.id, slug: category.slug, name: category.name, parentSlug: category.parent?.slug ?? null }))) });
}
