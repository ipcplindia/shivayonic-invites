export type PublicProductType = "INVITATION" | "VIDEO_INVITATION" | "AUDIO_INVITATION";
export type ProductMediaRole = "COVER" | "GALLERY" | "VIDEO_PREVIEW" | "AUDIO_PREVIEW";

export type PublicCategorySummary = { id: string; slug: string; name: string; parentSlug: string | null; description?: string | null };
export type PublicCategory = PublicCategorySummary & { children: PublicCategorySummary[] };
export type VisualStyle = { id: string; slug: string; name: string; description: string | null };
export type PublicProductMedia = { mediaId: string; role: ProductMediaRole; altText: string | null; displayOrder: number };
export type PublicProductSummary = { id: string; slug: string; name: string; shortDescription: string; category: PublicCategorySummary; styles: VisualStyle[]; productType: PublicProductType; startingPrice: number | null; pricingLabel: string | null; currency: string; coverMediaId: string | null; featured: boolean; displayOrder: number; features?: string[] };
export type PublicProductDetail = PublicProductSummary & { fullDescription?: string | null; turnaround?: string | null; duration?: string | null; ctaLabel?: string | null; ctaHref?: string | null; media: PublicProductMedia[]; createdAt: string; updatedAt: string };
export type PublicCollection = { id: string; slug: string; name: string; shortDescription: string | null; coverMediaId: string | null; displayOrder: number; products: PublicProductSummary[] };
export type CatalogueFilters = { category?: string; style?: string; productType?: PublicProductType; featured?: boolean; q?: string; cursor?: string; limit?: number };
export type CataloguePagination = { nextCursor: string | null; hasMore: boolean };
export type CatalogueListResponse = { products: PublicProductSummary[]; pageInfo: CataloguePagination };
export type PublicPlanSummary = { id: string; slug: string; name: string; subtitle: string | null; description: string; features: string[]; ctaLabel: string | null; ctaHref: string | null; recommended: boolean; sortOrder: number };
