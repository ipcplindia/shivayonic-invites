import "server-only";

import { prisma } from "@/db/client";
import { assertPaymentTransition } from "@/core/payment";
import { parseApprovedMinor } from "@/core/checkout";
import type { MemberRole } from "@/shared/auth";
import { createPaymentCapability } from "@/core/payment-capability";
import { sendOrderEmail } from "@/core/customer-order";

export async function approveCheckoutPayment(input: { organizationId: string; actorUserId: string; actorRole: MemberRole; enquiryId: string; amountMinor?: unknown }) {
  // Approval turns a customer-facing payment capability on. Keep that decision
  // at OWNER level even if an administrative role may view payment records.
  if (input.actorRole !== "OWNER") throw new Error("PAYMENT_APPROVAL_OWNER_REQUIRED");
  const capability = createPaymentCapability();
  let recipient: { id: string; customerEmail: string; designName: string | null; planKey: string } | undefined;
  const result = await prisma.$transaction(async (tx) => {
    const enquiry = await tx.checkoutEnquiry.findFirst({ where: { id: input.enquiryId, organizationId: input.organizationId }, include: { paymentIntent: true } });
    if (!enquiry) throw new Error("CHECKOUT_ENQUIRY_NOT_FOUND");

    if (enquiry.planKey === "CUSTOM") {
      const amountMinor = parseApprovedMinor(input.amountMinor);
      if (enquiry.paymentIntent) return enquiry.paymentIntent;
      const paymentIntent = await tx.paymentIntent.create({
        data: {
          organizationId: input.organizationId, enquiryId: enquiry.id, status: "READY", currency: "INR", amountMinor,
          purpose: "Custom checkout enquiry", paymentMode: "CUSTOM_APPROVED_AMOUNT", totalOrderAmountMinor: amountMinor,
          approvedAmountMinor: amountMinor, amountAlreadyPaidMinor: 0n, balanceDueMinor: amountMinor,
          paymentAccessHash: capability.hash, paymentAccessExpiresAt: capability.expiresAt,
          createdById: input.actorUserId,
        },
      });
      await tx.checkoutEnquiry.update({ where: { id: enquiry.id }, data: { status: "PAYMENT_READY", approvedById: input.actorUserId, approvedAt: new Date() } });
      await tx.auditLog.create({ data: { organizationId: input.organizationId, actorUserId: input.actorUserId, action: "PAYMENT_AMOUNT_APPROVED", entityType: "PaymentIntent", entityId: paymentIntent.id, metadata: { mode: "CUSTOM_APPROVED_AMOUNT" } } });
      recipient = enquiry;
      return paymentIntent;
    }

    if (input.amountMinor !== undefined) throw new Error("STANDARD_AMOUNT_SERVER_CONTROLLED");
    if (!enquiry.paymentIntent) throw new Error("PAYMENT_INTENT_NOT_FOUND");
    if (enquiry.paymentIntent.organizationId !== input.organizationId) throw new Error("PAYMENT_INTENT_NOT_FOUND");
    if (enquiry.paymentIntent.status === "READY") return enquiry.paymentIntent;
    assertPaymentTransition(enquiry.paymentIntent.status, "READY");
    const changed = await tx.paymentIntent.updateMany({ where: { id: enquiry.paymentIntent.id, organizationId: input.organizationId, status: "PENDING_APPROVAL" }, data: { status: "READY", createdById: input.actorUserId, paymentAccessHash: capability.hash, paymentAccessExpiresAt: capability.expiresAt } });
    if (changed.count !== 1) throw new Error("PAYMENT_NOT_READY");
    const paymentIntent = { ...enquiry.paymentIntent, status: "READY" as const };
    await tx.checkoutEnquiry.update({ where: { id: enquiry.id }, data: { status: "PAYMENT_READY", approvedById: input.actorUserId, approvedAt: new Date() } });
    await tx.auditLog.create({ data: { organizationId: input.organizationId, actorUserId: input.actorUserId, action: "PAYMENT_AMOUNT_APPROVED", entityType: "PaymentIntent", entityId: paymentIntent.id, metadata: { mode: paymentIntent.paymentMode } } });
    recipient = enquiry;
    return paymentIntent;
  });
  if (recipient) await sendOrderEmail(recipient, capability.token, true);
  return result;
}
