import { NextResponse } from "next/server";

import { catalogueProductInclude, catalogueProductShape } from "@/core/catalogue-api";
import { serializePublicProductDetail } from "@/core/catalogue";
import { prisma } from "@/db/client";

export async function GET(_: Request, route: { params: Promise<{ slug: string }> }) {
  const { slug } = await route.params;
  const product = await prisma.publicProduct.findFirst({ where: { slug, status: "PUBLISHED" }, include: catalogueProductInclude });
  if (!product) return NextResponse.json({ error: { code: "PUBLIC_PRODUCT_NOT_FOUND" } }, { status: 404 });
  return NextResponse.json({ product: serializePublicProductDetail(catalogueProductShape(product)) });
}
