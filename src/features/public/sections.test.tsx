import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlansSection } from "./sections";
import { CartProvider } from "./cart";

function renderPlans(showPrices?: boolean) {
  return renderToStaticMarkup(<CartProvider><PlansSection showPrices={showPrices} /></CartProvider>);
}

describe("PlansSection pricing visibility", () => {
  it("omits prices outside the dedicated plans page", () => {
    const html = renderPlans(false);
    expect(html).not.toContain("₹50,000");
    expect(html).not.toContain("₹75,000");
    expect(html).not.toContain("₹1,00,000");
  });

  it("keeps prices available on the plans page", () => {
    const html = renderPlans();
    expect(html).toContain("₹50,000");
    expect(html).toContain("₹75,000");
    expect(html).toContain("₹1,00,000");
  });
});
