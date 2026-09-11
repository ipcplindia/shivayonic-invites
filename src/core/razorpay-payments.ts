import "server-only";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { prisma } from "@/db/client";
import { getPublicOrganizationId } from "./public-organization";
import { validPaymentCapability } from "./payment-capability";
import { assertPaymentsEnabled, applyVerifiedProviderEvent } from "./payment";
import { createOrder, getPayment, providerPaymentSchema, razorpayConfig, verifyCheckout, verifyWebhook } from "./razorpay-provider";

export async function authorizePayment(id: string, token: string) {
  const organizationId = await getPublicOrganizationId();
  if (!organizationId) throw new Error("PAYMENT_ACCESS_DENIED");
  const intent = await prisma.paymentIntent.findFirst({ where: { id, organizationId }, include: { enquiry: true } });
  if (!intent || !validPaymentCapability(token, intent.paymentAccessHash, intent.paymentAccessExpiresAt)) throw new Error("PAYMENT_ACCESS_DENIED");
  if (intent.enquiry && (intent.enquiry.organizationId !== organizationId || intent.enquiry.id !== intent.enquiryId)) throw new Error("PAYMENT_ACCESS_DENIED");
  if (intent.providerEnvironment && intent.providerEnvironment !== "TEST") throw new Error("PAYMENT_ACCESS_DENIED");
  return intent;
}

export async function initiatePayment(id: string, token: string) {
  assertPaymentsEnabled();
  const config = razorpayConfig();
  const intent = await authorizePayment(id, token);
  if (intent.currency !== "INR" || intent.amountMinor <= 0n || intent.amountMinor > BigInt(Number.MAX_SAFE_INTEGER) || (intent.expiresAt && intent.expiresAt <= new Date())) throw new Error("PAYMENT_NOT_READY");
  const result = (order: string) => ({ paymentIntentId: intent.id, razorpayOrderId: order, amountMinor: Number(intent.amountMinor), currency: "INR", key: config.key, name: "Shivayonic Invites", description: intent.purpose, mode: "TEST", prefill: intent.enquiry ? { name: intent.enquiry.customerName, email: intent.enquiry.customerEmail, contact: intent.enquiry.customerPhone } : {} });
  if (intent.status === "PROCESSING" && intent.provider === "RAZORPAY" && intent.providerOrderId && intent.providerEnvironment === "TEST") return result(intent.providerOrderId);
  if (intent.status !== "READY") throw new Error("PAYMENT_NOT_READY");
  // Fixed server key per intent. A crash/timeout intentionally retains the claim.
  const claim = await prisma.paymentIdempotencyKey.createMany({ data: [{ organizationId: intent.organizationId, operation: "RAZORPAY_TEST_ORDER", idempotencyKey: intent.id, requestFingerprint: intent.amountMinor.toString(), expiresAt: new Date("2100-01-01") }], skipDuplicates: true });
  if (claim.count !== 1) throw new Error("PAYMENT_RECONCILIATION_REQUIRED");
  const order = await createOrder(intent.amountMinor, intent.id);
  await prisma.$transaction(async tx => {
    const changed = await tx.paymentIntent.updateMany({ where: { id, organizationId: intent.organizationId, status: "READY", providerOrderId: null, amountMinor: intent.amountMinor }, data: { provider: "RAZORPAY", providerEnvironment: "TEST", providerOrderId: order.id, status: "PROCESSING" } });
    if (changed.count !== 1) throw new Error("PAYMENT_RECONCILIATION_REQUIRED");
    await tx.paymentIdempotencyKey.update({ where: { organizationId_operation_idempotencyKey: { organizationId: intent.organizationId, operation: "RAZORPAY_TEST_ORDER", idempotencyKey: id } }, data: { status: "SUCCEEDED", responseReference: order.id } });
    await tx.auditLog.create({ data: { organizationId: intent.organizationId, action: "PAYMENT_STATUS_CHANGED", entityType: "PaymentIntent", entityId: id, metadata: { status: "PROCESSING", environment: "TEST" } } });
  });
  return result(order.id);
}

