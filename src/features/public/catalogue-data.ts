import "server-only";

import { headers } from "next/headers";

import { featuredProducts } from "@/features/public/data";
import type {
  CatalogueFilters,
  CatalogueListResponse,
  PublicCategory,
  PublicProductDetail,
  PublicProductSummary,
  VisualStyle,
} from "@/shared/catalogue";

/**
 * Server-side reader for the verified public catalogue APIs.
 *
 * Pages consume the real endpoints (never Prisma directly), so the published-only
 * filter, server pagination and search all live in one place — the route
 * handlers. Data is live (`no-store`); pages that use these are dynamic.
 */
async function apiBase() {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  return `${proto}://${host}`;
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${await apiBase()}${path}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
      // A catalogue read is never worth stalling a page render on. When the
      // database is unreachable the driver takes seconds to give up, and every
      // browsing page paid that before falling back to the showcase.
      signal: AbortSignal.timeout(1200),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function listProducts(filters: CatalogueFilters = {}): Promise<CatalogueListResponse> {
  const params = new URLSearchParams();
  for (const key of ["category", "style", "productType", "q", "cursor"] as const) {
    const value = filters[key];
    if (value) params.set(key, String(value));
  }
  if (filters.featured !== undefined) params.set("featured", String(filters.featured));
  if (filters.limit) params.set("limit", String(filters.limit));
  const data = await get<CatalogueListResponse>(`/api/public/products?${params.toString()}`);
  return data ?? { products: [], pageInfo: { nextCursor: null, hasMore: false } };
}

export async function getProduct(slug: string): Promise<PublicProductDetail | null> {
  const data = await get<{ product: PublicProductDetail }>(`/api/public/products/${slug}`);
  return data?.product ?? null;
}

export async function listStyles(): Promise<VisualStyle[]> {
  const data = await get<{ styles: VisualStyle[] }>("/api/public/styles");
  return data?.styles ?? [];
}

export async function listCategories(): Promise<PublicCategory[]> {
  const data = await get<{ categories: PublicCategory[] }>("/api/public/categories");
  return data?.categories ?? [];
}

/* --------------------------------------------------------------- showcase */

/**
 * The published designs the site already shows on the home page, expressed in
 * the same shape the catalogue APIs return.
 *
 * The catalogue database has no rows yet, so every catalogue surface rendered
 * an empty state while the home page showed four designs — the site looked
 * broken rather than new. These are those same four real designs, so a visitor
 * can browse and open one from anywhere. Nothing is invented: this list is the
 * artwork that exists. The moment the catalogue API returns rows, they win and
 * this is not used.
 */
function showcaseSummaries(): PublicProductSummary[] {
  return featuredProducts.map((design, index) => ({
    id: `showcase-${design.slug}`,
    slug: design.slug,
    name: design.name,
    shortDescription: design.blurb,
    category: {
      id: `showcase-${design.occasion}`,
      slug: slugify(design.occasion),
      name: design.occasion,
      parentSlug: null,
    },
    styles: [
      {
        id: `showcase-${design.style}`,
        slug: slugify(design.style),
        name: design.style,
        description: null,
      },
    ],
    productType: "INVITATION",
    startingPrice: null,
    pricingLabel: null,
    currency: "INR",
    coverMediaId: null,
    featured: true,
    displayOrder: index,
  }));
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Matches a design against the same filters the API applies. */
function matchesFilters(product: PublicProductSummary, filters: CatalogueFilters) {
  if (filters.category && product.category.slug !== filters.category) return false;
  if (filters.style && !product.styles.some((s) => s.slug === filters.style)) return false;
  if (filters.q) {
    const needle = filters.q.trim().toLowerCase();
    const hay = `${product.name} ${product.category.name} ${product.styles.map((s) => s.name).join(" ")}`;
    if (!hay.toLowerCase().includes(needle)) return false;
  }
  return true;
}

/**
 * The catalogue, preferring real records and falling back to the published
 * showcase so no browsing surface is ever blank.
 */
export async function listProductsForDisplay(
  filters: CatalogueFilters = {},
): Promise<CatalogueListResponse & { isShowcase: boolean }> {
  const live = await listProducts(filters);
  if (live.products.length > 0) return { ...live, isShowcase: false };

  const products = showcaseSummaries().filter((product) => matchesFilters(product, filters));
  return { products, pageInfo: { nextCursor: null, hasMore: false }, isShowcase: true };
}

/** Designs for one occasion, matched on the occasion name rather than a slug. */
export async function listDesignsForOccasion(occasion: string): Promise<PublicProductSummary[]> {
  const slug = slugify(occasion);
  const live = await listProducts({ category: slug, limit: 12 });
  if (live.products.length > 0) return live.products;
  return showcaseSummaries().filter((product) => product.category.slug === slug);
}

/* ------------------------------------------------------------- view helpers */

const toneByOrder = ["rose", "gold", "saffron", "teal", "sage", "cocoa"] as const;

/** A stable warm tone per product so the gradient tiles stay varied but consistent. */
export function toneForProduct(p: { id: string; displayOrder: number }) {
  return toneByOrder[Math.abs(p.displayOrder) % toneByOrder.length];
}

/** Display price: real starting price, else the pricing label, else nothing. */
export function priceLabel(p: PublicProductSummary): string | undefined {
  if (p.startingPrice != null) {
    const amount = new Intl.NumberFormat("en-IN").format(p.startingPrice);
    return `${p.currency === "INR" ? "₹" : ""}${amount}`;
  }
  return p.pricingLabel ?? undefined;
}
