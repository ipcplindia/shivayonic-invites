import "server-only";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { prisma } from "@/db/client";
import { assertPaymentEnvironment, razorpayMode } from "@/config/razorpay";
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
  assertPaymentEnvironment(intent.providerEnvironment);
  return intent;
}

export async function initiatePayment(id: string, token: string) {
  assertPaymentsEnabled();
  const config = razorpayConfig();
  const intent = await authorizePayment(id, token);
  if (intent.currency !== "INR" || intent.amountMinor <= 0n || intent.amountMinor > BigInt(Number.MAX_SAFE_INTEGER) || (intent.expiresAt && intent.expiresAt <= new Date())) throw new Error("PAYMENT_NOT_READY");
  const mode = config.mode;
  const operation = `RAZORPAY_${mode}_ORDER`;
  const result = (order: string) => ({ paymentIntentId: intent.id, razorpayOrderId: order, amountMinor: Number(intent.amountMinor), currency: "INR", key: config.key, name: "Shivayonic Invites", description: intent.purpose, mode, prefill: intent.enquiry ? { name: intent.enquiry.customerName, email: intent.enquiry.customerEmail, contact: intent.enquiry.customerPhone } : {} });
  if (intent.status === "PROCESSING" && intent.provider === "RAZORPAY" && intent.providerOrderId) return result(intent.providerOrderId);
  if (intent.status !== "READY") throw new Error("PAYMENT_NOT_READY");
  // Fixed server key per intent. A crash/timeout intentionally retains the claim.
  const claim = await prisma.paymentIdempotencyKey.createMany({ data: [{ organizationId: intent.organizationId, operation, idempotencyKey: intent.id, requestFingerprint: intent.amountMinor.toString(), expiresAt: new Date("2100-01-01") }], skipDuplicates: true });
  if (claim.count !== 1) throw new Error("PAYMENT_RECONCILIATION_REQUIRED");
  const order = await createOrder(intent.amountMinor, intent.id);
  await prisma.$transaction(async tx => {
    const changed = await tx.paymentIntent.updateMany({ where: { id, organizationId: intent.organizationId, status: "READY", providerEnvironment: mode, providerOrderId: null, amountMinor: intent.amountMinor }, data: { provider: "RAZORPAY", providerOrderId: order.id, status: "PROCESSING" } });
    if (changed.count !== 1) throw new Error("PAYMENT_RECONCILIATION_REQUIRED");
    await tx.paymentIdempotencyKey.update({ where: { organizationId_operation_idempotencyKey: { organizationId: intent.organizationId, operation, idempotencyKey: id } }, data: { status: "SUCCEEDED", responseReference: order.id } });
    await tx.auditLog.create({ data: { organizationId: intent.organizationId, action: "PAYMENT_STATUS_CHANGED", entityType: "PaymentIntent", entityId: id, metadata: { status: "PROCESSING", environment: mode } } });
  });
  return result(order.id);
}

