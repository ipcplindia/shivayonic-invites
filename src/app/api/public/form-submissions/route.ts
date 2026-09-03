import { NextResponse } from "next/server";
import { z } from "zod";

import { deliverSubmission } from "@/features/public/notify";

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
  });

  const delivered = results.filter((r) => r.ok);
  if (delivered.length === 0) {
    console.error("Client form could not be delivered:", results);
    return NextResponse.json(
      {
        message:
          "We could not send your form automatically. Please download the PDF and message it to us, and we will pick it up from there.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, delivered: delivered.length });
}
