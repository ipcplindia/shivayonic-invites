import { NextResponse } from "next/server";
import { z } from "zod";

import { deliverSubmission, isDelivered } from "@/features/public/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A checkout submission from the public site.
 *
 * This takes no payment and creates no account. It formats what the customer
 * entered and hands it to the studio's delivery channels.
 *
 * Every field is validated and length-capped before it is put into a message,
 * so an oversized or malformed post cannot be used to stuff the studio's inbox.
 */
const text = (max: number) => z.string().trim().max(max);

const schema = z.object({
  customer: z.object({
    name: text(120).min(1),
    email: z.string().trim().email().max(160),
    phone: text(32).min(4),
    whatsapp: text(32).optional().default(""),
    address1: text(200).min(1),
    address2: text(200).optional().default(""),
    city: text(80).min(1),
    state: text(80).min(1),
    pincode: text(12).min(4),
    country: text(80).optional().default("India"),
    eventDate: text(40).optional().default(""),
    eventLocation: text(160).optional().default(""),
    notes: text(2000).optional().default(""),
    contactEmail: text(8).optional().default(""),
    contactSms: text(8).optional().default(""),
    marketing: text(8).optional().default(""),
  }),
  design: z
    .object({
      slug: text(120),
      name: text(160),
      occasion: text(80),
      style: text(80),
    })
    .nullable(),
  plan: z
    .object({ key: text(40), name: text(80), price: text(40).nullable(), priceNote: text(120) })
    .nullable(),
  briefSubmitted: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please check the details and try again." },
      { status: 400 },
    );
  }

  const { customer, design, plan, briefSubmitted } = parsed.data;
  const yes = (value: string) => (value === "yes" ? "yes" : "no");

  const body = [
    "NEW ORDER REQUEST — shivayonic.com",
    "",
    `Name:      ${customer.name}`,
    `Email:     ${customer.email}`,
    `Phone:     ${customer.phone}`,
    customer.whatsapp ? `WhatsApp:  ${customer.whatsapp}` : null,
    "",
    "Address:",
    `  ${customer.address1}`,
    customer.address2 ? `  ${customer.address2}` : null,
    `  ${customer.city}, ${customer.state} ${customer.pincode}`,
    `  ${customer.country}`,
    "",
    `Design:    ${design ? `${design.name} (${design.occasion} · ${design.style})` : "not chosen"}`,
    `Plan:      ${plan ? `${plan.name} — ${plan.price ?? plan.priceNote}` : "not chosen"}`,
    `Brief:     ${briefSubmitted ? "submitted" : "not filled in"}`,
    customer.eventDate ? `Event date: ${customer.eventDate}` : null,
    customer.eventLocation ? `Event venue: ${customer.eventLocation}` : null,
    "",
    customer.notes ? `Notes:\n${customer.notes}` : null,
    "",
    `Consent — email: ${yes(customer.contactEmail)}, texts: ${yes(customer.contactSms)}, marketing: ${yes(customer.marketing)}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const results = await deliverSubmission({
    subject: `Order request — ${customer.name}${design ? ` — ${design.name}` : ""}`,
    body,
    short: [
      `New order request from ${customer.name} (${customer.phone})`,
      design ? `— ${design.name}` : null,
      plan ? `— ${plan.name} plan` : null,
    ]
      .filter((part) => part !== null)
      .join(" "),
    replyTo: customer.email,
  });

  /*
   * Only the email carries the full address and event details, so a WhatsApp
   * alert alone is not success. The studio would never see this, and the
   * customer must not be told it was received. The reasons are logged for the
   * maintainer, never returned.
   */
  if (!isDelivered(results)) {
    console.error("Order request could not be delivered:", results);
    return NextResponse.json(
      {
        message:
          "We could not submit your request right now. Please message us on WhatsApp and we will take your details directly.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, delivered: results.filter((r) => r.ok).length });
}
