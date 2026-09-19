import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assertPaymentEnvironment, newPaymentEnvironment, razorpayConfig, razorpayMode } from "./razorpay";

beforeEach(() => {
  vi.stubEnv("RAZORPAY_MODE", "TEST");
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "api-secret-fixture");
  vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook-secret-fixture");
  vi.stubEnv("VERCEL_ENV", undefined);
  vi.stubEnv("PAYMENTS_ENABLED", "true");
});
afterEach(() => vi.unstubAllEnvs());

describe("Razorpay configuration", () => {
  it.each([
    ["TEST", "rzp_test_fixture", "preview"],
    ["LIVE", "rzp_live_fixture", "production"],
  ])("accepts explicit %s mode with matching credentials and deployment", (mode, key, deployment) => {
    vi.stubEnv("RAZORPAY_MODE", mode);
    vi.stubEnv("RAZORPAY_KEY_ID", key);
    vi.stubEnv("VERCEL_ENV", deployment);
    expect(razorpayConfig()).toEqual({ mode, key, secret: "api-secret-fixture", webhookSecret: "webhook-secret-fixture" });
  });

  it.each([undefined, "", "test", "live", "INVALID", " TEST "])("rejects missing or invalid mode (%s) even with valid credentials", (mode) => {
    vi.stubEnv("RAZORPAY_MODE", mode);
    expect(razorpayMode).toThrow("RAZORPAY_CONFIGURATION_REQUIRED");
    expect(razorpayConfig).toThrow("RAZORPAY_CONFIGURATION_REQUIRED");
  });

  it.each([
    ["LIVE", "preview"],
    ["TEST", "production"],
  ])("rejects %s mode in %s deployments", (mode, deployment) => {
    vi.stubEnv("RAZORPAY_MODE", mode);
    vi.stubEnv("VERCEL_ENV", deployment);
    expect(razorpayConfig).toThrow("RAZORPAY_ENVIRONMENT_MISMATCH");
  });

  it.each([
    ["TEST", "rzp_live_fixture"],
    ["LIVE", "rzp_test_fixture"],
    ["TEST", "invalid_fixture"],
    ["LIVE", "invalid_fixture"],
  ])("rejects a key outside %s mode's prefix (%s)", (mode, key) => {
    vi.stubEnv("RAZORPAY_MODE", mode);
    vi.stubEnv("RAZORPAY_KEY_ID", key);
    expect(razorpayConfig).toThrow("RAZORPAY_CONFIGURATION_REQUIRED");
  });

  it.each(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"])("requires a nonblank %s", (name) => {
    for (const value of [undefined, "", " \t "]) {
      vi.stubEnv(name, value);
      expect(razorpayConfig).toThrow("RAZORPAY_CONFIGURATION_REQUIRED");
    }
  });

  it("rejects identical API and webhook secrets", () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "api-secret-fixture");
    expect(razorpayConfig).toThrow("RAZORPAY_CONFIGURATION_REQUIRED");
  });

  it("does not expose environment credentials in configuration errors", () => {
    const key = "rzp_live_private-key-fixture";
    const secret = "private-api-secret-fixture";
    const webhookSecret = "private-webhook-secret-fixture";
    vi.stubEnv("RAZORPAY_KEY_ID", key);
    vi.stubEnv("RAZORPAY_KEY_SECRET", secret);
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", webhookSecret);
    let error: unknown;
    try { razorpayConfig(); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("RAZORPAY_CONFIGURATION_REQUIRED");
    for (const value of [key, secret, webhookSecret]) expect(String(error)).not.toContain(value);
  });
});

describe("payment environment binding", () => {
  it.each([undefined, "false"])("allows unconfigured enquiries only while payments are disabled (%s)", (enabled) => {
    vi.stubEnv("PAYMENTS_ENABLED", enabled);
    vi.stubEnv("RAZORPAY_MODE", undefined);
    expect(newPaymentEnvironment()).toBeNull();
    vi.stubEnv("RAZORPAY_MODE", "");
    expect(newPaymentEnvironment()).toBeNull();
  });

  it("requires explicit mode when payments are enabled", () => {
    vi.stubEnv("RAZORPAY_MODE", undefined);
    expect(newPaymentEnvironment).toThrow("RAZORPAY_CONFIGURATION_REQUIRED");
  });

  it("rejects invalid configured mode even when payments are disabled", () => {
    vi.stubEnv("PAYMENTS_ENABLED", "false");
    vi.stubEnv("RAZORPAY_MODE", "invalid");
    expect(newPaymentEnvironment).toThrow("RAZORPAY_CONFIGURATION_REQUIRED");
  });

  it.each(["TEST", "LIVE"] as const)("binds new payments and accepts only matching stored %s environment", (mode) => {
    vi.stubEnv("RAZORPAY_MODE", mode);
    expect(newPaymentEnvironment()).toBe(mode);
    vi.stubEnv("PAYMENTS_ENABLED", "false");
    expect(newPaymentEnvironment()).toBe(mode);
    expect(assertPaymentEnvironment(mode)).toBe(mode);
    for (const stored of [null, undefined, "", "invalid", mode.toLowerCase(), mode === "TEST" ? "LIVE" : "TEST"]) {
      expect(() => assertPaymentEnvironment(stored)).toThrow("PAYMENT_ENVIRONMENT_MISMATCH");
    }
  });

  it("cannot authorize stored payments without a valid active mode", () => {
    vi.stubEnv("RAZORPAY_MODE", undefined);
    expect(() => assertPaymentEnvironment("TEST")).toThrow("RAZORPAY_CONFIGURATION_REQUIRED");
  });
});
