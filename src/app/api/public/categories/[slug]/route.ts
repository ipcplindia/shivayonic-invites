import { NextResponse } from "next/server";

import { prisma } from "@/db/client";
import { getPublicOrganizationId } from "@/core/public-organization";

export async function GET(_: Request, route: { params: Promise<{ slug: string }> }) {
  const { slug } = await route.params;
  const organizationId = await getPublicOrganizationId();
  const category = await prisma.publicCategory.findFirst({ where: { slug, active: true, organizationId }, select: { id: true, slug: true, name: true, parent: { select: { slug: true } }, children: { where: { active: true, organizationId }, select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } } } });
  if (!category) return NextResponse.json({ error: { code: "PUBLIC_CATEGORY_NOT_FOUND" } }, { status: 404 });
  return NextResponse.json({ category: { id: category.id, slug: category.slug, name: category.name, parentSlug: category.parent?.slug ?? null, children: category.children.map((child) => ({ ...child, parentSlug: category.slug })) } });
}
