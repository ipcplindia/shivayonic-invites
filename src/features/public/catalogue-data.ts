import "server-only";

import { headers } from "next/headers";

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
