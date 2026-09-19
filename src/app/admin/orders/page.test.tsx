import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ orders: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { checkoutEnquiry: { findMany: mocks.orders } } }));
vi.mock("@/auth/context", () => ({ getCurrentUserContext: async () => ({ role: "OWNER", organization: { id: "org" } }) }));
import OrdersPage from "./page";
describe("real admin order navigation", () => {
  beforeEach(() => { mocks.orders.mockResolvedValue([{ id: "order-a", customerName: "Customer", planKey: "GOLD", designName: "Design", eventDate: null, createdAt: new Date(), status: "PAYMENT_READY", paymentIntent: { amountMinor: 7500000n, status: "READY" } }]); });
  it("renders a native anchor with no click interception, scoped to the active organization", async () => {
    const html = renderToStaticMarkup(await OrdersPage());
    expect(html).toContain('<a href="/admin/orders/order-a">Customer</a>');
    expect(mocks.orders).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: "org" } }));
    expect(html).toContain("READY");
  });
});
