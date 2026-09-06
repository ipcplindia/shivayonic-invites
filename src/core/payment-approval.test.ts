import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), findEnquiry: vi.fn(), createIntent: vi.fn(), updateEnquiry: vi.fn(), updateIntent: vi.fn(), audit: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { $transaction: mocks.transaction } }));

import { approveCheckoutPayment } from "@/core/payment-approval";

describe("payment approval authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ checkoutEnquiry: { findFirst: mocks.findEnquiry, update: mocks.updateEnquiry }, paymentIntent: { create: mocks.createIntent, update: mocks.updateIntent }, auditLog: { create: mocks.audit } }));
  });

  it("denies a custom amount to ADMIN", async () => {
    mocks.findEnquiry.mockResolvedValue({ id: "enquiry-1", planKey: "CUSTOM", paymentIntent: null });
    await expect(approveCheckoutPayment({ organizationId: "org-a", actorUserId: "admin", actorRole: "ADMIN", enquiryId: "enquiry-1", amountMinor: "5000000" })).rejects.toThrow("CUSTOM_AMOUNT_OWNER_REQUIRED");
    expect(mocks.createIntent).not.toHaveBeenCalled();
  });

  it("creates a custom intent only from OWNER-approved integer minor units", async () => {
    mocks.findEnquiry.mockResolvedValue({ id: "enquiry-1", planKey: "CUSTOM", paymentIntent: null });
    mocks.createIntent.mockResolvedValue({ id: "intent-1", status: "READY" });
    await expect(approveCheckoutPayment({ organizationId: "org-a", actorUserId: "owner", actorRole: "OWNER", enquiryId: "enquiry-1", amountMinor: "5000000" })).resolves.toEqual(expect.objectContaining({ id: "intent-1" }));
    expect(mocks.createIntent).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amountMinor: 5_000_000n, status: "READY", paymentMode: "CUSTOM_APPROVED_AMOUNT" }) }));
  });
});
