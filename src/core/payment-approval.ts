import "server-only";

import { prisma } from "@/db/client";
import { assertPaymentTransition } from "@/core/payment";
import { parseApprovedMinor } from "@/core/checkout";
import type { MemberRole } from "@/shared/auth";
import { createPaymentCapability } from "@/core/payment-capability";

export async function approveCheckoutPayment(input: { organizationId: string; actorUserId: string; actorRole: MemberRole; enquiryId: string; amountMinor?: unknown }) {
  // Approval turns a customer-facing payment capability on. Keep that decision
  // at OWNER level even if an administrative role may view payment records.
  if (input.actorRole !== "OWNER") throw new Error("PAYMENT_APPROVAL_OWNER_REQUIRED");
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.checkoutEnquiry.findFirst({ where: { id: input.enquiryId, organizationId: input.organizationId }, include: { paymentIntent: true } });
    if (!enquiry) throw new Error("CHECKOUT_ENQUIRY_NOT_FOUND");

    if (enquiry.planKey === "CUSTOM") {
      const amountMinor = parseApprovedMinor(input.amountMinor);
      if (enquiry.paymentIntent) return enquiry.paymentIntent;
      const capability = createPaymentCapability(enquiry.id);
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
      return paymentIntent;
    }

    if (input.amountMinor !== undefined) throw new Error("STANDARD_AMOUNT_SERVER_CONTROLLED");
    if (!enquiry.paymentIntent) throw new Error("PAYMENT_INTENT_NOT_FOUND");
    if (enquiry.paymentIntent.status === "READY") return enquiry.paymentIntent;
    assertPaymentTransition(enquiry.paymentIntent.status, "READY");
    const paymentIntent = await tx.paymentIntent.update({ where: { id: enquiry.paymentIntent.id }, data: { status: "READY", createdById: input.actorUserId }, });
    await tx.checkoutEnquiry.update({ where: { id: enquiry.id }, data: { status: "PAYMENT_READY", approvedById: input.actorUserId, approvedAt: new Date() } });
    await tx.auditLog.create({ data: { organizationId: input.organizationId, actorUserId: input.actorUserId, action: "PAYMENT_AMOUNT_APPROVED", entityType: "PaymentIntent", entityId: paymentIntent.id, metadata: { mode: paymentIntent.paymentMode } } });
    return paymentIntent;
  });
}
