import { describe, expect, it } from "vitest";

import { submittedBriefMatchesDesign, type CartDesign } from "@/features/public/cart";

const celebrationDesign: CartDesign = {
  slug: "diwali-nights",
  name: "Diwali Nights",
  occasion: "Diwali",
  style: "Heritage",
  formSlug: "weddings-celebrations",
};

describe("submittedBriefMatchesDesign", () => {
  it("keeps a submitted brief when the subsequently selected design uses that form", () => {
    expect(submittedBriefMatchesDesign("weddings-celebrations", celebrationDesign)).toBe(true);
  });

  it("does not reuse a submitted brief for a different form", () => {
    expect(submittedBriefMatchesDesign("corporate-events", celebrationDesign)).toBe(false);
  });
});
