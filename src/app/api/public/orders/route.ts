import { NextResponse } from "next/server";

import { checkoutInputSchema, persistPublicCheckout } from "@/core/checkout";
import { deliverSubmission, isDelivered } from "@/features/public/notify";
import { checkPublicWriteRateLimit } from "@/auth/rate-limit";

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
export async function POST(request: Request) {
  const limit = await checkPublicWriteRateLimit("order", request.headers).catch(() => ({ allowed: false, retryAfter: 60 }));
  if (!limit.allowed) return NextResponse.json({ error: { code: "TOO_MANY_REQUESTS" } }, { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } });
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = checkoutInputSchema.safeParse({
    ...(typeof payload === "object" && payload ? payload : {}),
    idempotencyKey: request.headers.get("idempotency-key"),
  });
  if (!parsed.success) {
    console.error("Public order validation failed", parsed.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })));
    return NextResponse.json(
      { message: "Please check the details and try again." },
      { status: 400 },
    );
  }

  let persisted;
  try {
    persisted = await persistPublicCheckout(parsed.data);
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHECKOUT_UNAVAILABLE";
    if (code === "IDEMPOTENCY_KEY_REUSED") return NextResponse.json({ message: "This submission key cannot be reused with different details." }, { status: 409 });
    if (code === "CHECKOUT_PLAN_NOT_FOUND") return NextResponse.json({ message: "That plan is not available." }, { status: 400 });
    return NextResponse.json({ message: "We could not save your request right now. Please try again." }, { status: 503 });
  }

  const { customer, design, briefSubmitted } = parsed.data;
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
    `Plan:      ${persisted.planName ?? "custom quote / not chosen"}`,
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
      persisted.planName ? `— ${persisted.planName} plan` : null,
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
    console.error("Persisted order request notification was not delivered.");
    return NextResponse.json(
      {
        ok: true,
        enquiryId: persisted.enquiryId,
        paymentIntentId: persisted.paymentIntentId,
        paymentAccessToken: persisted.paymentAccessToken,
        status: persisted.status,
        delivery: "pending",
      },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json({ ok: true, enquiryId: persisted.enquiryId, paymentIntentId: persisted.paymentIntentId, paymentAccessToken: persisted.paymentAccessToken, status: persisted.status, delivery: "delivered" }, { headers: { "Cache-Control": "no-store" } });
}
