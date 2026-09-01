export const catalogueProductInclude = {
  category: { select: { id: true, slug: true, name: true, parent: { select: { slug: true } } } },
  styles: { include: { style: { select: { id: true, slug: true, name: true, description: true } } } },
  media: { select: { mediaAssetId: true, role: true, altText: true, displayOrder: true }, orderBy: { displayOrder: "asc" } },
} as const;

export function catalogueProductShape(product: {
  id: string; slug: string; name: string; shortDescription: string; productType: string; startingPrice: number | null; pricingLabel: string | null; currency: string; featured: boolean; displayOrder: number; createdAt: Date; updatedAt: Date;
  category: { id: string; slug: string; name: string; parent: { slug: string } | null };
  styles: { style: { id: string; slug: string; name: string; description: string | null } }[];
  media: { mediaAssetId: string; role: string; altText: string | null; displayOrder: number }[];
}) {
  return { ...product, category: { id: product.category.id, slug: product.category.slug, name: product.category.name, parentSlug: product.category.parent?.slug ?? null }, styles: product.styles.map(({ style }) => style) };
}
