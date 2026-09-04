export const catalogueProductInclude = {
  category: { select: { id: true, slug: true, name: true, description: true, parent: { select: { slug: true } } } },
  styles: { include: { style: { select: { id: true, slug: true, name: true, description: true } } } },
  media: { select: { mediaAssetId: true, role: true, altText: true, displayOrder: true }, orderBy: { displayOrder: "asc" } },
} as const;

export function catalogueProductShape(product: {
  id: string; slug: string; name: string; shortDescription: string; fullDescription?: string | null; productType: string; pricingMode?: string | null; priceAmount?: number | null; startingPrice: number | null; pricingLabel: string | null; currency: string; ctaLabel?: string | null; ctaHref?: string | null; features?: unknown; turnaround?: string | null; duration?: string | null; coverMediaAssetId?: string | null; featured: boolean; displayOrder: number; createdAt: Date; updatedAt: Date;
  category: { id: string; slug: string; name: string; description?: string | null; parent: { slug: string } | null };
  styles: { style: { id: string; slug: string; name: string; description: string | null } }[];
  media: { mediaAssetId: string; role: string; altText: string | null; displayOrder: number }[];
}) {
  return { ...product, category: { id: product.category.id, slug: product.category.slug, name: product.category.name, description: product.category.description, parentSlug: product.category.parent?.slug ?? null }, styles: product.styles.map(({ style }) => style) };
}
