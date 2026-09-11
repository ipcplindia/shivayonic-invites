import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

import { prisma } from "@/db/client";
import { getPublicOrganizationId } from "@/core/public-organization";
import { createPaymentCapability } from "@/core/payment-capability";
import { customerOrderPath, sendOrderEmail } from "@/core/customer-order";
import { featuredBySlug } from "@/features/public/data";

const MAX_MINOR_UNITS = 100_000_000_000_000n;

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).optional().default("");

export const checkoutInputSchema = z.object({
  idempotencyKey: z.string().uuid(),
  customer: z.object({
    name: text(120).min(1), email: z.string().trim().email().max(160), phone: text(32).min(4), whatsapp: optionalText(32),
    address1: text(200).min(1), address2: optionalText(200), city: text(80).min(1), state: text(80).min(1),
    pincode: text(12).min(4), country: optionalText(80), eventDate: optionalText(40), eventLocation: optionalText(160), notes: optionalText(2000),
    contactEmail: optionalText(8), contactSms: optionalText(8), marketing: optionalText(8),
  }).strict(),
  design: z.object({ slug: text(120), name: text(160), occasion: text(80), style: text(80) }).strict().nullable(),
  selectedPlan: z.enum(["silver", "gold", "platinum", "customise"]).nullable(),
  briefSubmitted: z.boolean().optional().default(false),
}).strict();

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

type CanonicalPlan = { planKey: "SILVER" | "GOLD" | "PLATINUM" | "CUSTOM"; name: string; amountMinor: bigint | null };

/** Server-only launch catalogue: never accept a display price from the browser. */
const canonicalPlans: Record<NonNullable<CheckoutInput["selectedPlan"]>, CanonicalPlan> = {
  silver: { planKey: "SILVER", name: "Silver", amountMinor: 5_000_000n },
  gold: { planKey: "GOLD", name: "Gold", amountMinor: 7_500_000n },
  platinum: { planKey: "PLATINUM", name: "Platinum", amountMinor: 10_000_000n },
  customise: { planKey: "CUSTOM", name: "Custom", amountMinor: null },
};

export function resolveCanonicalPlan(value: CheckoutInput["selectedPlan"]) {
  if (!value) return null;
  const plan = canonicalPlans[value];
  if (!plan) throw new Error("CHECKOUT_PLAN_NOT_FOUND");
  return plan;
}

function selected(value: string) { return value === "yes"; }
function nullable(value: string) { return value || null; }

