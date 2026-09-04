import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { clientForms } from "@/features/public/client-forms";
import { fillFormPdf } from "@/features/public/fill-form-pdf";
import { deliverSubmission, isDelivered } from "@/features/public/notify";
import { checkPublicWriteRateLimit } from "@/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A completed client brief, submitted from the public site.
 *
 * The customer no longer chooses a channel: the answers are delivered to the
 * studio here, as the studio's own PDF with every answer written into its real
 * fields — the same document the team already works from, not a wall of text.
 *
 * The PDF is built here rather than uploaded by the browser. The blank template
 * is 1.6 MB, so a filled copy sent as base64 would be some 2 MB of JSON — past
 * the 64 KB request cap the middleware enforces, and needless when the server
 * can read the template off disk. The browser therefore posts only the answers.
 *
 * The plain-text summary stays in the mail body: it is searchable in the inbox,
 * and it is what survives if a template ever fails to fill.
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
  /**
   * The raw answers, keyed by AcroForm field name, used to fill the studio PDF.
   * Optional so an older cached page still submits successfully — it simply
   * arrives as text only rather than failing.
   */
  values: z.record(z.string().max(200), z.union([z.string().max(4000), z.array(z.string().max(400)).max(60)])).optional(),
});

/**
 * Fills the studio's own PDF with the submitted answers.
 *
 * Returns nothing rather than throwing: a template that will not fill must not
 * cost the studio the submission, so delivery continues with the text body.
 */
async function buildFormPdf(slug: string, values: Record<string, string | string[]> | undefined) {
  if (!values || Object.keys(values).length === 0) return undefined;
  const form = clientForms.find((candidate) => candidate.slug === slug);
  if (!form) return undefined;

  try {
    const { blob, fileName } = await fillFormPdf(form, values, async (pdfPath) =>
      readFile(path.join(process.cwd(), "public", pdfPath.replace(/^\//, ""))),
    );
    return { filename: fileName, content: new Uint8Array(await blob.arrayBuffer()) };
  } catch (error) {
    console.error("Could not fill the client form PDF:", error);
    return undefined;
  }
}

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

  const attachment = await buildFormPdf(form.formSlug, form.values);

  const results = await deliverSubmission({
    subject: `Client form — ${form.formName}${form.contactName ? ` — ${form.contactName}` : ""}`,
    body,
    attachments: attachment ? [attachment] : undefined,
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
