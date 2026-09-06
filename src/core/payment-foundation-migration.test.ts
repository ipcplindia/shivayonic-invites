import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("prisma/migrations/20260906000000_payment_security_foundation/migration.sql", "utf8");

describe("payment foundation migration constraints", () => {
  it("enforces provider reference uniqueness and amount consistency", () => {
    expect(migration).toContain('PaymentIntent_provider_providerOrderId_key');
    expect(migration).toContain('PaymentIntent_provider_providerPaymentId_key');
    expect(migration).toContain('"balanceDueMinor" = "approvedAmountMinor" - "amountAlreadyPaidMinor"');
    expect(migration).toContain('"processingStatus" <> \'PROCESSED\' OR "signatureVerified" = true');
    expect(migration).toContain('"amountMinor" BIGINT');
    expect(migration).toContain('"currency" TEXT');
  });
});
