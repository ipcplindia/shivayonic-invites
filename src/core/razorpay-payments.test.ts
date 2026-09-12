import { beforeEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";
import { createPaymentCapability } from "./payment-capability";
const mocks = vi.hoisted(() => ({ find: vi.fn(), bind: vi.fn(), claim: vi.fn(), transaction: vi.fn(), createOrder: vi.fn(), config: vi.fn(), getPayment: vi.fn(), verify: vi.fn(), webhook: vi.fn(), event: vi.fn(), eventRequired: vi.fn(), eventCreate: vi.fn(), paid: vi.fn(), org: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { paymentIntent: { findFirst: mocks.find, updateMany: mocks.bind }, paymentIdempotencyKey: { createMany: mocks.claim }, $transaction: mocks.transaction, paymentProviderEvent: { findUnique: mocks.event, findUniqueOrThrow: mocks.eventRequired, createMany: mocks.eventCreate } } }));
vi.mock("./public-organization", () => ({ getPublicOrganizationId: mocks.org }));
vi.mock("./razorpay-provider", () => ({ razorpayConfig: mocks.config, createOrder: mocks.createOrder, getPayment: mocks.getPayment, verifyCheckout: mocks.verify, verifyWebhook: mocks.webhook }));
vi.mock("./payment", () => ({ assertPaymentsEnabled: () => { if (process.env.PAYMENTS_ENABLED !== "true") throw new Error("PAYMENTS_DISABLED"); }, applyVerifiedProviderEvent: mocks.paid }));
import { authorizePayment, initiatePayment, processRazorpayWebhook, verifyPayment } from "./razorpay-payments";
describe("Razorpay payment boundaries", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("PAYMENTS_ENABLED", "true"); mocks.config.mockReturnValue({ key: "rzp_test_fixture" }); mocks.org.mockResolvedValue("canonical"); });
  function intent() { const capability = createPaymentCapability("intent"); const row = { id: "intent", organizationId: "canonical", status: "READY", currency: "INR", amountMinor: 100n, paymentAccessHash: capability.hash, paymentAccessExpiresAt: capability.expiresAt, providerEnvironment: null, providerOrderId: null }; mocks.find.mockResolvedValue(row); return { row, capability }; }
  it("rejects guessed intents and binds lookup to canonical organization", async () => { mocks.find.mockResolvedValue(null); await expect(authorizePayment("guess", "a".repeat(64))).rejects.toThrow("PAYMENT_ACCESS_DENIED"); expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "guess", organizationId: "canonical" } })); });
  it("rejects swapped capabilities and LIVE records", async () => { const { row, capability } = intent(); await expect(authorizePayment("intent", createPaymentCapability("other").token)).rejects.toThrow(); mocks.find.mockResolvedValue({ ...row, providerEnvironment: "LIVE" }); await expect(authorizePayment("intent", capability.token)).rejects.toThrow(); });
  it("keeps READY when provider fails, retaining the claim", async () => { const { row, capability } = intent(); mocks.claim.mockResolvedValue({ count: 1 }); mocks.createOrder.mockRejectedValue(new Error("timeout")); await expect(initiatePayment("intent", capability.token)).rejects.toThrow(); expect(row.status).toBe("READY"); expect(mocks.transaction).not.toHaveBeenCalled(); });
  it("duplicate durable claim prevents a second provider call", async () => { const { capability } = intent(); mocks.claim.mockResolvedValue({ count: 0 }); await expect(initiatePayment("intent", capability.token)).rejects.toThrow("PAYMENT_RECONCILIATION_REQUIRED"); expect(mocks.createOrder).not.toHaveBeenCalled(); });
  it("disabled payments never contact provider", async () => { vi.stubEnv("PAYMENTS_ENABLED", "false"); await expect(initiatePayment("intent", "a".repeat(64))).rejects.toThrow("PAYMENTS_DISABLED"); expect(mocks.createOrder).not.toHaveBeenCalled(); });
  it("invalid webhook signature produces no persistence or PAID mutation", async () => { mocks.webhook.mockReturnValue(false); await expect(processRazorpayWebhook(Buffer.from("{}"), "bad", "event1")).rejects.toThrow("INVALID_WEBHOOK_SIGNATURE"); expect(mocks.eventCreate).not.toHaveBeenCalled(); expect(mocks.paid).not.toHaveBeenCalled(); });
  it("processed duplicate webhook is a no-op", async () => { const { createHash } = await import("node:crypto"); const raw = Buffer.from("{}"); mocks.webhook.mockReturnValue(true); mocks.event.mockResolvedValue({ payloadHash: createHash("sha256").update(raw).digest("hex"), processingStatus: "PROCESSED" }); await processRazorpayWebhook(raw, "signature", "event1"); expect(mocks.eventCreate).not.toHaveBeenCalled(); expect(mocks.paid).not.toHaveBeenCalled(); });
  it("uses a provider-fetched captured payment through the durable trusted event path", async () => {
    const { createHash } = await import("node:crypto");
    const { row, capability } = intent();
    mocks.find.mockResolvedValue({ ...row, status: "PROCESSING", provider: "RAZORPAY", providerEnvironment: "TEST", providerOrderId: "order_1" });
    mocks.verify.mockReturnValue(true);
    mocks.getPayment.mockResolvedValue({ id: "pay_1", order_id: "order_1", amount: 100, currency: "INR", status: "captured", captured: true });
    mocks.bind.mockResolvedValue({ count: 1 });
    mocks.eventRequired.mockResolvedValue({ id: "event-1", payloadHash: createHash("sha256").update("pay_1|order_1|100|INR|captured").digest("hex") });
    mocks.paid.mockResolvedValue({ status: "PAID" });
    const result = await verifyPayment({ paymentIntentId: "intent", paymentAccessToken: capability.token, razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "signature" });
    expect(mocks.eventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: [expect.objectContaining({ eventType: "payment.captured", captured: true, signatureVerified: true, paymentIntentId: "intent" })], skipDuplicates: true }));
    expect(mocks.paid).toHaveBeenCalledWith({ paymentIntentId: "intent", providerEventId: "event-1" });
    expect(result).toEqual({ status: "PAID" });
  });
});