function requestFingerprint(input: CheckoutInput) {
  const { idempotencyKey, ...payload } = input;
  void idempotencyKey;
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export type PersistedCheckout = {
  orderUrl?: string;
  paymentAccessToken?: string;
  enquiryId: string;
  paymentIntentId: string | null;
  status: string;
  planName: string | null;
  reused: boolean;
};

/** Persists the enquiry and its server-authoritative standard-plan intent atomically. */
export async function persistPublicCheckout(input: CheckoutInput): Promise<PersistedCheckout> {
  const organizationId = await getPublicOrganizationId();
  if (!organizationId) throw new Error("CHECKOUT_ORGANIZATION_UNAVAILABLE");
  const fingerprint = requestFingerprint(input);
  const plan = resolveCanonicalPlan(input.selectedPlan);
  const design = input.design ? featuredBySlug(input.design.slug) : null;
  // A fixed-price checkout is only payable after its required brief exists.
  if (plan?.amountMinor && (!design || !input.briefSubmitted)) throw new Error("CHECKOUT_BRIEF_REQUIRED");

  const existing = await prisma.checkoutEnquiry.findUnique({ where: { organizationId_idempotencyKey: { organizationId, idempotencyKey: input.idempotencyKey } }, include: { paymentIntent: { select: { id: true } } } });
  if (existing) {
    if (existing.requestFingerprint !== fingerprint) throw new Error("IDEMPOTENCY_KEY_REUSED");
    return { enquiryId: existing.id, paymentIntentId: existing.paymentIntent?.id ?? null, status: existing.status, planName: plan?.name ?? null, reused: true };
  }

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const enquiry = await tx.checkoutEnquiry.create({
        data: {
          organizationId, idempotencyKey: input.idempotencyKey, requestFingerprint: fingerprint,
          status: plan?.amountMinor ? "PAYMENT_READY" : "RECEIVED", planKey: plan?.planKey ?? "CUSTOM",
          designSlug: design?.slug ?? null, designName: design?.name ?? null, designOccasion: design?.occasion ?? null, designStyle: design?.style ?? null,
          customerName: input.customer.name, customerEmail: input.customer.email, customerPhone: input.customer.phone, customerWhatsapp: nullable(input.customer.whatsapp),
          address1: input.customer.address1, address2: nullable(input.customer.address2), city: input.customer.city, state: input.customer.state, pincode: input.customer.pincode,
          country: input.customer.country || "India", eventDate: nullable(input.customer.eventDate), eventLocation: nullable(input.customer.eventLocation), notes: nullable(input.customer.notes),
          contactEmail: selected(input.customer.contactEmail), contactSms: selected(input.customer.contactSms), marketing: selected(input.customer.marketing), briefSubmitted: input.briefSubmitted,
        },
      });
      const capability = createPaymentCapability(enquiry.id);
      const paymentIntent = plan?.amountMinor
        ? await tx.paymentIntent.create({
            data: {
              organizationId, enquiryId: enquiry.id, status: "READY", currency: "INR", amountMinor: plan.amountMinor,
              paymentAccessHash: capability!.hash, paymentAccessExpiresAt: capability!.expiresAt,
              purpose: `${plan.name} checkout enquiry`, paymentMode: "FULL", totalOrderAmountMinor: plan.amountMinor,
              approvedAmountMinor: plan.amountMinor, amountAlreadyPaidMinor: 0n, balanceDueMinor: plan.amountMinor,
            }, select: { id: true },
          })
        : null;
      if (!paymentIntent) await tx.verification.create({ data: { id: `order-access:${enquiry.id}`, identifier: organizationId, value: capability.hash, expiresAt: capability.expiresAt } });
      await tx.auditLog.create({ data: { organizationId, action: "CHECKOUT_PERSISTED", entityType: "CheckoutEnquiry", entityId: enquiry.id, metadata: { plan: plan?.planKey ?? "CUSTOM", paymentIntentCreated: Boolean(paymentIntent) } } });
      if (paymentIntent) await tx.auditLog.create({ data: { organizationId, action: "PAYMENT_INTENT_CREATED", entityType: "PaymentIntent", entityId: paymentIntent.id, metadata: { source: "PUBLIC_CHECKOUT" } } });
      return { enquiryId: enquiry.id, paymentIntentId: paymentIntent?.id ?? null, paymentAccessToken: capability.token, orderUrl: customerOrderPath(enquiry.id, capability.token), status: enquiry.status, planName: plan?.name ?? null, reused: false };
    });
    await sendOrderEmail({ id: saved.enquiryId, customerEmail: input.customer.email, designName: design?.name ?? null, planKey: plan?.planKey ?? "CUSTOM" }, saved.paymentAccessToken, Boolean(plan?.amountMinor));
    return saved;
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    const raced = await prisma.checkoutEnquiry.findUnique({ where: { organizationId_idempotencyKey: { organizationId, idempotencyKey: input.idempotencyKey } }, include: { paymentIntent: { select: { id: true } } } });
    if (!raced || raced.requestFingerprint !== fingerprint) throw new Error("IDEMPOTENCY_KEY_REUSED");
    return { enquiryId: raced.id, paymentIntentId: raced.paymentIntent?.id ?? null, status: raced.status, planName: plan?.name ?? null, reused: true };
  }
}

export function parseApprovedMinor(value: unknown) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) throw new Error("INVALID_PAYMENT_AMOUNT");
  const amount = BigInt(value);
  if (amount > MAX_MINOR_UNITS) throw new Error("INVALID_PAYMENT_AMOUNT");
  return amount;
}
