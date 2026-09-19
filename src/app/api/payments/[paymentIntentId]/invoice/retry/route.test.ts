import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), find: vi.fn(), run: vi.fn(), enabled: vi.fn() }));
vi.mock("@/auth/context", () => ({ requirePermission: mocks.permission }));
vi.mock("@/db/client", () => ({ prisma: { paymentIntent: { findFirst: mocks.find } } }));
vi.mock("@/core/paid-order-workflow", () => ({ createInvoiceForPaidOrder: mocks.run, zohoInvoicingEnabled: mocks.enabled }));

import { POST } from "./route";

describe("invoice run route", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("RAZORPAY_MODE", "TEST"); vi.stubEnv("VERCEL_ENV", "development"); });
  afterEach(() => vi.unstubAllEnvs());
  it.each(["TEST", "LIVE"])("allows an OWNER to invoice a matching %s PAID payment when enabled", async providerEnvironment => {
    vi.stubEnv("RAZORPAY_MODE", providerEnvironment);
    mocks.permission.mockResolvedValue({ role: "OWNER", organization: { id: "org-1" } });
    mocks.enabled.mockReturnValue(true);
    mocks.find.mockResolvedValue({ id: "payment-1", status: "PAID", invoiceStatus: null, providerEnvironment });
    const response = await POST(new Request("https://preview.test/api/payments/payment-1/invoice/retry", { method: "POST" }), { params: Promise.resolve({ paymentIntentId: "payment-1" }) });
    expect(response.status).toBe(200);
    expect(mocks.run).toHaveBeenCalledWith("payment-1");
    expect(mocks.find.mock.calls[0][0].where).toEqual({ id: "payment-1", organizationId: "org-1", providerEnvironment });
  });

  it("does not start an invoice for a non-PAID or already completed payment", async () => {
    mocks.permission.mockResolvedValue({ role: "OWNER", organization: { id: "org-1" } });
    mocks.enabled.mockReturnValue(true);
    mocks.find.mockResolvedValue({ id: "payment-1", status: "PAID", invoiceStatus: "PAID", providerEnvironment: "TEST" });
    const response = await POST(new Request("https://preview.test/api/payments/payment-1/invoice/retry", { method: "POST" }), { params: Promise.resolve({ paymentIntentId: "payment-1" }) });
    expect(response.status).toBe(409);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it.each([["TEST", "LIVE"], ["LIVE", "TEST"], ["TEST", null], ["LIVE", null]])("does not dispatch a %s retry for a stored %s payment", async (mode, providerEnvironment) => {
    vi.stubEnv("RAZORPAY_MODE", mode!); mocks.permission.mockResolvedValue({ role: "OWNER", organization: { id: "org-1" } }); mocks.enabled.mockReturnValue(true);
    mocks.find.mockResolvedValue({ id: "payment-1", status: "PAID", invoiceStatus: "RETRY_REQUIRED", providerEnvironment });
    const response = await POST(new Request("https://preview.test/api/payments/payment-1/invoice/retry", { method: "POST" }), { params: Promise.resolve({ paymentIntentId: "payment-1" }) });
    expect(response.status).toBe(409); expect(mocks.run).not.toHaveBeenCalled();
  });
});
