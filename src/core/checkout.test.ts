import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), createEnquiry: vi.fn(), createIntent: vi.fn(), audit: vi.fn(), transaction: vi.fn(), organization: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { checkoutEnquiry: { findUnique: mocks.findUnique }, $transaction: mocks.transaction } }));
vi.mock("@/core/public-organization", () => ({ getPublicOrganizationId: mocks.organization }));

import { checkoutInputSchema, parseApprovedMinor, persistPublicCheckout, resolveCanonicalPlan } from "@/core/checkout";

const input = {
  idempotencyKey: "4187612f-6e12-46c8-a217-b3a2e5ac11f4",
  customer: { name: "Customer", email: "customer@example.test", phone: "9999999999", whatsapp: "", address1: "1 Test Road", address2: "", city: "Mumbai", state: "MH", pincode: "400001", country: "India", eventDate: "", eventLocation: "", notes: "", contactEmail: "yes", contactSms: "", marketing: "" },
  design: { slug: "floral", name: "Floral", occasion: "Wedding", style: "Classic" }, selectedPlan: "silver" as const, briefSubmitted: true,
};

describe("server-authoritative checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.organization.mockResolvedValue("org-1"); mocks.findUnique.mockResolvedValue(null);
    mocks.createEnquiry.mockResolvedValue({ id: "enquiry-1", status: "PAYMENT_PENDING_APPROVAL" });
    mocks.createIntent.mockResolvedValue({ id: "intent-1" });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ checkoutEnquiry: { create: mocks.createEnquiry }, paymentIntent: { create: mocks.createIntent }, auditLog: { create: mocks.audit } }));
  });

  it("rejects client price, money, currency, status, and provider fields", () => {
    for (const forbidden of ["price", "amount", "currency", "status", "provider", "providerPaymentId", "providerOrderId", "approvedAmount"]) {
      expect(checkoutInputSchema.safeParse({ ...input, [forbidden]: "forged" }).success).toBe(false);
    }
    expect(checkoutInputSchema.safeParse({ ...input, selectedPlan: "hidden" }).success).toBe(false);
  });

  it("uses server Silver pricing and persists an enquiry plus intent atomically", async () => {
    const result = await persistPublicCheckout(input);
    expect(result).toEqual(expect.objectContaining({ enquiryId: "enquiry-1", paymentIntentId: "intent-1", reused: false }));
    expect(mocks.createEnquiry).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ planKey: "SILVER" }) }));
    expect(mocks.createIntent).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amountMinor: 5_000_000n, currency: "INR", status: "PENDING_APPROVAL" }) }));
  });

  it("reuses an idempotent checkout without another payment intent", async () => {
    const { idempotencyKey, ...payload } = input;
    void idempotencyKey;
    mocks.findUnique.mockResolvedValue({ id: "enquiry-1", requestFingerprint: createHash("sha256").update(JSON.stringify(payload)).digest("hex"), status: "PAYMENT_PENDING_APPROVAL", paymentIntent: { id: "intent-1" } });
    await expect(persistPublicCheckout(input)).resolves.toEqual(expect.objectContaining({ reused: true, paymentIntentId: "intent-1" }));
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires integer, bounded custom approvals", () => {
    expect(resolveCanonicalPlan("customise")?.amountMinor).toBeNull();
    expect(() => parseApprovedMinor("1.5")).toThrow("INVALID_PAYMENT_AMOUNT");
    expect(() => parseApprovedMinor("-1")).toThrow("INVALID_PAYMENT_AMOUNT");
    expect(() => parseApprovedMinor("100000000000001")).toThrow("INVALID_PAYMENT_AMOUNT");
  });
});
