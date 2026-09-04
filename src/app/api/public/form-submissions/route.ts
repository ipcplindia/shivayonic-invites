import { NextResponse } from "next/server";
import { z } from "zod";

import { deliverSubmission, isDelivered } from "@/features/public/notify";
import { checkPublicWriteRateLimit } from "@/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A completed client brief, submitted from the public site.
 *
 * The customer no longer chooses a channel: the answers are delivered to the
 * studio here. What is sent is the readable summary of every answer — the same
 * text the form shows under "What will be written into the form". The PDF is
 * still downloadable by the customer, but it is not attached: WhatsApp needs a
 * hosted media upload for that, which is a separate piece of work.
 */
const schema = z.object({
  formSlug: z.string().trim().max(80),
  formName: z.string().trim().max(160),
  formNo: z.string().trim().max(40).optional().default(""),
  contactName: z.string().trim().max(120).optional().default(""),
  contactEmail: z.string().trim().max(160).optional().default(""),
  contactPhone: z.string().trim().max(40).optional().default(""),
  design: z.string().trim().max(160).optional().default(""),
  /** The rendered answer sheet. Capped so one post cannot flood the channels. */
  summary: z.string().max(20000),
});

export async function POST(request: Request) {
  const limit = await checkPublicWriteRateLimit("form-submission", request.headers).catch(() => ({ allowed: false, retryAfter: 60 }));
  if (!limit.allowed) return NextResponse.json({ error: { code: "TOO_MANY_REQUESTS" } }, { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } });
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: "Could not read the form." }, { status: 400 });
  }

  const form = parsed.data;
  const body = [
    `COMPLETED CLIENT FORM — ${form.formName}${form.formNo ? ` (${form.formNo})` : ""}`,
    "shivayonic.com",
    "",
    form.contactName ? `Name:   ${form.contactName}` : null,
    form.contactEmail ? `Email:  ${form.contactEmail}` : null,
    form.contactPhone ? `Phone:  ${form.contactPhone}` : null,
    form.design ? `Design: ${form.design}` : null,
    "",
    form.summary,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const results = await deliverSubmission({
    subject: `Client form — ${form.formName}${form.contactName ? ` — ${form.contactName}` : ""}`,
    body,
    short: [
      `New client form: ${form.formName}`,
      form.contactName ? `from ${form.contactName}` : null,
      form.contactPhone ? `(${form.contactPhone})` : null,
      form.design ? `for ${form.design}` : null,
    ]
      .filter((part) => part !== null)
      .join(" "),
    replyTo: form.contactEmail || undefined,
  });

  /*
   * Only the email carries the whole form, so a WhatsApp alert on its own is
   * not success — the customer would be told we have their brief when all that
   * survived is a one-line summary.
   */
  if (!isDelivered(results)) {
    console.error("Client form could not be delivered:", results);
    return NextResponse.json(
      {
        message:
          "We could not send your form automatically. Please download the PDF and message it to us, and we will pick it up from there.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, delivered: results.filter((r) => r.ok).length });
}