export async function verifyPayment(input: { paymentIntentId: string; paymentAccessToken: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const mode = razorpayMode();
  const intent = await authorizePayment(input.paymentIntentId, input.paymentAccessToken);
  if (!intent.providerOrderId || intent.provider !== "RAZORPAY" || !["PROCESSING", "PAID"].includes(intent.status) || intent.providerOrderId !== input.razorpay_order_id || !verifyCheckout(intent.providerOrderId, input.razorpay_payment_id, input.razorpay_signature)) throw new Error("PAYMENT_VERIFICATION_REJECTED");
  const payment = await getPayment(input.razorpay_payment_id);
  if (payment.id !== input.razorpay_payment_id || payment.order_id !== intent.providerOrderId || BigInt(payment.amount) !== intent.amountMinor || payment.currency !== intent.currency || !["authorized", "captured"].includes(payment.status)) throw new Error("PAYMENT_VERIFICATION_REJECTED");
  const bound = await prisma.paymentIntent.updateMany({ where: { id: intent.id, organizationId: intent.organizationId, status: { in: ["PROCESSING", "PAID"] }, provider: "RAZORPAY", providerOrderId: intent.providerOrderId, providerEnvironment: mode, OR: [{ providerPaymentId: null }, { providerPaymentId: payment.id }] }, data: { providerPaymentId: payment.id, verifiedAt: new Date() } });
  if (bound.count !== 1) throw new Error("PAYMENT_VERIFICATION_REJECTED");
  // The callback alone cannot mark PAID. A captured status fetched directly from
  // Razorpay is persisted as a verified event and uses the same trusted PAID path
  // as webhooks. This also makes protected Preview deployments testable when the
  // provider cannot reach their webhook URL.
  if (payment.status === "captured" && payment.captured) {
    const canonical = `${payment.id}|${payment.order_id}|${payment.amount}|${payment.currency}|captured`;
    const payloadHash = createHash("sha256").update(canonical).digest("hex");
    const key = { provider: "RAZORPAY" as const, externalEventId: `${mode}:api:${payment.id}` };
    await prisma.paymentProviderEvent.createMany({ data: [{ ...key, eventType: "payment.captured", signatureVerified: true, providerEnvironment: mode, payloadHash, organizationId: intent.organizationId, paymentIntentId: intent.id, providerOrderId: payment.order_id, providerPaymentId: payment.id, amountMinor: BigInt(payment.amount), currency: payment.currency, captured: true, processingStatus: "RECEIVED" }], skipDuplicates: true });
    const event = await prisma.paymentProviderEvent.findUniqueOrThrow({ where: { provider_externalEventId: key } });
    if (event.payloadHash !== payloadHash) throw new Error("PAYMENT_VERIFICATION_REJECTED");
    const paid = await applyVerifiedProviderEvent({ paymentIntentId: intent.id, providerEventId: event.id });
    return { status: paid.status };
  }
  return { status: intent.status === "PAID" ? "PAID" : "PROCESSING" };
}

export async function processRazorpayWebhook(raw: Uint8Array, signature: string, externalId: string) {
  if (!verifyWebhook(raw, signature)) throw new Error("INVALID_WEBHOOK_SIGNATURE");
  const mode = razorpayMode();
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(externalId)) throw new Error("INVALID_WEBHOOK_EVENT");
  const payload = JSON.parse(Buffer.from(raw).toString("utf8")) as { event?: string; payload?: { payment?: { entity?: { id?: string } } } };
  const hash = createHash("sha256").update(raw).digest("hex");
  const key = { provider: "RAZORPAY" as const, externalEventId: `${mode}:${externalId}` };
  const previous = await prisma.paymentProviderEvent.findUnique({ where: { provider_externalEventId: key } });
  if (previous && (previous.payloadHash !== hash || previous.providerEnvironment !== mode)) throw new Error("INVALID_WEBHOOK_EVENT");
  if (previous && ["PROCESSED", "IGNORED"].includes(previous.processingStatus)) return;
  const allowed = ["payment.authorized", "payment.captured", "payment.failed", "order.paid"];
  if (!payload.event || !allowed.includes(payload.event)) {
    await prisma.paymentProviderEvent.createMany({ data: [{ ...key, eventType: "unsupported", signatureVerified: true, providerEnvironment: mode, payloadHash: hash, processingStatus: "IGNORED" }], skipDuplicates: true });
    return;
  }
  const paymentId = payload.payload?.payment?.entity?.id;
  if (!paymentId) throw new Error("INVALID_WEBHOOK_EVENT");
  const reported = providerPaymentSchema.safeParse(payload.payload?.payment?.entity);
  if (!reported.success) throw new Error("INVALID_WEBHOOK_EVENT");
  // Fetch with the active mode's credentials; body fields cannot select an environment.
  const payment = await getPayment(paymentId);
  if (reported.data.id !== payment.id || reported.data.order_id !== payment.order_id || reported.data.amount !== payment.amount || reported.data.currency !== payment.currency) throw new Error("INVALID_WEBHOOK_EVENT");
  const organizationId = await getPublicOrganizationId();
  if (!organizationId) throw new Error("INVALID_WEBHOOK_EVENT");
  const intent = await prisma.paymentIntent.findFirst({ where: { organizationId, provider: "RAZORPAY", providerEnvironment: mode, providerOrderId: payment.order_id } });
  if (!intent || intent.organizationId !== organizationId || intent.providerEnvironment !== mode || intent.providerOrderId !== payment.order_id || intent.amountMinor !== BigInt(payment.amount) || intent.currency !== payment.currency || !["PROCESSING", "PAID"].includes(intent.status) || (intent.providerPaymentId && intent.providerPaymentId !== payment.id)) throw new Error("INVALID_WEBHOOK_EVENT");
  const captured = payment.status === "captured" && payment.captured && ["payment.captured", "order.paid"].includes(payload.event);
  await prisma.paymentProviderEvent.createMany({ data: [{ ...key, eventType: payload.event, signatureVerified: true, providerEnvironment: mode, payloadHash: hash, organizationId, paymentIntentId: intent.id, providerOrderId: payment.order_id, providerPaymentId: payment.id, amountMinor: BigInt(payment.amount), currency: payment.currency, captured, processingStatus: captured ? "RECEIVED" : "IGNORED" }], skipDuplicates: true });
  const event = await prisma.paymentProviderEvent.findUniqueOrThrow({ where: { provider_externalEventId: key } });
  if (event.payloadHash !== hash) throw new Error("INVALID_WEBHOOK_EVENT");
  if (captured) await applyVerifiedProviderEvent({ paymentIntentId: intent.id, providerEventId: event.id });
}
