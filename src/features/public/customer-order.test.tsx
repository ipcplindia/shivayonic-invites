import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerOrderSummary, type CustomerOrderData } from "./customer-order";
const order: CustomerOrderData = { reference: "ref", design: "Test", plan: "GOLD", eventDate: null, amount: "INR 75000", status: "PAYMENT_READY", paymentStatus: "READY", paymentIntentId: "intent" };
describe("customer payment availability", () => {
  it.each(["PENDING_APPROVAL", "PAID", "FAILED", "CANCELLED", "EXPIRED"])("hides payment action for %s", status => {
    const html = renderToStaticMarkup(<CustomerOrderSummary order={{ ...order, paymentStatus: status }} access="private" />);
    expect(html).not.toContain("Continue to Payment"); expect(html).not.toContain("private");
    if (status === "PAID") expect(html).toContain("Payment received");
  });
  it("READY has a functional payment component", () => { expect(renderToStaticMarkup(<CustomerOrderSummary order={order} access="private" />)).toContain("Continue to Payment"); });
});
