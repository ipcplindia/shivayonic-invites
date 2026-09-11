import "server-only";
import { prisma } from "@/db/client";
import { getPublicOrganizationId } from "@/core/public-organization";
import { createPaymentCapability, validPaymentCapability } from "@/core/payment-capability";
import { sendEmail } from "@/features/public/notify";

export function customerOrigin() {
  const source = process.env.VERCEL_ENV === "preview"
    ? `https://${process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL || ""}`
    : process.env.NEXT_PUBLIC_APP_URL;
  if (!source) throw new Error("CUSTOMER_ORIGIN_UNAVAILABLE");
  const url = new URL(source);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV === "development" && url.hostname === "localhost")) throw new Error("CUSTOMER_ORIGIN_UNAVAILABLE");
  return url.origin;
}

// Fragments are retained in bookmarks/email, but never sent in HTTP access logs.
export function customerOrderPath(id: string, token: string) {
  return `/order/${encodeURIComponent(id)}#access=${token}`;
}

export async function sendOrderEmail(input: { id: string; customerEmail: string; designName: string | null; planKey: string }, token: string, ready: boolean) {
  try {
    const url = customerOrigin() + customerOrderPath(input.id, token);
    return (await sendEmail({
      subject: ready ? "Your payment is ready" : "Your Shivayonic commission request",
      body: `${ready ? "Your payment is ready." : "Your commission request was received. Awaiting studio approval."}\n\nDesign: ${input.designName || "Custom commission"}\nPlan: ${input.planKey}\n\nView your order: ${url}\n\nKeep this private link safe. Only share it with someone you trust to access your order.`,
      short: "",
    }, input.customerEmail)).ok;
  } catch { return false; }
}

export async function getCustomerOrder(id: string, token: string) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id) || !/^[a-f0-9]{64}$/.test(token)) throw new Error("PAYMENT_ACCESS_DENIED");
  const organizationId = await getPublicOrganizationId();
  if (!organizationId) throw new Error("PAYMENT_ACCESS_DENIED");
  const order = await prisma.checkoutEnquiry.findFirst({ where: { id, organizationId }, include: { paymentIntent: true } });
  if (!order) throw new Error("PAYMENT_ACCESS_DENIED");
  const payment = order.paymentIntent;
  // Custom quotes have no PaymentIntent until approval. Reuse Verification for
  // their temporary order capability; no payment authority is granted by it.
  const quote = payment ? null : await prisma.verification.findUnique({ where: { id: `order-access:${id}` } });
  if (payment ? payment.organizationId !== organizationId || payment.enquiryId !== id || !validPaymentCapability(token, payment.paymentAccessHash, payment.paymentAccessExpiresAt)
    : quote?.identifier !== organizationId || !validPaymentCapability(token, quote?.value ?? null, quote?.expiresAt ?? null)) throw new Error("PAYMENT_ACCESS_DENIED");
  return {
    reference: order.id, design: order.designName, plan: order.planKey, eventDate: order.eventDate,
    status: order.status, paymentStatus: payment?.status ?? "PENDING_APPROVAL",
    amount: payment ? `${payment.currency} ${(payment.amountMinor / 100n).toLocaleString("en-IN")}.${(payment.amountMinor % 100n).toString().padStart(2, "0")}` : "Awaiting quote",
    paymentIntentId: payment?.id ?? null,
  };
}

export async function resendOrderPaymentLink(input: { organizationId: string; actorUserId: string; actorRole: string; enquiryId: string }) {
  if (input.actorRole !== "OWNER") throw new Error("PAYMENT_APPROVAL_OWNER_REQUIRED");
  const capability = createPaymentCapability();
  const order = await prisma.$transaction(async tx => {
    const enquiry = await tx.checkoutEnquiry.findFirst({ where: { id: input.enquiryId, organizationId: input.organizationId }, include: { paymentIntent: true } });
    const payment = enquiry?.paymentIntent;
    if (!enquiry || !payment || payment.organizationId !== input.organizationId || payment.status !== "READY") throw new Error("PAYMENT_NOT_READY");
    const changed = await tx.paymentIntent.updateMany({ where: { id: payment.id, organizationId: input.organizationId, status: "READY", paymentAccessHash: payment.paymentAccessHash }, data: { paymentAccessHash: capability.hash, paymentAccessExpiresAt: capability.expiresAt } });
    if (changed.count !== 1) throw new Error("PAYMENT_NOT_READY");
    await tx.auditLog.create({ data: { organizationId: input.organizationId, actorUserId: input.actorUserId, action: "PAYMENT_LINK_REISSUED", entityType: "PaymentIntent", entityId: payment.id } });
    return enquiry;
  });
  const delivered = await sendOrderEmail(order, capability.token, true);
  return { delivered, ...(process.env.VERCEL_ENV === "preview" ? { testUrl: customerOrigin() + customerOrderPath(order.id, capability.token) } : {}) };
}
