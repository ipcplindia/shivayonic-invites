import { createHmac } from "node:crypto";
import { Buffer } from "node:buffer";
import { describe, expect, it, vi, afterEach } from "vitest";
import { createPaymentCapability, paymentAccessSchema, validPaymentCapability } from "./payment-capability";
import { razorpayConfig, validHmac, verifyCheckout, verifyWebhook } from "./razorpay-provider";

afterEach(() => vi.unstubAllEnvs());
describe("public payment capability", () => {
  it("accepts a valid capability and rejects wrong, swapped and expired capabilities", () => {
    const first = createPaymentCapability("intent"); const second = createPaymentCapability("other");
    expect(validPaymentCapability(first.token, first.hash, first.expiresAt)).toBe(true);
    expect(validPaymentCapability(second.token, first.hash, first.expiresAt)).toBe(false);
    expect(validPaymentCapability(first.token, second.hash, second.expiresAt)).toBe(false);
    expect(validPaymentCapability(first.token, first.hash, new Date(0))).toBe(false);
    expect(validPaymentCapability("invalid", first.hash, first.expiresAt)).toBe(false);
  });
  it("rejects organization and all client payment authority", () => {
    for (const field of ["organizationId", "amount", "price", "currency", "status", "providerOrderId"]) {
      expect(paymentAccessSchema.safeParse({ paymentIntentId: "intent", paymentAccessToken: "a".repeat(64), [field]: "forged" }).success).toBe(false);
    }
  });
});
describe("Razorpay signatures and environment", () => {
  function configure() { vi.stubEnv("RAZORPAY_MODE", "TEST"); vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture"); vi.stubEnv("RAZORPAY_KEY_SECRET", "test-secret"); vi.stubEnv("VERCEL_ENV", "preview"); }
  it("verifies exact bytes and rejects malformed signatures", () => {
    const signature = createHmac("sha256", "fixture").update("raw").digest("hex");
    expect(validHmac("raw", signature, "fixture")).toBe(true);
    expect(validHmac("changed", signature, "fixture")).toBe(false);
    expect(validHmac("raw", "bad", "fixture")).toBe(false);
  });
  it("binds checkout signature to the stored order and payment", () => {
    configure(); const signature = createHmac("sha256", "test-secret").update("order_1|pay_1").digest("hex");
    expect(verifyCheckout("order_1", "pay_1", signature)).toBe(true);
    expect(verifyCheckout("order_2", "pay_1", signature)).toBe(false);
    expect(verifyCheckout("order_1", "pay_2", signature)).toBe(false);
  });
  it("fails closed without webhook secret", () => { configure(); vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", ""); expect(verifyWebhook(Buffer.from("{}"), "a".repeat(64))).toBe(false); });
  it("rejects live keys, mode and production execution", () => {
    configure(); vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_fixture"); expect(razorpayConfig).toThrow();
    configure(); vi.stubEnv("RAZORPAY_MODE", "LIVE"); expect(razorpayConfig).toThrow();
    configure(); vi.stubEnv("VERCEL_ENV", "production"); expect(razorpayConfig).toThrow();
  });
});
