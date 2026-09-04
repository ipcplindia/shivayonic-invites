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
 * Renders an answer the way the printed form expects to read it.
 *
 * `input[type="date"]` always yields ISO (2026-12-15). Written straight into a
 * printed brief that reads "15/12/2026" it looks like a machine artefact and is
 * ambiguous to anyone scanning the page, so dates are localised on the way in.
 */
export function formatAnswer(kind: string, value: string): string {
  if (kind !== "date") return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

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

/** Breaks a line of text to a width, in the crude way a fixed font allows. */
function wrap(text: string, chars: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (!word) continue;
      if (line.length + word.length + 1 > chars) {
        if (line) out.push(line);
        line = word.length > chars ? word.slice(0, chars) : word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    out.push(line);
  }
  return out;
}

/** Writes the answers that had no field in the template onto appended pages. */
async function appendOverflow(
  doc: Awaited<ReturnType<typeof import("pdf-lib").PDFDocument.load>>,
  form: ClientForm,
  overflow: { section: string; label: string; value: string }[],
) {
  const { StandardFonts, rgb } = await import("pdf-lib");
  const body = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const [w, h] = [595.28, 841.89]; // A4, matching the printed form.
  const margin = 48;
  const ink = rgb(0.16, 0.1, 0.08);
  const soft = rgb(0.42, 0.34, 0.3);

  let page = doc.addPage([w, h]);
  let y = h - margin;

  const nextPage = () => {
    page = doc.addPage([w, h]);
    y = h - margin;
  };

  page.drawText(`${form.name} — additional answers`, { x: margin, y, size: 14, font: bold, color: ink });
  y -= 16;
  page.drawText("Questions asked online that the printed form has no box for.", {
    x: margin, y, size: 9, font: body, color: soft,
  });
  y -= 24;

  let lastSection = "";
  for (const entry of overflow) {
    if (entry.section !== lastSection) {
      if (y < margin + 60) nextPage();
      y -= 6;
      page.drawText(entry.section.toUpperCase(), { x: margin, y, size: 8, font: bold, color: soft });
      y -= 14;
      lastSection = entry.section;
    }

    const lines = wrap(entry.value, 92);
    if (y < margin + 20 + lines.length * 11) nextPage();

    page.drawText(wrap(entry.label, 92)[0] ?? entry.label, { x: margin, y, size: 9, font: bold, color: ink });
    y -= 12;
    for (const line of lines) {
      if (y < margin) nextPage();
      page.drawText(line, { x: margin, y, size: 9, font: body, color: ink });
      y -= 11;
    }
    y -= 6;
  }
}

/**
 * Loads the blank template. In the browser that is a fetch of the public file;
 * on the server the caller passes a reader that takes it straight off disk, so
 * an emailed copy never depends on the site being reachable from itself.
 */
export type TemplateLoader = (pdfPath: string) => Promise<ArrayBuffer | Uint8Array>;

const fetchTemplate: TemplateLoader = async (pdfPath) => {
  const res = await fetch(pdfPath);
  if (!res.ok) throw new Error(`Could not load the form template (${res.status})`);
  return res.arrayBuffer();
};

export async function fillFormPdf(
  form: ClientForm,
  values: Record<string, string | string[]>,
  loadTemplate: TemplateLoader = fetchTemplate,
): Promise<FillResult> {
  const { PDFDocument } = await import("pdf-lib");

  const doc = await PDFDocument.load(await loadTemplate(form.pdf));
  const acro = doc.getForm();

  const unprintable: { label: string; value: string }[] = [];
  const missing: string[] = [];
  /** Answers with no field in the template — carried onto an appendix instead. */
  const overflow: { section: string; label: string; value: string }[] = [];

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
            overflow.push({ section: section.title, label: `${item.label} — ${opt.label}`, value: "Yes" });
          }
        }
        continue;
      }

      const raw = values[item.name];
      if (typeof raw !== "string" || !raw.trim()) continue;
      const shown = formatAnswer(item.kind, raw.trim());
      const { text, lost } = toWinAnsi(shown);
      if (lost) unprintable.push({ label: item.label, value: raw.trim() });
      try {
        const field = acro.getTextField(item.name);
        /*
         * Many boxes on the printed form carry a /MaxLen — "anything else" is
         * capped at 100 characters. Writing a longer answer throws, and the
         * catch below then left the box completely empty: the studio would read
         * a blank where the client had written a paragraph. So a long answer is
         * trimmed to what the box holds and carried in full on the appendix.
         */
        const max = field.getMaxLength();
        if (typeof max === "number" && max > 0 && text.length > max) {
          field.setText(`${text.slice(0, Math.max(1, max - 1))}…`);
          overflow.push({ section: section.title, label: item.label, value: shown });
        } else {
          field.setText(text);
        }
      } catch {
        missing.push(item.name);
        overflow.push({ section: section.title, label: item.label, value: shown });
      }
    }
  }

  // Draw the values into the page so they show in every viewer, not just ones
  // that regenerate appearances themselves.
  acro.updateFieldAppearances();

  /*
   * The online form asks more than the printed template has boxes for — a venue
   * address, a schedule note, a lyrics brief, "anything else". Those answers had
   * no field to land in and were quietly dropped from the attachment, which is
   * the worst possible outcome: the studio would read a complete-looking form and
   * never know what was missing. They are appended instead, so the PDF carries
   * every answer given.
   */
  if (overflow.length > 0) await appendOverflow(doc, form, overflow);

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
