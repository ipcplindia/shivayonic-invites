CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'CREATED', 'SENT', 'FAILED', 'RETRY_REQUIRED');

ALTER TABLE "PaymentIntent"
  ADD COLUMN "invoiceStatus" "InvoiceStatus",
  ADD COLUMN "zohoCustomerId" TEXT,
  ADD COLUMN "zohoInvoiceId" TEXT,
  ADD COLUMN "invoiceNumber" TEXT,
  ADD COLUMN "invoiceCreatedAt" TIMESTAMP(3),
  ADD COLUMN "invoiceSentAt" TIMESTAMP(3),
  ADD COLUMN "paymentConfirmationSentAt" TIMESTAMP(3);
