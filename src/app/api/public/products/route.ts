import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { catalogueProductInclude, catalogueProductShape } from "@/core/catalogue-api";
import { cataloguePage, decodeCatalogueCursor, parseCatalogueFilters } from "@/core/catalogue";
import { prisma } from "@/db/client";

export async function GET(request: Request) {
  try {
    const filters = parseCatalogueFilters(new URL(request.url).searchParams);
    const cursor = filters.cursor ? decodeCatalogueCursor(filters.cursor) : undefined;
    const where: Prisma.PublicProductWhereInput = {
      status: "PUBLISHED",
      ...(filters.category ? { category: { slug: filters.category, active: true } } : {}),
      ...(filters.style ? { styles: { some: { style: { slug: filters.style, active: true } } } } : {}),
      ...(filters.productType ? { productType: filters.productType } : {}),
      ...(filters.featured === undefined ? {} : { featured: filters.featured }),
      ...(filters.q ? { OR: [{ name: { contains: filters.q, mode: "insensitive" } }, { shortDescription: { contains: filters.q, mode: "insensitive" } }] } : {}),
    };
    const products = await prisma.publicProduct.findMany({ where, include: catalogueProductInclude, orderBy: [{ displayOrder: "asc" }, { id: "asc" }], ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), take: filters.limit + 1 });
    return NextResponse.json(cataloguePage(products.map(catalogueProductShape), filters.limit));
  } catch (error) {
    return NextResponse.json({ error: { code: error instanceof Error && error.message.startsWith("INVALID_CATALOGUE") ? error.message : "PUBLIC_CATALOGUE_UNAVAILABLE" } }, { status: error instanceof Error && error.message.startsWith("INVALID_CATALOGUE") ? 400 : 503 });
  }
}
