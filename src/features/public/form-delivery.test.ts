import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clientForms } from "@/features/public/client-forms";
import { fillFormPdf } from "@/features/public/fill-form-pdf";
import { deliverSubmission } from "@/features/public/notify";

/**
 * The whole delivery path, end to end: fill the studio template from disk, hand
 * it to the mailer, and decode what the mailer actually put on the wire.
 *
 * `fill-form-pdf.test.ts` proves the PDF is written correctly and
 * `notify.test.ts` proves an attachment is encoded, but neither proves the two
 * halves fit — that the base64 the provider receives decodes back to a file a
 * person can open. That gap is exactly where a corrupt attachment would hide,
 * so it is checked here on the real 1.6 MB template rather than a stub.
 */

const MESSAGING_KEYS = ["RESEND_API_KEY", "MAIL_FROM", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", "WHATSAPP_TEMPLATE"] as const;

beforeEach(() => {
  for (const key of MESSAGING_KEYS) vi.stubEnv(key, "");
  vi.stubEnv("RESEND_API_KEY", "key");
  vi.stubEnv("MAIL_FROM", "orders@shivayonic.com");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("form delivery", () => {
  it("puts a valid, openable, filled PDF on the wire", async () => {
    const form = clientForms.find((candidate) => candidate.slug === "weddings-celebrations");
    expect(form).toBeDefined();

    const { blob, fileName } = await fillFormPdf(
      form!,
      {
        wedding_01_client_name_001: "Amit Poddar",
        wedding_01_first_draft_due_008: "2026-12-15",
        wedding_01_occasion_3_haldi_013: "Yes",
      },
      async (pdfPath) => readFile(path.join(process.cwd(), "public", pdfPath.replace(/^\//, ""))),
    );

    let sent: Record<string, unknown> | undefined;
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      if (url.includes("api.resend.com")) sent = JSON.parse(String(init?.body));
      return { ok: true, status: 200, json: async () => null } as Response;
    });

    await deliverSubmission({
      subject: "Client form — Weddings",
      body: "Name: Amit Poddar",
      short: "New client form",
      attachments: [{ filename: fileName, content: new Uint8Array(await blob.arrayBuffer()) }],
    });

    const files = sent?.attachments as { filename: string; content: string }[];
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe("Shivayonic-Form-01-weddings-celebrations.pdf");

    // Decode exactly what the provider was given, and open it.
    const decoded = Buffer.from(files[0].content, "base64");
    expect(decoded.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(decoded.subarray(decoded.length - 32).toString("latin1")).toMatch(/%%EOF\s*$/);
    expect(decoded.length).toBeGreaterThan(1_000_000);

    const { PDFDocument } = await import("pdf-lib");
    const reopened = await PDFDocument.load(decoded);
    expect(reopened.getPageCount()).toBe(8);

    const acro = reopened.getForm();
    expect(acro.getTextField("wedding_01_client_name_001").getText()).toBe("Amit Poddar");
    expect(acro.getTextField("wedding_01_first_draft_due_008").getText()).toBe("15/12/2026");
    expect(acro.getCheckBox("wedding_01_occasion_3_haldi_013").isChecked()).toBe(true);

    // Every widget needs a drawn appearance, or a viewer shows the fields blank.
    expect(acro.getFields().length).toBeGreaterThan(300);
  }, 60000);
});
