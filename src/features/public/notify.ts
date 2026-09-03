import "server-only";

import { formRecipients } from "@/features/public/data";

/**
 * Delivery of a submitted form or order request to the studio.
 *
 * Two channels, both provider-backed, because neither can be driven from a
 * browser — each needs a server-held credential:
 *
 *  - Email, through Resend (`RESEND_API_KEY`, and `MAIL_FROM` for a verified
 *    sender on the shivayonic.com domain). This is the system of record: it
 *    carries the complete form.
 *  - WhatsApp, through the Meta WhatsApp Cloud API (`WHATSAPP_TOKEN`,
 *    `WHATSAPP_PHONE_ID`, `WHATSAPP_TEMPLATE`, optional `WHATSAPP_LANG`).
 *    This is a short alert, not the record.
 *
 * None of these are declared in `src/config/env.ts`. That schema strips unknown
 * keys rather than rejecting them, and declaring these as required would break
 * `getServerConfig()` for its three existing callers whenever they are unset.
 *
 * Until the variables are set the delivery genuinely does not happen, and the
 * result says so per channel rather than reporting a success the studio would
 * never see. The caller decides what to tell the customer.
 */

export type DeliveryChannel = "email" | "whatsapp";

export type DeliveryResult = {
  channel: DeliveryChannel;
  target: string;
  ok: boolean;
  /** Why it did not go, in words a maintainer can act on. */
  detail?: string;
};

export type Submission = {
  subject: string;
  /** The complete submission, plain text, delivered by email. */
  body: string;
  /**
   * A one-line summary for the WhatsApp template parameter.
   *
   * Meta rejects template parameters containing newlines or tabs, so the full
   * body can never be sent this way — WhatsApp gets the alert, email gets the
   * form.
   */
  short: string;
  /** The customer's own address, so a reply from the studio reaches them. */
  replyTo?: string;
};

/** WhatsApp template parameters must be a single line, and are length-capped. */
function templateParameter(value: string, max = 700): string {
  const flattened = value.replace(/\s+/g, " ").trim();
  return flattened.length > max ? `${flattened.slice(0, max - 1)}…` : flattened;
}

async function sendEmail({ subject, body, replyTo }: Submission): Promise<DeliveryResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const target = formRecipients.email;

  if (!key || !from) {
    return {
      channel: "email",
      target,
      ok: false,
      detail: "RESEND_API_KEY and MAIL_FROM are not configured on the server.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [target],
        subject,
        text: body,
        // Replying in Gmail then goes to the customer rather than to the sender.
        ...(replyTo ? { reply_to: [replyTo] } : {}),
      }),
    });
    if (!res.ok) {
      return { channel: "email", target, ok: false, detail: `Mail provider returned ${res.status}.` };
    }
    return { channel: "email", target, ok: true };
  } catch (error) {
    return {
      channel: "email",
      target,
      ok: false,
      detail: error instanceof Error ? error.message : "Mail request failed.",
    };
  }
}

async function sendWhatsApp(to: string, { short }: Submission): Promise<DeliveryResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const template = process.env.WHATSAPP_TEMPLATE;
  const language = process.env.WHATSAPP_LANG || "en";

  if (!token || !phoneId || !template) {
    return {
      channel: "whatsapp",
      target: to,
      ok: false,
      detail: "WHATSAPP_TOKEN, WHATSAPP_PHONE_ID and WHATSAPP_TEMPLATE are not configured on the server.",
    };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      /*
       * A template send, not free text. The studio never messages the website
       * first, so every one of these is business-initiated, and Meta only
       * permits those through an approved template. Free text would appear to
       * work for 24 hours after someone messaged the business number and then
       * silently stop.
       */
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: language },
          components: [
            { type: "body", parameters: [{ type: "text", text: templateParameter(short) }] },
          ],
        },
      }),
    });
    if (!res.ok) {
      return {
        channel: "whatsapp",
        target: to,
        ok: false,
        detail: `WhatsApp API returned ${res.status}.`,
      };
    }
    return { channel: "whatsapp", target: to, ok: true };
  } catch (error) {
    return {
      channel: "whatsapp",
      target: to,
      ok: false,
      detail: error instanceof Error ? error.message : "WhatsApp request failed.",
    };
  }
}

/** Delivers to every configured channel and reports each one truthfully. */
export async function deliverSubmission(submission: Submission): Promise<DeliveryResult[]> {
  return Promise.all([
    sendEmail(submission),
    ...formRecipients.whatsapp.map((number) => sendWhatsApp(number, submission)),
  ]);
}

/**
 * Whether the submission reached somewhere durable.
 *
 * Only email carries the complete form, so a WhatsApp alert alone is not
 * success: the one-line summary would be all that survived.
 */
export function isDelivered(results: DeliveryResult[]): boolean {
  return results.some((result) => result.channel === "email" && result.ok);
}
