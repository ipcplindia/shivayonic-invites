import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
const mocks = vi.hoisted(() => ({ find: vi.fn(), remove: vi.fn(), create: vi.fn(), orders: vi.fn(), order: vi.fn(), transaction: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { verification: { findUnique: mocks.find, deleteMany: mocks.remove }, checkoutEnquiry: { findMany: mocks.orders }, $transaction: mocks.transaction } }));
vi.mock("@/core/public-organization", () => ({ getPublicOrganizationId: async () => "org" }));
import { customerIdentity, customerOrders, openCustomerOrder, verifyCustomerSignIn, signOutCustomer } from "./customer-account";
describe("verified customer identity", () => {
  const token = "a".repeat(64);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.find.mockResolvedValue({ identifier: "customer-email:org", value: "verified@example.test", expiresAt: new Date(Date.now() + 100000) });
    mocks.remove.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async callback => callback({ verification: { findUnique: mocks.find, deleteMany: mocks.remove, create: mocks.create }, checkoutEnquiry: { findFirst: mocks.order } }));
  });
  it("requires a real verified session; typed email is not identity", async () => {
    await expect(customerIdentity("verified@example.test")).rejects.toThrow();
    await expect(customerIdentity(undefined)).rejects.toThrow();
    mocks.find.mockResolvedValue(null); await expect(customerIdentity(token)).rejects.toThrow();
  });
  it("looks up only the customer session namespace", async () => {
    expect(await customerIdentity(token)).toEqual({ organizationId: "org", email: "verified@example.test" });
    expect(mocks.find).toHaveBeenCalledWith({ where: { id: `customer-session:${createHash("sha256").update(token).digest("hex")}` } });
  });
  it("scopes My Orders to verified email and canonical organization", async () => {
    await customerOrders(token);
    expect(mocks.orders.mock.calls[0][0].where).toEqual({ organizationId: "org", customerEmail: { equals: "verified@example.test", mode: "insensitive" } });
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
  it("revokes the session on logout", async () => { await signOutCustomer(token); expect(mocks.remove).toHaveBeenCalledWith({ where: { id: `customer-session:${createHash("sha256").update(token).digest("hex")}` } }); });
});
