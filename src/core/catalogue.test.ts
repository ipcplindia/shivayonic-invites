import { describe, expect, it } from "vitest";
import { URLSearchParams } from "node:url";
import { catalogueCategoryTree, cataloguePage, parseCatalogueFilters, serializePublicProductDetail } from "./catalogue";

const product = { id: "product-1", slug: "royal-swayamvar", name: "Royal Swayamvar Invitation", shortDescription: "Demo", category: { id: "category-1", slug: "wedding", name: "Wedding", parentSlug: null }, styles: [{ id: "style-1", slug: "royal-cinematic", name: "Royal Cinematic", description: null }], productType: "INVITATION", startingPrice: 49900, pricingLabel: "Starting from", currency: "INR", featured: true, displayOrder: 1, media: [{ mediaAssetId: "media-safe-id", role: "COVER", altText: "Cover", displayOrder: 0 }], createdAt: new Date("2026-09-01T00:00:00.000Z"), updatedAt: new Date("2026-09-01T00:00:00.000Z") };

describe("public catalogue contract", () => {
  it("bounds allowlisted filters", () => {
    expect(parseCatalogueFilters(new URLSearchParams("category=wedding&style=royal-cinematic&productType=INVITATION&featured=true&limit=2"))).toMatchObject({ limit: 2, featured: true, productType: "INVITATION" });
    expect(() => parseCatalogueFilters(new URLSearchParams("productType=PRIVATE&limit=100"))).toThrow("INVALID_CATALOGUE_FILTER");
  });

  it("serializes only public display fields and pages deterministically", () => {
    const detail = serializePublicProductDetail(product);
    expect(detail).toMatchObject({ slug: "royal-swayamvar", coverMediaId: "media-safe-id", media: [{ mediaId: "media-safe-id" }] });
    expect(JSON.stringify(detail)).not.toMatch(/storageKey|organizationId|credential/i);
    expect(cataloguePage([product, { ...product, id: "product-2", slug: "floral-mehendi" }], 1).pageInfo).toMatchObject({ hasMore: true, nextCursor: expect.any(String) });
  });

  it("builds category hierarchy without route hardcoding", () => {
    expect(catalogueCategoryTree([{ id: "1", slug: "wedding", name: "Wedding", parentSlug: null }, { id: "2", slug: "wedding-pheras", name: "Pheras", parentSlug: "wedding" }])[0].children[0].slug).toBe("wedding-pheras");
  });
});
