import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { validPaymentCapability } from "./payment-capability";
const mocks = vi.hoisted(() => ({ find: vi.fn(), remove: vi.fn(), create: vi.fn(), upsert: vi.fn(), orders: vi.fn(), order: vi.fn(), update: vi.fn(), transaction: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { verification: { findUnique: mocks.find, deleteMany: mocks.remove }, checkoutEnquiry: { findMany: mocks.orders }, $transaction: mocks.transaction } }));
vi.mock("@/core/public-organization", () => ({ getPublicOrganizationId: async () => "org" }));
import { customerIdentity, customerOrders, openCustomerOrder, verifyCustomerSignIn, signOutCustomer } from "./customer-account";
describe("verified customer identity", () => {
  const token = "a".repeat(64);
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv("RAZORPAY_MODE", "TEST"); vi.stubEnv("VERCEL_ENV", "development");
    mocks.find.mockResolvedValue({ identifier: "customer-email:org", value: "verified@example.test", expiresAt: new Date(Date.now() + 100000) });
    mocks.remove.mockResolvedValue({ count: 1 });
    mocks.update.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async callback => callback({ verification: { findUnique: mocks.find, deleteMany: mocks.remove, create: mocks.create, upsert: mocks.upsert }, checkoutEnquiry: { findFirst: mocks.order }, paymentIntent: { updateMany: mocks.update } }));
  });
  afterEach(() => vi.unstubAllEnvs());
  it("requires a real verified session; typed email is not identity", async () => {
    await expect(customerIdentity("verified@example.test")).rejects.toThrow();
    await expect(customerIdentity(undefined)).rejects.toThrow();
    mocks.find.mockResolvedValue(null); await expect(customerIdentity(token)).rejects.toThrow();
  });
  it("looks up only the customer session namespace", async () => {
    expect(await customerIdentity(token)).toEqual({ organizationId: "org", email: "verified@example.test" });
    expect(mocks.find).toHaveBeenCalledWith({ where: { id: `customer-session:${createHash("sha256").update(token).digest("hex")}` } });
  });
  it.each(["TEST", "LIVE"])("scopes My Orders to verified email, canonical organization, and %s payments", async providerEnvironment => {
    vi.stubEnv("RAZORPAY_MODE", providerEnvironment);
    await customerOrders(token);
    expect(mocks.orders.mock.calls[0][0].where).toEqual({ organizationId: "org", customerEmail: { equals: "verified@example.test", mode: "insensitive" }, OR: [{ paymentIntent: null }, { paymentIntent: { providerEnvironment } }] });
  });
  it("lists only pending enquiries when payments are disabled and unconfigured", async () => {
    vi.stubEnv("RAZORPAY_MODE", ""); vi.stubEnv("PAYMENTS_ENABLED", "false");
    await customerOrders(token);
    expect(mocks.orders.mock.calls[0][0].where.OR).toEqual([{ paymentIntent: null }]);
  });
  it("rejects expired and other-organization sessions", async () => {
    mocks.find.mockResolvedValue({ identifier: "customer-email:other", expiresAt: new Date(Date.now() + 10000) }); await expect(customerIdentity(token)).rejects.toThrow();
    mocks.find.mockResolvedValue({ identifier: "customer-email:org", expiresAt: new Date(0) }); await expect(customerIdentity(token)).rejects.toThrow();
  });
  it("consumes magic links atomically and stores only hashed session tokens", async () => {
    const session = await verifyCustomerSignIn(token);
    expect(session).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.remove.mock.calls[0][0].where.expiresAt.gt).toBeInstanceOf(Date);
    expect(JSON.stringify(mocks.create.mock.calls)).not.toContain(session);
    expect(mocks.create.mock.calls[0][0].data.id).toMatch(/^customer-session:/);
  });
  it("rejects concurrent or replayed magic links", async () => {
    mocks.remove.mockResolvedValue({ count: 0 }); await expect(verifyCustomerSignIn(token)).rejects.toThrow(); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("does not open an order by ID without verified email ownership", async () => {
    mocks.order.mockResolvedValue(null); await expect(openCustomerOrder(token, "other-order")).rejects.toThrow();
    expect(mocks.order.mock.calls[0][0].where.customerEmail.equals).toBe("verified@example.test");
  });
  it.each(["TEST", "LIVE"])("opens a matching %s payment with a mode-bound capability rotation", async providerEnvironment => {
    vi.stubEnv("RAZORPAY_MODE", providerEnvironment);
    mocks.order.mockResolvedValue({ id: "order-1", paymentIntent: { id: "payment-1", organizationId: "org", providerEnvironment, paymentAccessHash: "old-hash" } });
    const path = await openCustomerOrder(token, "order-1");
    const update = mocks.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: "payment-1", organizationId: "org", enquiryId: "order-1", providerEnvironment, paymentAccessHash: "old-hash" });
    const accessToken = path.split("#access=")[1];
    expect(validPaymentCapability(accessToken, update.data.paymentAccessHash, update.data.paymentAccessExpiresAt)).toBe(true);
    expect(JSON.stringify(update)).not.toContain(accessToken);
  });
  it.each([["TEST", "LIVE"], ["LIVE", "TEST"], ["TEST", null], ["LIVE", null]])("rejects %s access to a %s payment without rotating capabilities", async (mode, providerEnvironment) => {
    vi.stubEnv("RAZORPAY_MODE", mode!);
    mocks.order.mockResolvedValue({ id: "order-1", paymentIntent: { id: "payment-1", organizationId: "org", providerEnvironment } });
    await expect(openCustomerOrder(token, "order-1")).rejects.toThrow("PAYMENT_ENVIRONMENT_MISMATCH");
    expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("rejects a capability rotation lost to a concurrent change", async () => {
    mocks.order.mockResolvedValue({ id: "order-1", paymentIntent: { id: "payment-1", organizationId: "org", providerEnvironment: "TEST" } });
    mocks.update.mockResolvedValue({ count: 0 });
    await expect(openCustomerOrder(token, "order-1")).rejects.toThrow("PAYMENT_ACCESS_DENIED");
  });
  it("opens a pending custom enquiry without configuring payments", async () => {
    vi.stubEnv("RAZORPAY_MODE", ""); vi.stubEnv("PAYMENTS_ENABLED", "false");
    mocks.order.mockResolvedValue({ id: "order-1", paymentIntent: null });
    expect(await openCustomerOrder(token, "order-1")).toMatch(/^\/order\/order-1#access=[a-f0-9]{64}$/);
    expect(mocks.upsert).toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it("revokes the session on logout", async () => { await signOutCustomer(token); expect(mocks.remove).toHaveBeenCalledWith({ where: { id: `customer-session:${createHash("sha256").update(token).digest("hex")}` } }); });
});
