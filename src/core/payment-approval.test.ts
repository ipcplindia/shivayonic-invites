import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), findEnquiry: vi.fn(), createIntent: vi.fn(), updateEnquiry: vi.fn(), updateIntent: vi.fn(), audit: vi.fn(), email: vi.fn() }));
vi.mock("@/core/customer-order", () => ({ sendOrderEmail: mocks.email }));
vi.mock("@/db/client", () => ({ prisma: { $transaction: mocks.transaction } }));

import { approveCheckoutPayment } from "@/core/payment-approval";

describe("payment approval authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ checkoutEnquiry: { findFirst: mocks.findEnquiry, update: mocks.updateEnquiry }, paymentIntent: { create: mocks.createIntent, updateMany: mocks.updateIntent }, auditLog: { create: mocks.audit } }));
  });

  it("denies every payment approval to ADMIN", async () => {
    mocks.findEnquiry.mockResolvedValue({ id: "enquiry-1", planKey: "CUSTOM", paymentIntent: null });
    await expect(approveCheckoutPayment({ organizationId: "org-a", actorUserId: "admin", actorRole: "ADMIN", enquiryId: "enquiry-1", amountMinor: "5000000" })).rejects.toThrow("PAYMENT_APPROVAL_OWNER_REQUIRED");
    expect(mocks.createIntent).not.toHaveBeenCalled();
  });

  it("denies standard-plan approval to ADMIN before any database mutation", async () => {
    await expect(approveCheckoutPayment({ organizationId: "org-a", actorUserId: "admin", actorRole: "ADMIN", enquiryId: "enquiry-1" })).rejects.toThrow("PAYMENT_APPROVAL_OWNER_REQUIRED");
    expect(mocks.findEnquiry).not.toHaveBeenCalled();
  });

  it("creates a custom intent only from OWNER-approved integer minor units", async () => {
    mocks.findEnquiry.mockResolvedValue({ id: "enquiry-1", planKey: "CUSTOM", paymentIntent: null });
    mocks.createIntent.mockResolvedValue({ id: "intent-1", status: "READY" });
    await expect(approveCheckoutPayment({ organizationId: "org-a", actorUserId: "owner", actorRole: "OWNER", enquiryId: "enquiry-1", amountMinor: "5000000" })).resolves.toEqual(expect.objectContaining({ id: "intent-1" }));
    expect(mocks.createIntent).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amountMinor: 5_000_000n, status: "READY", paymentMode: "CUSTOM_APPROVED_AMOUNT" }) }));
  });
  it("rejects standard-plan approval because fixed plans are auto-ready", async () => {
    const enquiry = { id: "enquiry-1", planKey: "GOLD", customerEmail: "customer@example.test", paymentIntent: { id: "intent-1", organizationId: "org-a", status: "PENDING_APPROVAL", paymentMode: "FULL", paymentAccessExpiresAt: new Date(0) } };
    mocks.findEnquiry.mockResolvedValue(enquiry);
    await expect(approveCheckoutPayment({ organizationId: "org-a", actorUserId: "owner", actorRole: "OWNER", enquiryId: enquiry.id })).rejects.toThrow("STANDARD_PAYMENT_AUTO_READY");
    expect(mocks.updateIntent).not.toHaveBeenCalled();
  });
});
