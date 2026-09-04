import { Buffer } from "node:buffer";
import { URLSearchParams } from "node:url";

import type { CatalogueFilters, CatalogueListResponse, PublicCategory, PublicCategorySummary, PublicCollection, PublicProductDetail, PublicProductSummary, PublicProductType, VisualStyle } from "@/shared/catalogue";
import { safeFeatures } from "@/core/catalogue-management";

const productTypes = new Set<PublicProductType>(["INVITATION", "VIDEO_INVITATION", "AUDIO_INVITATION"]);
export const maxCataloguePageSize = 48;

export function parseCatalogueFilters(params: URLSearchParams): Required<Pick<CatalogueFilters, "limit">> & CatalogueFilters {
  const rawLimit = params.get("limit");
  const limit = rawLimit ? Number(rawLimit) : 24;
  const featured = params.get("featured");
  const productType = params.get("productType") || undefined;
  const q = params.get("q")?.trim() || undefined;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > maxCataloguePageSize || (q && q.length > 120) || (featured && featured !== "true" && featured !== "false") || (productType && !productTypes.has(productType as PublicProductType))) throw new Error("INVALID_CATALOGUE_FILTER");
  return { limit, category: params.get("category") || undefined, style: params.get("style") || undefined, productType: productType as PublicProductType | undefined, featured: featured === undefined || featured === null ? undefined : featured === "true", q, cursor: params.get("cursor") || undefined };
}

type ProductInput = { id: string; slug: string; name: string; shortDescription: string; fullDescription?: string | null; category: PublicCategorySummary; styles: VisualStyle[]; productType: string; startingPrice: number | null; pricingLabel: string | null; currency: string; ctaLabel?: string | null; ctaHref?: string | null; features?: unknown; turnaround?: string | null; duration?: string | null; coverMediaAssetId?: string | null; featured: boolean; displayOrder: number; media: { mediaAssetId: string; role: string; altText: string | null; displayOrder: number }[]; createdAt: Date; updatedAt: Date };

export function serializePublicProduct(product: ProductInput): PublicProductSummary {
  const cover = product.media.find((media) => media.role === "COVER");
  return { id: product.id, slug: product.slug, name: product.name, shortDescription: product.shortDescription, category: product.category, styles: product.styles, productType: product.productType as PublicProductType, startingPrice: product.startingPrice, pricingLabel: product.pricingLabel, currency: product.currency, coverMediaId: cover?.mediaAssetId ?? product.coverMediaAssetId ?? null, featured: product.featured, displayOrder: product.displayOrder, features: safeFeatures(product.features) };
}

export function serializePublicProductDetail(product: ProductInput): PublicProductDetail {
  return { ...serializePublicProduct(product), fullDescription: product.fullDescription, turnaround: product.turnaround, duration: product.duration, ctaLabel: product.ctaLabel, ctaHref: product.ctaHref, media: product.media.map((media) => ({ mediaId: media.mediaAssetId, role: media.role as PublicProductDetail["media"][number]["role"], altText: media.altText, displayOrder: media.displayOrder })), createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString() };
}

export function cataloguePage(products: ProductInput[], limit: number): CatalogueListResponse {
  const hasMore = products.length > limit;
  const items = hasMore ? products.slice(0, limit) : products;
  return { products: items.map(serializePublicProduct), pageInfo: { hasMore, nextCursor: hasMore ? Buffer.from(items.at(-1)!.id).toString("base64url") : null } };
}

export function decodeCatalogueCursor(cursor: string) {
  const id = Buffer.from(cursor, "base64url").toString("utf8");
  if (!id || id.length > 100) throw new Error("INVALID_CATALOGUE_CURSOR");
  return id;
}

export function catalogueCategoryTree(categories: PublicCategorySummary[]): PublicCategory[] {
  return categories.map((category) => ({ ...category, children: categories.filter((child) => child.parentSlug === category.slug) })).filter((category) => category.parentSlug === null);
}

export function serializeCollection(collection: { id: string; slug: string; name: string; shortDescription: string | null; coverMediaAssetId: string | null; displayOrder: number; products: { product: ProductInput }[] }): PublicCollection {
  return { id: collection.id, slug: collection.slug, name: collection.name, shortDescription: collection.shortDescription, coverMediaId: collection.coverMediaAssetId, displayOrder: collection.displayOrder, products: collection.products.map(({ product }) => serializePublicProduct(product)) };
}
