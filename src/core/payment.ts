import "server-only";

import { prisma } from "@/db/client";
import { runPaidOrderWorkflow } from "@/core/paid-order-workflow";

export const paymentStatuses = ["DRAFT", "PENDING_APPROVAL", "READY", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
export const paymentModes = ["TOKEN", "FULL", "BALANCE", "CUSTOM_APPROVED_AMOUNT"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentMode = (typeof paymentModes)[number];

const transitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  DRAFT: ["PENDING_APPROVAL", "CANCELLED"], PENDING_APPROVAL: ["READY", "CANCELLED"], READY: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["FAILED", "CANCELLED"], PAID: ["PARTIALLY_REFUNDED", "REFUNDED"], FAILED: [], CANCELLED: [], PARTIALLY_REFUNDED: ["PARTIALLY_REFUNDED", "REFUNDED"], REFUNDED: [],
};

/** Generic callers can never transition a payment to PAID. */
export function assertPaymentTransition(current: PaymentStatus, next: PaymentStatus) {
  if (next === "PAID") throw new Error("PAYMENT_PROVIDER_VERIFICATION_REQUIRED");
  if (!transitions[current].includes(next)) throw new Error("INVALID_PAYMENT_STATE");
}

export function resolvePayableAmount(input: { mode: PaymentMode; totalOrderAmountMinor: bigint; approvedAmountMinor: bigint; amountAlreadyPaidMinor: bigint; clientAmountMinor?: unknown; currency?: string }) {
  if (input.clientAmountMinor !== undefined || (input.currency !== undefined && input.currency !== "INR")) throw new Error("CLIENT_PAYMENT_FIELDS_REJECTED");
  const { totalOrderAmountMinor: total, approvedAmountMinor: approved, amountAlreadyPaidMinor: paid } = input;
  if ([total, approved, paid].some((value) => value < 0n) || approved > total || paid > approved) throw new Error("INVALID_PAYMENT_AMOUNT");
  const balance = approved - paid;
  const amount = input.mode === "BALANCE" ? balance : approved;
  if (amount <= 0n || amount > balance) throw new Error("INVALID_PAYMENT_AMOUNT");
  return { currency: "INR" as const, amountMinor: amount, balanceDueMinor: balance, totalOrderAmountMinor: total, approvedAmountMinor: approved };
}

export function assertRefundAmount(input: { capturedAmountMinor: bigint; refundedAmountMinor: bigint; requestedAmountMinor: bigint }) {
  if ([input.capturedAmountMinor, input.refundedAmountMinor, input.requestedAmountMinor].some((value) => value < 0n) || input.refundedAmountMinor + input.requestedAmountMinor > input.capturedAmountMinor) throw new Error("INVALID_REFUND_AMOUNT");
}

export function paymentsEnabled() { return process.env.PAYMENTS_ENABLED === "true"; }
export function assertPaymentsEnabled() { if (!paymentsEnabled()) throw new Error("PAYMENTS_DISABLED"); }

/** The only path allowed to mark PAID: it reads a durable verified event itself. */
export async function applyVerifiedProviderEvent(input: { paymentIntentId: string; providerEventId: string }) {
  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.paymentProviderEvent.findFirst({ where: { id: input.providerEventId, paymentIntentId: input.paymentIntentId, signatureVerified: true }, select: { id: true, organizationId: true, provider: true, providerPaymentId: true, providerOrderId: true, amountMinor: true, currency: true, providerEnvironment: true, captured: true, eventType: true, processingStatus: true } });
    if (!event?.providerPaymentId || !event.organizationId || !event.providerOrderId || !event.amountMinor || !event.currency) throw new Error("VERIFIED_PROVIDER_EVENT_REQUIRED");
    if (event.provider !== "RAZORPAY" || event.providerEnvironment !== "TEST" || !event.captured || !["payment.captured", "order.paid"].includes(event.eventType)) throw new Error("VERIFIED_PROVIDER_EVENT_REQUIRED");
    const intent = await tx.paymentIntent.findUnique({ where: { id: input.paymentIntentId }, select: { id: true, organizationId: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, amountMinor: true, currency: true, providerEnvironment: true } });
    if (!intent) throw new Error("PAYMENT_INTENT_NOT_FOUND");
    if (event.organizationId !== intent.organizationId || event.provider !== intent.provider || event.providerOrderId !== intent.providerOrderId || event.amountMinor !== intent.amountMinor || event.currency !== intent.currency) throw new Error("VERIFIED_PROVIDER_EVENT_MISMATCH");
    if (intent.providerEnvironment !== event.providerEnvironment || (intent.providerPaymentId && intent.providerPaymentId !== event.providerPaymentId)) throw new Error("VERIFIED_PROVIDER_EVENT_MISMATCH");
    if (intent.status === "PAID" && intent.providerPaymentId === event.providerPaymentId) {
      await tx.paymentProviderEvent.update({ where: { id: event.id }, data: { processingStatus: "PROCESSED", processedAt: new Date() } });
      return intent;
    }
    if (event.processingStatus !== "RECEIVED") throw new Error("VERIFIED_PROVIDER_EVENT_REQUIRED");
    if (intent.status !== "PROCESSING") throw new Error("INVALID_PAYMENT_STATE");
    const changed = await tx.paymentIntent.updateMany({ where: { id: intent.id, status: "PROCESSING", providerEnvironment: "TEST", OR: [{ providerPaymentId: null }, { providerPaymentId: event.providerPaymentId }] }, data: { status: "PAID", provider: event.provider, providerPaymentId: event.providerPaymentId, paidAt: new Date() } });
    if (changed.count !== 1) throw new Error("PAYMENT_CONCURRENT_EVENT_RETRY");
    const updated = { id: intent.id, status: "PAID" as const, providerPaymentId: event.providerPaymentId };
    await tx.paymentProviderEvent.update({ where: { id: event.id }, data: { processingStatus: "PROCESSED", processedAt: new Date() } });
    await tx.auditLog.create({ data: { organizationId: intent.organizationId, action: "PAYMENT_STATUS_CHANGED", entityType: "PaymentIntent", entityId: intent.id, metadata: { status: "PAID" } } });
    await tx.auditLog.create({ data: { organizationId: intent.organizationId, action: "PAYMENT_PROVIDER_EVENT_PROCESSED", entityType: "PaymentProviderEvent", entityId: event.id } });
    return updated;
  });
  // Never let accounting/mail transport change trusted payment authority.
  if (result.status === "PAID") await runPaidOrderWorkflow(input.paymentIntentId).catch(() => undefined);
  return result;
}
