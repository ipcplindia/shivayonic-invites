export type RazorpayMode = "TEST" | "LIVE";

/** Mode is explicit; credentials must agree with it, never choose it. */
export function razorpayMode(): RazorpayMode {
  const mode = process.env.RAZORPAY_MODE;
  if (mode !== "TEST" && mode !== "LIVE") throw new Error("RAZORPAY_CONFIGURATION_REQUIRED");
  if ((process.env.VERCEL_ENV === "preview" && mode !== "TEST") || (process.env.VERCEL_ENV === "production" && mode !== "LIVE")) throw new Error("RAZORPAY_ENVIRONMENT_MISMATCH");
  return mode;
}

/** Disabled, unconfigured checkout can persist enquiries, but cannot make them payable. */
export function newPaymentEnvironment() {
  if (process.env.PAYMENTS_ENABLED !== "true" && !process.env.RAZORPAY_MODE) return null;
  return razorpayMode();
}

export function assertPaymentEnvironment(environment: string | null | undefined) {
  const mode = razorpayMode();
  if (environment !== mode) throw new Error("PAYMENT_ENVIRONMENT_MISMATCH");
  return mode;
}

export function razorpayConfig() {
  const mode = razorpayMode();
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!key?.startsWith(mode === "TEST" ? "rzp_test_" : "rzp_live_") || !secret?.trim() || !webhookSecret?.trim() || secret === webhookSecret) throw new Error("RAZORPAY_CONFIGURATION_REQUIRED");
  return { key, secret, webhookSecret, mode };
}
