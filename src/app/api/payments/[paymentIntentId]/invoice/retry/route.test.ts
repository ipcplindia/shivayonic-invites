import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), find: vi.fn(), run: vi.fn(), enabled: vi.fn() }));
vi.mock("@/auth/context", () => ({ requirePermission: mocks.permission }));
vi.mock("@/db/client", () => ({ prisma: { paymentIntent: { findFirst: mocks.find } } }));
vi.mock("@/core/paid-order-workflow", () => ({ createInvoiceForPaidOrder: mocks.run, zohoInvoicingEnabled: mocks.enabled }));

import { POST } from "./route";

describe("invoice run route", () => {
  beforeEach(() => vi.clearAllMocks());
  it("allows an OWNER to start the first invoice for a PAID payment only when invoicing is enabled", async () => {
    mocks.permission.mockResolvedValue({ role: "OWNER", organization: { id: "org-1" } });
    mocks.enabled.mockReturnValue(true);
    mocks.find.mockResolvedValue({ id: "payment-1", status: "PAID", invoiceStatus: null });
    const response = await POST(new Request("https://preview.test/api/payments/payment-1/invoice/retry", { method: "POST" }), { params: Promise.resolve({ paymentIntentId: "payment-1" }) });
    expect(response.status).toBe(200);
    expect(mocks.run).toHaveBeenCalledWith("payment-1");
  });

  it("does not start an invoice for a non-PAID or already completed payment", async () => {
    mocks.permission.mockResolvedValue({ role: "OWNER", organization: { id: "org-1" } });
    mocks.enabled.mockReturnValue(true);
    mocks.find.mockResolvedValue({ id: "payment-1", status: "PAID", invoiceStatus: "PAID" });
    const response = await POST(new Request("https://preview.test/api/payments/payment-1/invoice/retry", { method: "POST" }), { params: Promise.resolve({ paymentIntentId: "payment-1" }) });
    expect(response.status).toBe(409);
    expect(mocks.run).not.toHaveBeenCalled();
  });
});
