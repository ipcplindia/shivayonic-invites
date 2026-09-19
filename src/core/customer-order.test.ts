import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createPaymentCapability, validPaymentCapability } from "./payment-capability";
const mocks = vi.hoisted(() => ({ find: vi.fn(), verification: vi.fn(), update: vi.fn(), audit: vi.fn(), transaction: vi.fn(), email: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { checkoutEnquiry: { findFirst: mocks.find }, verification: { findUnique: mocks.verification }, $transaction: mocks.transaction } }));
vi.mock("@/core/public-organization", () => ({ getPublicOrganizationId: async () => "org" }));
vi.mock("@/features/public/notify", () => ({ sendEmail: mocks.email }));
import { customerOrderPath, getCustomerOrder, resendOrderPaymentLink, sendOrderEmail } from "./customer-order";

describe("durable customer order access", () => {
  const capability = createPaymentCapability();
  const order = { id: "order-a", customerEmail: "customer@example.test", designName: "Test", planKey: "GOLD", eventDate: null, status: "PAYMENT_READY", paymentIntent: { id: "payment-a", enquiryId: "order-a", organizationId: "org", status: "READY", providerEnvironment: "TEST", amountMinor: 7500000n, currency: "INR", paymentAccessHash: capability.hash, paymentAccessExpiresAt: capability.expiresAt } };
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv("RAZORPAY_MODE", "TEST"); vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("VERCEL_BRANCH_URL", "test.vercel.app");
    mocks.find.mockResolvedValue(order); mocks.email.mockResolvedValue({ ok: true }); mocks.update.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async callback => callback({ checkoutEnquiry: { findFirst: mocks.find }, paymentIntent: { updateMany: mocks.update }, auditLog: { create: mocks.audit } }));
  });
  afterEach(() => vi.unstubAllEnvs());
  it("retains a bookmarkable token outside the HTTP URL", () => {
    const url = new URL(customerOrderPath("order-a", capability.token), "https://test.vercel.app");
    expect(url.search).toBe(""); expect(url.hash).toContain(capability.token);
  });
  it("works on repeated requests without a browser session and selects only public fields", async () => {
    const result = await getCustomerOrder("order-a", capability.token);
    expect(await getCustomerOrder("order-a", capability.token)).toEqual(result);
    expect(result.paymentStatus).toBe("READY");
    expect(JSON.stringify(result)).not.toMatch(/paymentAccessHash|customerEmail|signature|audit|provider|secret/);
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "order-a", organizationId: "org" } }));
  });
  it("rejects an incorrect or revoked token", async () => { await expect(getCustomerOrder("order-a", createPaymentCapability().token)).rejects.toThrow("PAYMENT_ACCESS_DENIED"); });
  it("rejects expired access", async () => { mocks.find.mockResolvedValue({ ...order, paymentIntent: { ...order.paymentIntent, paymentAccessExpiresAt: new Date(0) } }); await expect(getCustomerOrder("order-a", capability.token)).rejects.toThrow(); });
  it("rejects cross-enquiry and cross-organization bindings", async () => {
    await expect(getCustomerOrder("order-b", capability.token)).rejects.toThrow();
    mocks.find.mockResolvedValue({ ...order, paymentIntent: { ...order.paymentIntent, organizationId: "other" } });
    await expect(getCustomerOrder("order-a", capability.token)).rejects.toThrow();
  });
  it.each([["TEST", "LIVE"], ["LIVE", "TEST"], ["TEST", null], ["LIVE", null]])("rejects %s access to a %s payment before reissuing links", async (mode, providerEnvironment) => {
    vi.stubEnv("RAZORPAY_MODE", mode!); vi.stubEnv("VERCEL_ENV", "development");
    mocks.find.mockResolvedValue({ ...order, paymentIntent: { ...order.paymentIntent, providerEnvironment } });
    await expect(getCustomerOrder("order-a", capability.token)).rejects.toThrow("PAYMENT_ENVIRONMENT_MISMATCH");
    await expect(resendOrderPaymentLink({ organizationId: "org", actorUserId: "owner", actorRole: "OWNER", enquiryId: "order-a" })).rejects.toThrow("PAYMENT_ENVIRONMENT_MISMATCH");
    expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled(); expect(mocks.email).not.toHaveBeenCalled();
  });
  it("keeps pending custom quotes accessible when payments are unconfigured", async () => {
    vi.stubEnv("RAZORPAY_MODE", ""); vi.stubEnv("PAYMENTS_ENABLED", "false");
    mocks.find.mockResolvedValue({ ...order, planKey: "CUSTOM", paymentIntent: null });
    mocks.verification.mockResolvedValue({ identifier: "org", value: capability.hash, expiresAt: capability.expiresAt });
    expect(await getCustomerOrder("order-a", capability.token)).toEqual(expect.objectContaining({ paymentStatus: "PENDING_APPROVAL", paymentIntentId: null }));
  });
  it("uses random tokens and a 30-day expiry", () => {
    const a = createPaymentCapability("same"); const b = createPaymentCapability("same");
    expect(a.token).not.toBe(b.token); expect(a.hash).not.toBe(a.token);
    expect(a.expiresAt.getTime() - Date.now()).toBeGreaterThan(29 * 86400000);
    vi.stubEnv("PAYMENT_LINK_EXPIRY_DAYS", "1"); expect(() => createPaymentCapability()).toThrow();
  });
  it("OWNER can recover an existing READY order; only hash/expiry are stored", async () => {
    const result = await resendOrderPaymentLink({ organizationId: "org", actorUserId: "owner", actorRole: "OWNER", enquiryId: "order-a" });
    expect(result.delivered).toBe(true); expect(result.testUrl).toContain("#access=");
    const update = mocks.update.mock.calls[0][0]; const token = result.testUrl!.split("#access=")[1];
    expect(update.where.providerEnvironment).toBe("TEST");
    expect(validPaymentCapability(token, update.data.paymentAccessHash, update.data.paymentAccessExpiresAt)).toBe(true);
    expect(JSON.stringify(update)).not.toContain(token); expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain(token);
  });
  it("does not give production admins a token in the response", async () => {
    vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("RAZORPAY_MODE", "LIVE"); vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.shivayonic.com");
    mocks.find.mockResolvedValue({ ...order, paymentIntent: { ...order.paymentIntent, providerEnvironment: "LIVE" } });
    expect((await getCustomerOrder("order-a", capability.token)).paymentStatus).toBe("READY");
    expect(await resendOrderPaymentLink({ organizationId: "org", actorUserId: "owner", actorRole: "OWNER", enquiryId: "order-a" })).toEqual({ delivered: true });
    expect(mocks.update.mock.calls[0][0].where.providerEnvironment).toBe("LIVE");
  });
  it("denies resend to non-OWNER before DB work", async () => {
    await expect(resendOrderPaymentLink({ organizationId: "org", actorUserId: "staff", actorRole: "STAFF", enquiryId: "order-a" })).rejects.toThrow(); expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("does not resend PAID or mutate after a concurrent change", async () => {
    mocks.find.mockResolvedValue({ ...order, paymentIntent: { ...order.paymentIntent, status: "PAID" } });
    await expect(resendOrderPaymentLink({ organizationId: "org", actorUserId: "owner", actorRole: "OWNER", enquiryId: "order-a" })).rejects.toThrow();
    expect(mocks.update).not.toHaveBeenCalled();
    mocks.find.mockResolvedValue(order); mocks.update.mockResolvedValue({ count: 0 });
    await expect(resendOrderPaymentLink({ organizationId: "org", actorUserId: "owner", actorRole: "OWNER", enquiryId: "order-a" })).rejects.toThrow(); expect(mocks.email).not.toHaveBeenCalled();
  });
  it("emails the customer a ready link and tolerates delivery failure", async () => {
    expect(await sendOrderEmail(order, capability.token, true)).toBe(true);
    expect(mocks.email).toHaveBeenCalledWith(expect.objectContaining({ subject: "Your payment is ready", body: expect.stringContaining("#access=") }), order.customerEmail);
    mocks.email.mockRejectedValue(new Error("provider error")); expect(await sendOrderEmail(order, capability.token, false)).toBe(false);
  });
});
