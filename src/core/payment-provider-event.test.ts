import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), findEvent: vi.fn(), findIntent: vi.fn(), updateIntent: vi.fn(), updateEvent: vi.fn(), audit: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { $transaction: mocks.transaction } }));

import { applyVerifiedProviderEvent } from "@/core/payment";

describe("verified provider event authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ paymentProviderEvent: { findFirst: mocks.findEvent, update: mocks.updateEvent }, paymentIntent: { findUnique: mocks.findIntent, update: mocks.updateIntent }, auditLog: { create: mocks.audit } }));
  });

  it("does not accept an unverified stored event", async () => {
    mocks.findEvent.mockResolvedValue(null);
    await expect(applyVerifiedProviderEvent({ paymentIntentId: "intent-1", providerEventId: "event-1" })).rejects.toThrow("VERIFIED_PROVIDER_EVENT_REQUIRED");
  });

  it("marks paid only after it reads a verified durable provider event", async () => {
    mocks.findEvent.mockResolvedValue({ id: "event-1", organizationId: "org-1", provider: "RAZORPAY", providerPaymentId: "pay-1", providerOrderId: "order-1", amountMinor: 5_000_000n, currency: "INR" });
    mocks.findIntent.mockResolvedValue({ id: "intent-1", organizationId: "org-1", status: "PROCESSING", provider: "RAZORPAY", providerOrderId: "order-1", providerPaymentId: null, amountMinor: 5_000_000n, currency: "INR" });
    mocks.updateIntent.mockResolvedValue({ id: "intent-1", status: "PAID", providerPaymentId: "pay-1" });
    await expect(applyVerifiedProviderEvent({ paymentIntentId: "intent-1", providerEventId: "event-1" })).resolves.toEqual(expect.objectContaining({ status: "PAID" }));
    expect(mocks.updateIntent).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PAID", providerPaymentId: "pay-1" }) }));
    expect(mocks.audit).toHaveBeenCalledTimes(2);
  });

  it("rejects a verified event from another organization, order, or amount", async () => {
    mocks.findEvent.mockResolvedValue({ id: "event-1", organizationId: "org-b", provider: "RAZORPAY", providerPaymentId: "pay-1", providerOrderId: "order-b", amountMinor: 1n, currency: "INR" });
    mocks.findIntent.mockResolvedValue({ id: "intent-1", organizationId: "org-a", status: "PROCESSING", provider: "RAZORPAY", providerOrderId: "order-a", providerPaymentId: null, amountMinor: 5_000_000n, currency: "INR" });
    await expect(applyVerifiedProviderEvent({ paymentIntentId: "intent-1", providerEventId: "event-1" })).rejects.toThrow("VERIFIED_PROVIDER_EVENT_MISMATCH");
    expect(mocks.updateIntent).not.toHaveBeenCalled();
  });
});
