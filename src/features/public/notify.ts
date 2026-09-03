import "server-only";

import { formRecipients } from "@/features/public/data";

/**
 * Delivery of a submitted form or order request to the studio.
 *
 * Two channels, both provider-backed:
 *
 *  - Email, through Resend (`RESEND_API_KEY`, and `MAIL_FROM` for a verified
 *    sender on your domain).
 *  - WhatsApp, through the Meta WhatsApp Cloud API
 *    (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, and `WHATSAPP_TEMPLATE` if your
 *    number is outside its 24-hour customer service window).
 *
 * A browser cannot send either of these — both need a server-held credential —
 * so until those variables are set the delivery genuinely does not happen. The
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
  /** Plain-text body. Kept plain so it is readable in mail and in WhatsApp. */
  body: string;
};

async function sendEmail({ subject, body }: Submission): Promise<DeliveryResult> {
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
      body: JSON.stringify({ from, to: [target], subject, text: body }),
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

async function sendWhatsApp(to: string, { body }: Submission): Promise<DeliveryResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    return {
      channel: "whatsapp",
      target: to,
      ok: false,
      detail: "WHATSAPP_TOKEN and WHATSAPP_PHONE_ID are not configured on the server.",
    };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
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
