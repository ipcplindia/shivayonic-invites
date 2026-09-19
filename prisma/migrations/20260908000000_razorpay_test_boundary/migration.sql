ALTER TABLE "PaymentIntent"
 ADD COLUMN "providerEnvironment" TEXT,
 ADD COLUMN "paymentAccessHash" TEXT,
 ADD COLUMN "paymentAccessExpiresAt" TIMESTAMP(3),
 ADD COLUMN "verifiedAt" TIMESTAMP(3),
 ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "PaymentProviderEvent"
 ADD COLUMN "providerEnvironment" TEXT,
 ADD COLUMN "captured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_environment_check" CHECK ("providerEnvironment" IS NULL OR "providerEnvironment" IN ('TEST', 'LIVE'));
ALTER TABLE "PaymentProviderEvent" ADD CONSTRAINT "PaymentProviderEvent_environment_check" CHECK ("providerEnvironment" IS NULL OR "providerEnvironment" IN ('TEST', 'LIVE'));
