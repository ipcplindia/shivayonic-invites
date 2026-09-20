import { describe, expect, it } from "vitest";

import { showcaseCatalogue, showcaseCollection, showcaseProduct } from "./catalogue-showcase";

describe("catalogue showcase API fallback", () => {
  it("exposes the existing four published designs without prices", () => {
    const result = showcaseCatalogue();
    expect(result.products).toHaveLength(4);
    expect(result.products.map((product) => product.slug)).toContain("diwali-nights");
    expect(result.products.every((product) => product.startingPrice === null && product.pricingLabel === null)).toBe(true);
  });

  it("applies the public catalogue filters", () => {
    expect(showcaseCatalogue({ q: "diwali" }).products.map((product) => product.slug)).toEqual(["diwali-nights"]);
    expect(showcaseCatalogue({ style: "floral" }).products.map((product) => product.slug)).toEqual(["mehendi-night"]);
    expect(showcaseCatalogue({ featured: false }).products).toEqual([]);
  });

  it("returns product detail and a non-empty collection", () => {
    expect(showcaseProduct("diwali-nights")?.name).toBe("Diwali Nights");
    expect(showcaseProduct("missing")).toBeNull();
    expect(showcaseCollection().products).toHaveLength(4);
  });
});
