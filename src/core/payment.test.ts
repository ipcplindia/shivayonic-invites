import { describe, expect, it, vi } from "vitest";
import { assertPaymentTransition, assertPaymentsEnabled, assertRefundAmount, resolvePayableAmount } from "./payment";

describe("payment security foundation", () => {
  const approved = { mode: "FULL" as const, totalOrderAmountMinor: 5_000_000n, approvedAmountMinor: 5_000_000n, amountAlreadyPaidMinor: 0n };
  it("rejects browser money and currency fields", () => {
    expect(() => resolvePayableAmount({ ...approved, clientAmountMinor: 1n })).toThrow("CLIENT_PAYMENT_FIELDS_REJECTED");
    expect(() => resolvePayableAmount({ ...approved, currency: "USD" })).toThrow("CLIENT_PAYMENT_FIELDS_REJECTED");
  });
  it("uses approved integer server amounts", () => expect(resolvePayableAmount(approved).amountMinor).toBe(5_000_000n));
  it("rejects forged paid transitions and illegal state jumps", () => {
    expect(() => assertPaymentTransition("DRAFT", "PAID")).toThrow("PAYMENT_PROVIDER_VERIFICATION_REQUIRED");
    expect(() => assertPaymentTransition("PROCESSING", "PAID")).toThrow("PAYMENT_PROVIDER_VERIFICATION_REQUIRED");
    expect(() => assertPaymentTransition("FAILED", "READY")).toThrow("INVALID_PAYMENT_STATE");
  });
  it("prevents refund overrun", () => {
    expect(() => assertRefundAmount({ capturedAmountMinor: 100n, refundedAmountMinor: 80n, requestedAmountMinor: 21n })).toThrow("INVALID_REFUND_AMOUNT");
  });
  it("keeps provider initiation disabled by default", () => {
    vi.stubEnv("PAYMENTS_ENABLED", "false");
    expect(() => assertPaymentsEnabled()).toThrow("PAYMENTS_DISABLED");
    vi.unstubAllEnvs();
  });
});
