import type { ClientForm } from "@/features/public/client-forms";

/**
 * Fills the real client PDF with the answers given online.
 *
 * The online forms were generated from these PDFs and kept their AcroForm field
 * names, so filling is a direct name-for-name write — what the studio receives is
 * the same document they already work from, with the answers in place, rather
 * than a wall of text.
 *
 * pdf-lib is imported on demand: it is only needed at the moment someone sends,
 * so it stays out of every other page's bundle.
 */

export type FillResult = {
  blob: Blob;
  fileName: string;
  /** Answers the PDF's base font cannot draw (e.g. Devanagari). Never dropped. */
  unprintable: { label: string; value: string }[];
  missing: string[];
};

/**
 * The form fields draw with Helvetica, which is WinAnsi-encoded. Curly quotes,
 * dashes and accents are folded to characters it can render; anything left over
 * (other scripts) is reported so the caller can carry it in the message instead
 * of silently losing it.
 */
function toWinAnsi(input: string): { text: string; lost: boolean } {
  const folded = input
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .normalize("NFC");

  // Anything outside Latin-1 plus the handful of WinAnsi extras cannot be drawn.
  const printable = /^[\u0020-\u007E\u00A0-\u00FF\u20AC\u201A\u0192\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178\n\r\t]*$/;
  if (printable.test(folded)) return { text: folded, lost: false };

  // Strip combining marks first — that alone rescues most accented input.
  const stripped = folded.normalize("NFD").replace(/[\u0300-\u036F]/g, "").normalize("NFC");
  if (printable.test(stripped)) return { text: stripped, lost: false };

  return { text: stripped.replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, ""), lost: true };
}

export async function fillFormPdf(
  form: ClientForm,
  values: Record<string, string | string[]>,
): Promise<FillResult> {
  const { PDFDocument } = await import("pdf-lib");

  const res = await fetch(form.pdf);
  if (!res.ok) throw new Error(`Could not load the form template (${res.status})`);
  const doc = await PDFDocument.load(await res.arrayBuffer());
  const acro = doc.getForm();

  const unprintable: { label: string; value: string }[] = [];
  const missing: string[] = [];

  for (const section of form.sections) {
    for (const item of section.items) {
      if (item.kind === "subhead") continue;

      if (item.kind === "checkboxes") {
        for (const opt of item.options) {
          if (!values[opt.name]) continue;
          try {
            acro.getCheckBox(opt.name).check();
          } catch {
            missing.push(opt.name);
          }
        }
        continue;
      }

      const raw = values[item.name];
      if (typeof raw !== "string" || !raw.trim()) continue;
      const { text, lost } = toWinAnsi(raw.trim());
      if (lost) unprintable.push({ label: item.label, value: raw.trim() });
      try {
        acro.getTextField(item.name).setText(text);
      } catch {
        missing.push(item.name);
      }
    }
  }

  // Draw the values into the page so they show in every viewer, not just ones
  // that regenerate appearances themselves.
  acro.updateFieldAppearances();

  const bytes = await doc.save();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return {
    blob: new Blob([buffer], { type: "application/pdf" }),
    fileName: `Shivayonic-Form-${form.formNo}-${form.slug}.pdf`,
    unprintable,
    missing,
  };
}