export async function verifyPayment(input: { paymentIntentId: string; paymentAccessToken: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const intent = await authorizePayment(input.paymentIntentId, input.paymentAccessToken);
  if (!intent.providerOrderId || intent.provider !== "RAZORPAY" || intent.providerEnvironment !== "TEST" || !["PROCESSING", "PAID"].includes(intent.status) || intent.providerOrderId !== input.razorpay_order_id || !verifyCheckout(intent.providerOrderId, input.razorpay_payment_id, input.razorpay_signature)) throw new Error("PAYMENT_VERIFICATION_REJECTED");
  const payment = await getPayment(input.razorpay_payment_id);
  if (payment.order_id !== intent.providerOrderId || BigInt(payment.amount) !== intent.amountMinor || !["authorized", "captured"].includes(payment.status)) throw new Error("PAYMENT_VERIFICATION_REJECTED");
  const bound = await prisma.paymentIntent.updateMany({ where: { id: intent.id, organizationId: intent.organizationId, providerEnvironment: "TEST", OR: [{ providerPaymentId: null }, { providerPaymentId: payment.id }] }, data: { providerPaymentId: payment.id, verifiedAt: new Date() } });
  if (bound.count !== 1) throw new Error("PAYMENT_VERIFICATION_REJECTED");
  // Authentic browser callback binds identity only; it never calls the PAID helper.
  return { status: intent.status === "PAID" ? "PAID" : "PROCESSING" };
}

export async function processRazorpayWebhook(raw: Uint8Array, signature: string, externalId: string) {
  if (!verifyWebhook(raw, signature)) throw new Error("INVALID_WEBHOOK_SIGNATURE");
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(externalId)) throw new Error("INVALID_WEBHOOK_EVENT");
  const payload = JSON.parse(Buffer.from(raw).toString("utf8")) as { event?: string; payload?: { payment?: { entity?: { id?: string } } } };
  const hash = createHash("sha256").update(raw).digest("hex");
  const key = { provider: "RAZORPAY" as const, externalEventId: `TEST:${externalId}` };
  const previous = await prisma.paymentProviderEvent.findUnique({ where: { provider_externalEventId: key } });
  if (previous && previous.payloadHash !== hash) throw new Error("INVALID_WEBHOOK_EVENT");
  if (previous && ["PROCESSED", "IGNORED"].includes(previous.processingStatus)) return;
  const allowed = ["payment.authorized", "payment.captured", "payment.failed", "order.paid"];
  if (!payload.event || !allowed.includes(payload.event)) {
    await prisma.paymentProviderEvent.createMany({ data: [{ ...key, eventType: "unsupported", signatureVerified: true, providerEnvironment: "TEST", payloadHash: hash, processingStatus: "IGNORED" }], skipDuplicates: true });
    return;
  }
  const paymentId = payload.payload?.payment?.entity?.id;
  if (!paymentId) throw new Error("INVALID_WEBHOOK_EVENT");
  const reported = providerPaymentSchema.safeParse(payload.payload?.payment?.entity);
  if (!reported.success) throw new Error("INVALID_WEBHOOK_EVENT");
  // Test-key API fetch proves environment independently of untrusted body fields.
  const payment = await getPayment(paymentId);
  if (reported.data.order_id !== payment.order_id || reported.data.amount !== payment.amount || reported.data.currency !== payment.currency) throw new Error("INVALID_WEBHOOK_EVENT");
  const organizationId = await getPublicOrganizationId();
  if (!organizationId) throw new Error("INVALID_WEBHOOK_EVENT");
  const intent = await prisma.paymentIntent.findFirst({ where: { organizationId, provider: "RAZORPAY", providerEnvironment: "TEST", providerOrderId: payment.order_id } });
  if (!intent || intent.amountMinor !== BigInt(payment.amount) || intent.currency !== payment.currency || (intent.providerPaymentId && intent.providerPaymentId !== payment.id)) throw new Error("INVALID_WEBHOOK_EVENT");
  const captured = payment.status === "captured" && payment.captured && ["payment.captured", "order.paid"].includes(payload.event);
  await prisma.paymentProviderEvent.createMany({ data: [{ ...key, eventType: payload.event, signatureVerified: true, providerEnvironment: "TEST", payloadHash: hash, organizationId, paymentIntentId: intent.id, providerOrderId: payment.order_id, providerPaymentId: payment.id, amountMinor: BigInt(payment.amount), currency: payment.currency, captured, processingStatus: captured ? "RECEIVED" : "IGNORED" }], skipDuplicates: true });
  const event = await prisma.paymentProviderEvent.findUniqueOrThrow({ where: { provider_externalEventId: key } });
  if (event.payloadHash !== hash) throw new Error("INVALID_WEBHOOK_EVENT");
  if (captured) await applyVerifiedProviderEvent({ paymentIntentId: intent.id, providerEventId: event.id });
}
