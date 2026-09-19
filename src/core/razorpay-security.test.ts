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
  function configure(mode: "TEST" | "LIVE" = "TEST") {
    const prefix = mode.toLowerCase();
    vi.stubEnv("RAZORPAY_MODE", mode);
    vi.stubEnv("RAZORPAY_KEY_ID", `rzp_${prefix}_fixture`);
    vi.stubEnv("RAZORPAY_KEY_SECRET", `${prefix}-secret`);
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", `${prefix}-webhook-secret`);
    vi.stubEnv("VERCEL_ENV", mode === "TEST" ? "preview" : "production");
  }
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
  it.each(["TEST", "LIVE"] as const)("uses only the active %s mode's secrets", (mode) => {
    configure(mode);
    const prefix = mode.toLowerCase();
    const other = mode === "TEST" ? "live" : "test";
    const raw = Buffer.from('{"event":"payment.captured"}');
    const sign = (body: string | Uint8Array, secret: string) => createHmac("sha256", secret).update(body).digest("hex");
    expect(razorpayConfig().mode).toBe(mode);
    expect(verifyCheckout("order_1", "pay_1", sign("order_1|pay_1", `${prefix}-secret`))).toBe(true);
    expect(verifyCheckout("order_1", "pay_1", sign("order_1|pay_1", `${other}-secret`))).toBe(false);
    expect(verifyCheckout("order_1", "pay_1", sign("order_1|pay_1", `${prefix}-webhook-secret`))).toBe(false);
    expect(verifyWebhook(raw, sign(raw, `${prefix}-webhook-secret`))).toBe(true);
    expect(verifyWebhook(raw, sign(raw, `${other}-webhook-secret`))).toBe(false);
    expect(verifyWebhook(raw, sign(raw, `${prefix}-secret`))).toBe(false);
    expect(verifyWebhook(Buffer.from("{}"), sign(raw, `${prefix}-webhook-secret`))).toBe(false);
  });
  it.each([undefined, "", " "])("fails closed without a usable webhook secret (%s)", (secret) => {
    configure();
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
    expect(() => verifyWebhook(Buffer.from("{}"), "a".repeat(64))).toThrow("RAZORPAY_CONFIGURATION_REQUIRED");
  });
});
