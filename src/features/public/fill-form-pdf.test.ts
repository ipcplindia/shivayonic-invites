import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { clientForms } from "@/features/public/client-forms";
import { fillFormPdf, formatAnswer } from "@/features/public/fill-form-pdf";

/**
 * The emailed brief is the studio's own PDF with the answers written into it,
 * built on the server from the template on disk. These cover the two things
 * that would silently ruin it: answers landing in the wrong fields (or in no
 * field at all), and ISO dates reaching a printed form.
 */

const fromDisk = async (pdfPath: string) =>
  readFile(path.join(process.cwd(), "public", pdfPath.replace(/^\//, "")));

describe("formatAnswer", () => {
  it("renders a date the way the printed form reads it", () => {
    expect(formatAnswer("date", "2026-12-15")).toBe("15/12/2026");
  });

  it("leaves every other answer untouched", () => {
    expect(formatAnswer("text", "2026-12-15")).toBe("2026-12-15");
    expect(formatAnswer("date", "sometime in December")).toBe("sometime in December");
  });
});

describe("fillFormPdf", () => {
  it("writes the answers into the real template's own fields", async () => {
    const form = clientForms.find((candidate) => candidate.slug === "weddings-celebrations");
    expect(form).toBeDefined();

    const { blob, fileName, missing } = await fillFormPdf(
      form!,
      {
        wedding_01_client_name_001: "Amit Poddar",
        wedding_01_first_draft_due_008: "2026-12-15",
        wedding_01_occasion_3_haldi_013: "Yes",
      },
      fromDisk,
    );

    // Every field written must exist in the template; a name drifting out of
    // step with the PDF is exactly the failure this guards.
    expect(missing).toEqual([]);
    expect(fileName).toBe("Shivayonic-Form-01-weddings-celebrations.pdf");
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000);

    // Read it back through pdf-lib rather than trusting the write.
    const { PDFDocument } = await import("pdf-lib");
    const filled = await PDFDocument.load(await blob.arrayBuffer());
    const acro = filled.getForm();
    expect(acro.getTextField("wedding_01_client_name_001").getText()).toBe("Amit Poddar");
    expect(acro.getTextField("wedding_01_first_draft_due_008").getText()).toBe("15/12/2026");
    expect(acro.getCheckBox("wedding_01_occasion_3_haldi_013").isChecked()).toBe(true);
  }, 30000);
});
