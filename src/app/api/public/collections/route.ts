import { NextResponse } from "next/server";

import { catalogueProductInclude, catalogueProductShape } from "@/core/catalogue-api";
import { serializeCollection } from "@/core/catalogue";
import { prisma } from "@/db/client";

export async function GET() {
  const collections = await prisma.publicCollection.findMany({ where: { active: true }, include: { products: { orderBy: { displayOrder: "asc" }, where: { product: { status: "PUBLISHED" } }, include: { product: { include: catalogueProductInclude } } } }, orderBy: { displayOrder: "asc" } });
  return NextResponse.json({ collections: collections.map((collection) => serializeCollection({ ...collection, products: collection.products.map(({ product }) => ({ product: catalogueProductShape(product) })) })) });
}
