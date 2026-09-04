import { NextResponse } from "next/server";

import { catalogueProductInclude, catalogueProductShape } from "@/core/catalogue-api";
import { serializeCollection } from "@/core/catalogue";
import { prisma } from "@/db/client";
import { getPublicOrganizationId } from "@/core/public-organization";

export async function GET() {
  const organizationId = await getPublicOrganizationId();
  const collections = await prisma.publicCollection.findMany({ where: { active: true }, include: { products: { orderBy: { displayOrder: "asc" }, where: { product: { status: "PUBLISHED", organizationId } }, include: { product: { include: catalogueProductInclude } } } }, orderBy: { displayOrder: "asc" } });
  return NextResponse.json({ collections: collections.map((collection) => serializeCollection({ ...collection, products: collection.products.map(({ product }) => ({ product: catalogueProductShape(product) })) })) });
}
