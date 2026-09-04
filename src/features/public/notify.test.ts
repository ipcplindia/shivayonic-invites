import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deliverSubmission, isDelivered } from "@/features/public/notify";

type Call = { url: string; init: RequestInit | undefined };

function stubFetch(responder: (url: string) => { status: number; body?: unknown }) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const { status, body } = responder(url);
    return { ok: status >= 200 && status < 300, status, json: async () => body ?? null } as Response;
  });
  return calls;
}

function bodyOf(call: Call): Record<string, unknown> {
  return JSON.parse(String(call.init?.body));
}

const submission = {
  subject: "Client form — Weddings",
  body: "Name: Amit\nPhone: 99900 99980\nVenue: Udaipur",
  short: "New client form: Weddings from Amit",
  replyTo: "amit@example.com",
};

const MESSAGING_KEYS = [
  "RESEND_API_KEY",
  "MAIL_FROM",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_ID",
  "WHATSAPP_TEMPLATE",
  "WHATSAPP_LANG",
] as const;

beforeEach(() => {
  // Never inherit a real credential from the developer's own .env.
  for (const key of MESSAGING_KEYS) vi.stubEnv(key, "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("delivering a submission", () => {
  it("reports an honest failure and calls nobody when nothing is configured", async () => {
    const calls = stubFetch(() => ({ status: 200 }));

    const results = await deliverSubmission(submission);

    expect(calls).toHaveLength(0);
    expect(results.every((r) => !r.ok)).toBe(true);
    expect(results.find((r) => r.channel === "email")?.detail).toContain("RESEND_API_KEY");
    expect(results.find((r) => r.channel === "whatsapp")?.detail).toContain("WHATSAPP_TOKEN");
    expect(isDelivered(results)).toBe(false);
  });

  it("sends the whole form by email, and replies go to the customer", async () => {
    vi.stubEnv("RESEND_API_KEY", "key");
    vi.stubEnv("MAIL_FROM", "Shivayonic <orders@shivayonic.com>");
    const calls = stubFetch(() => ({ status: 200 }));

    const results = await deliverSubmission(submission);

    const email = calls.find((c) => c.url.includes("api.resend.com"));
    expect(email).toBeDefined();
    const sent = bodyOf(email as Call);
    expect(sent.to).toEqual(["ipcplindia@gmail.com"]);
    expect(sent.from).toBe("Shivayonic <orders@shivayonic.com>");
    expect(sent.reply_to).toEqual(["amit@example.com"]);
    // The email is the system of record: it carries the body verbatim.
    expect(sent.text).toBe(submission.body);
    expect(isDelivered(results)).toBe(true);
  });

  it("attaches the completed form PDF, base64 encoded the way Resend expects", async () => {
    vi.stubEnv("RESEND_API_KEY", "key");
    vi.stubEnv("MAIL_FROM", "orders@shivayonic.com");
    const calls = stubFetch(() => ({ status: 200 }));
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"

    await deliverSubmission({
      ...submission,
      attachments: [{ filename: "Shivayonic-Form-01-weddings-celebrations.pdf", content: pdf }],
    });

    const sent = bodyOf(calls.find((c) => c.url.includes("api.resend.com")) as Call);
    const files = sent.attachments as { filename: string; content: string }[];
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe("Shivayonic-Form-01-weddings-celebrations.pdf");
    expect(files[0].content).toBe("JVBERg==");
  });

  it("sends no attachments key at all when there is no PDF to carry", async () => {
    vi.stubEnv("RESEND_API_KEY", "key");
    vi.stubEnv("MAIL_FROM", "orders@shivayonic.com");
    const calls = stubFetch(() => ({ status: 200 }));

    await deliverSubmission(submission);

    expect(bodyOf(calls.find((c) => c.url.includes("api.resend.com")) as Call)).not.toHaveProperty(
      "attachments",
    );
  });

  it("omits reply_to rather than sending an empty one when no address was given", async () => {
    vi.stubEnv("RESEND_API_KEY", "key");
    vi.stubEnv("MAIL_FROM", "orders@shivayonic.com");
    const calls = stubFetch(() => ({ status: 200 }));

    await deliverSubmission({ ...submission, replyTo: undefined });

    const sent = bodyOf(calls.find((c) => c.url.includes("api.resend.com")) as Call);
    expect(sent).not.toHaveProperty("reply_to");
  });

  it("sends WhatsApp as an approved template, never as free text", async () => {
    vi.stubEnv("WHATSAPP_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_ID", "phone-id");
    vi.stubEnv("WHATSAPP_TEMPLATE", "studio_alert");
    const calls = stubFetch(() => ({ status: 200 }));

    await deliverSubmission(submission);

    const whatsapp = calls.filter((c) => c.url.includes("graph.facebook.com"));
    // One per studio number.
    expect(whatsapp).toHaveLength(2);
    const sent = bodyOf(whatsapp[0]);
    expect(sent.type).toBe("template");
    expect(sent).not.toHaveProperty("text");
    expect(sent.template).toMatchObject({ name: "studio_alert", language: { code: "en" } });
  });

  it("flattens the template parameter, because Meta rejects newlines in one", async () => {
    vi.stubEnv("WHATSAPP_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_ID", "phone-id");
    vi.stubEnv("WHATSAPP_TEMPLATE", "studio_alert");
    const calls = stubFetch(() => ({ status: 200 }));

    await deliverSubmission({ ...submission, short: "New form\nfrom Amit\t— Udaipur" });

    const sent = bodyOf(calls.filter((c) => c.url.includes("graph.facebook.com"))[0]);
    const template = sent.template as {
      components: { parameters: { text: string }[] }[];
    };
    const parameter = template.components[0].parameters[0].text;
    expect(parameter).toBe("New form from Amit — Udaipur");
    expect(parameter).not.toMatch(/[\n\t]/);
  });

  it("treats a provider rejection as a failure rather than throwing", async () => {
    vi.stubEnv("RESEND_API_KEY", "key");
    vi.stubEnv("MAIL_FROM", "orders@shivayonic.com");
    stubFetch(() => ({ status: 422 }));

    const results = await deliverSubmission(submission);

    const email = results.find((r) => r.channel === "email");
    expect(email?.ok).toBe(false);
    expect(email?.detail).toContain("422");
    expect(isDelivered(results)).toBe(false);
  });

  it("does not call a WhatsApp template send without a template name", async () => {
    vi.stubEnv("WHATSAPP_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_ID", "phone-id");
    const calls = stubFetch(() => ({ status: 200 }));

    const results = await deliverSubmission(submission);

    expect(calls.filter((c) => c.url.includes("graph.facebook.com"))).toHaveLength(0);
    expect(results.find((r) => r.channel === "whatsapp")?.detail).toContain("WHATSAPP_TEMPLATE");
  });
});

describe("isDelivered", () => {
  it("does not count a WhatsApp alert as delivery, because it carries only a summary", () => {
    expect(
      isDelivered([
        { channel: "email", target: "studio@example.com", ok: false, detail: "down" },
        { channel: "whatsapp", target: "919990099980", ok: true },
      ]),
    ).toBe(false);
  });
});
