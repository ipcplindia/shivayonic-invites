import { featuredProducts } from "@/features/public/data";
import type {
  CatalogueFilters,
  CatalogueListResponse,
  PublicCollection,
  PublicProductDetail,
  PublicProductSummary,
} from "@/shared/catalogue";

const SHOWCASE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * The four published designs that pre-date the catalogue database.
 *
 * They are exposed through the same public API contract only while the
 * database has no published products. No price is included: pricing remains
 * confined to the dedicated plans page.
 */
export function showcaseProducts(): PublicProductSummary[] {
  return featuredProducts.map((design, index) => {
    const categorySlug = slugify(design.occasion);
    const styleSlug = slugify(design.style);
    return {
      id: `showcase-${design.slug}`,
      slug: design.slug,
      name: design.name,
      shortDescription: design.blurb,
      category: {
        id: `showcase-category-${categorySlug}`,
        slug: categorySlug,
        name: design.occasion,
        parentSlug: null,
      },
      styles: [{
        id: `showcase-style-${styleSlug}`,
        slug: styleSlug,
        name: design.style,
        description: null,
      }],
      productType: "INVITATION",
      startingPrice: null,
      pricingLabel: null,
      currency: "INR",
      coverMediaId: null,
      featured: true,
      displayOrder: index,
    };
  });
}

export function showcaseMatchesFilters(product: PublicProductSummary, filters: CatalogueFilters) {
  if (filters.category && product.category.slug !== filters.category) return false;
  if (filters.style && !product.styles.some((style) => style.slug === filters.style)) return false;
  if (filters.productType && product.productType !== filters.productType) return false;
  if (filters.featured !== undefined && product.featured !== filters.featured) return false;
  if (filters.q) {
    const needle = filters.q.trim().toLowerCase();
    const haystack = `${product.name} ${product.shortDescription} ${product.category.name} ${product.styles.map((style) => style.name).join(" ")}`;
    if (!haystack.toLowerCase().includes(needle)) return false;
  }
  return true;
}

export function showcaseCatalogue(filters: CatalogueFilters = {}): CatalogueListResponse {
  const limit = filters.limit ?? 24;
  const products = showcaseProducts().filter((product) => showcaseMatchesFilters(product, filters)).slice(0, limit);
  return { products, pageInfo: { hasMore: false, nextCursor: null } };
}

export function showcaseProduct(slug: string): PublicProductDetail | null {
  const product = showcaseProducts().find((candidate) => candidate.slug === slug);
  if (!product) return null;
  return {
    ...product,
    fullDescription: product.shortDescription,
    turnaround: null,
    duration: null,
    ctaLabel: "Customize This Invite",
    ctaHref: "/customise/weddings-celebrations",
    media: [],
    createdAt: SHOWCASE_TIMESTAMP,
    updatedAt: SHOWCASE_TIMESTAMP,
  };
}

export function showcaseCollection(): PublicCollection {
  return {
    id: "showcase-featured-invitations",
    slug: "featured-invitations",
    name: "Featured Invitations",
    shortDescription: "Published invitation designs ready to personalise.",
    coverMediaId: null,
    displayOrder: 0,
    products: showcaseProducts(),
  };
}
