"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useCart } from "@/features/public/cart";
import { contact } from "@/features/public/data";
import { PIcon } from "@/features/public/icons";
import { PlanChooser } from "@/features/public/plan-chooser";
import { fillFormPdf, formatAnswer } from "@/features/public/fill-form-pdf";
import type { ClientForm, FormItem } from "@/features/public/client-forms";

/**
 * The full client brief, online.
 *
 * These forms run to roughly 300 fields, so three things matter more than
 * anything else here:
 *
 *  - progress is saved to the browser as you type, because nobody completes a
 *    brief this size in one sitting and losing it would be unforgivable;
 *  - it is walked one section at a time rather than as a single endless page;
 *  - sending produces the real PDF with the answers written into it, rather than
 *    a wall of text, so the studio receives the same document it already works
 *    from. Submitting delivers the answers to the studio from the server — the
 *    customer never has to pick a channel or attach anything — and then offers
 *    the plans in place so the commission can be completed without leaving.
 */

type Values = Record<string, string | string[]>;

/** Full plain-text answers — used only if the PDF cannot be produced. */
function summarise(form: ClientForm, values: Values): string {
  const out: string[] = [`SHIVAYONIC — ${form.name} (Form ${form.formNo})`, ""];
  for (const section of form.sections) {
    const lines: string[] = [];
    for (const item of section.items) {
      if (item.kind === "subhead") continue;
      if (item.kind === "checkboxes") {
        const picked = item.options.filter((o) => values[o.name]).map((o) => o.label);
        if (picked.length) lines.push(`${item.label}: ${picked.join(", ")}`);
        continue;
      }
      const v = values[item.name];
      if (typeof v === "string" && v.trim()) lines.push(`${item.label}: ${formatAnswer(item.kind, v.trim())}`);
    }
    if (lines.length) out.push(`— ${section.title} —`, ...lines, "");
  }
  return out.join("\n").trim();
}

export function ClientFormView({ form }: { form: ClientForm }) {
  const storageKey = `shivayonic:brief:${form.slug}`;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [restored, setRestored] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const cart = useCart();
  const topRef = useRef<HTMLDivElement>(null);

  // Restore any draft, then keep it in step with what is typed.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        setValues(JSON.parse(raw));
        setRestored(true);
      }
    } catch {
      /* private mode or blocked storage — the form still works, just not saved */
    }
  }, [storageKey]);

  useEffect(() => {
    if (!Object.keys(values).length) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      /* ignore quota or blocked storage */
    }
  }, [values, storageKey]);

  const sections = form.sections;
  const section = sections[step];

  const { answered, total } = useMemo(() => {
    let a = 0, t = 0;
    for (const s of sections) {
      for (const it of s.items) {
        if (it.kind === "subhead") continue;
        if (it.kind === "checkboxes") {
          t += 1;
          if (it.options.some((o) => values[o.name])) a += 1;
          continue;
        }
        t += 1;
        if (typeof values[it.name] === "string" && (values[it.name] as string).trim()) a += 1;
      }
    }
    return { answered: a, total: t };
  }, [sections, values]);

  const set = (name: string, value: string | string[]) =>
    setValues((v) => {
      const next = { ...v };
      if (!value || (Array.isArray(value) && !value.length)) delete next[name];
      else next[name] = value;
      return next;
    });

  const go = (n: number) => {
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const summary = summarise(form, values);

  /** Pull an identifying answer by the tail of its field name. */
  const answerLike = (needle: string) => {
    const key = Object.keys(values).find((k) => k.includes(needle));
    const v = key ? values[key] : undefined;
    return typeof v === "string" ? v.trim() : "";
  };

  /** Hands a generated file to the browser as a download. */
  const saveBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Download the completed PDF on its own. */
  const downloadPdf = async () => {
    setBusy(true);
    setSendError(null);
    try {
      const { blob, fileName } = await fillFormPdf(form, values);
      saveBlob(blob, fileName);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not build the PDF.");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Submit the brief.
   *
   * The answers go to the studio from the server, so the customer does not pick
   * a channel, attach a file, or leave the page. If delivery fails they are told
   * plainly and the PDF download stays available as the fallback.
   */
  const submitBrief = async () => {
    setBusy(true);
    setSendError(null);
    try {
      const res = await fetch("/api/public/form-submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          formSlug: form.slug,
          formName: form.name,
          formNo: String(form.formNo ?? ""),
          contactName: answerLike("_client_name_"),
          contactEmail: answerLike("_client_email_"),
          contactPhone: answerLike("_client_mobile_"),
          design: cart.design ? `${cart.design.name} (${cart.design.occasion})` : "",
          summary,
          // The answers themselves, so the server can write them into the real
          // studio PDF. Only what was answered is sent.
          values,
        }),
      });
      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(problem?.message ?? "We could not submit your form.");
      }
      cart.markBriefSubmitted(form.slug);
      setDone(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "We could not submit your form.");
    } finally {
      setBusy(false);
    }
  };

  const clearDraft = () => {
    try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setValues({});
    setRestored(false);
    setDone(false);
    go(0);
  };

  if (done) {
    return (
      <div className="formThanks reveal">
        <span className="formThanksMark">
          <PIcon name="check" size={26} />
        </span>
        <h2 className="sectionTitle">Thank you — your form is with us</h2>
        <p className="sectionLede" style={{ margin: "1rem auto 0" }}>
          Your answers have been sent to our team. Now choose the level of service for your
          celebration, and we will confirm everything with you.
        </p>
        {sendError ? <p className="briefWarn">{sendError}</p> : null}
        <div className="formThanksActions">
          <button className="btn btnGhost" onClick={() => setDone(false)} type="button">
            Back to the form
          </button>
          <button className="btn btnGhost" disabled={busy} onClick={downloadPdf} type="button">
            {busy ? "Preparing…" : "Download your copy"}
          </button>
        </div>

        {/*
          The plans appear here rather than on another page: choosing the level
          of service is the next step of this same decision, and sending the
          customer away to find it loses them.
        */}
        <div className="formPlans">
          <p className="sectionEyebrow">Choose your level</p>
          <h3 className="sectionTitle">One package for the whole celebration</h3>
          <PlanChooser />
          <p className="formThanksNote">
            Choosing a plan opens your cart, where you can review the design and the plan together.
          </p>
        </div>
      </div>
    );
  }

  const isReview = step === sections.length;

  return (
    <div className="briefForm reveal" ref={topRef}>
      <div className="briefProgress">
        <div className="briefProgressBar">
          <span style={{ width: `${total ? Math.round((answered / total) * 100) : 0}%` }} />
        </div>
        <p className="briefProgressText">
          {answered} of {total} answered · Step {Math.min(step + 1, sections.length + 1)} of {sections.length + 1}
        </p>
      </div>

      <nav className="briefSteps" aria-label="Form sections">
        {sections.map((s, i) => (
          <button
            key={s.title}
            type="button"
            className={i === step ? "briefStep briefStepOn" : "briefStep"}
            onClick={() => go(i)}
          >
            <span className="briefStepNo">{String(i + 1).padStart(2, "0")}</span>
            {s.title}
          </button>
        ))}
        <button
          type="button"
          className={isReview ? "briefStep briefStepOn" : "briefStep"}
          onClick={() => go(sections.length)}
        >
          <span className="briefStepNo">{String(sections.length + 1).padStart(2, "0")}</span>
          Review & send
        </button>
      </nav>

      {restored && !isReview ? (
        <p className="briefRestored">
          We restored your saved answers from this browser.{" "}
          <button type="button" onClick={clearDraft}>
            Start fresh
          </button>
        </p>
      ) : null}

      {isReview ? (
        <div className="briefReview">
          <h3 className="legalHeading">Review &amp; send</h3>
          <p className="legalBody">
            {answered === 0
              ? "Nothing has been filled in yet — go back and answer at least the essentials."
              : `You have answered ${answered} of ${total}. Blank questions are simply left out; we will cover them when we speak.`}
          </p>

          {answered > 0 ? (
            <>
              <p className="briefSummaryLabel">What will be written into the form</p>
              <pre className="briefSummary">{summary}</pre>
            </>
          ) : null}

          {/*
            If delivery fails the customer is not left holding an error: the
            PDF and a direct message to the studio are both one click away.
          */}
          {sendError ? (
            <div className="briefWarn" role="alert">
              <p>{sendError}</p>
              <a
                className="btn btnSaffron btnSm"
                href={contact.whatsappUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <PIcon name="whatsapp" size={15} /> Message us on WhatsApp
              </a>
            </div>
          ) : null}

          <div className="briefSend">
            <button
              className="btn btnPrimary"
              disabled={!answered || busy}
              onClick={submitBrief}
              type="button"
            >
              {busy ? "Submitting…" : "Submit the form"}
            </button>
            <button
              className="btn btnGhost"
              disabled={!answered || busy}
              onClick={downloadPdf}
              type="button"
            >
              {busy ? "Preparing…" : "Download the PDF"}
            </button>
          </div>
          <p className="formFoot">
            Submitting sends your answers straight to our team — there is nothing to attach and
            nowhere else to go. You can download a copy for your own records.
          </p>
        </div>
      ) : (
        <section className="briefSection" aria-label={section.title}>
          <h3 className="briefSectionTitle">{section.title}</h3>
          {section.blurb ? <p className="briefSectionBlurb">{section.blurb}</p> : null}
          <div className="formGrid">
            {section.items.map((item, i) => (
              <ItemView key={itemKey(item, i)} item={item} values={values} set={set} />
            ))}
          </div>
        </section>
      )}

      <div className="briefNav">
        <button type="button" className="btn btnGhost" disabled={step === 0} onClick={() => go(step - 1)}>
          Back
        </button>
        <button
          type="button"
          className="btn btnPrimary"
          disabled={isReview}
          onClick={() => go(Math.min(step + 1, sections.length))}
        >
          {step === sections.length - 1 ? "Review & send" : "Next section"}{" "}
          <PIcon name="arrow" size={15} />
        </button>
      </div>
    </div>
  );
}

function itemKey(item: FormItem, i: number) {
  return item.kind === "subhead" ? `h-${i}-${item.label}` : item.kind === "checkboxes" ? `c-${i}-${item.label}` : item.name;
}

function ItemView({
  item,
  values,
  set,
}: {
  item: FormItem;
  values: Values;
  set: (name: string, value: string | string[]) => void;
}) {
  if (item.kind === "subhead") {
    return <p className="briefSubhead">{item.label}</p>;
  }

  if (item.kind === "checkboxes") {
    return (
      <fieldset className="field fieldWide checkField">
        <legend>{item.label}</legend>
        <div className="checkGrid">
          {item.options.map((o) => (
            <label key={o.name} className="checkItem">
              <input
                type="checkbox"
                checked={Boolean(values[o.name])}
                onChange={(e) => set(o.name, e.target.checked ? "Yes" : "")}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const id = `f-${item.name}`;
  const value = (values[item.name] as string) ?? "";
  const label = (
    <label htmlFor={id}>
      {item.label}
      {item.required ? " *" : ""}
    </label>
  );

  if (item.kind === "textarea") {
    return (
      <div className="field fieldWide">
        {label}
        <textarea id={id} value={value} onChange={(e) => set(item.name, e.target.value)} />
      </div>
    );
  }

  /*
   * A native date box opens its calendar only when the small icon at its right
   * edge is clicked; clicking the wide empty rest of the field does nothing,
   * which reads as a broken control. Opening the picker from anywhere in the
   * field makes the whole box behave the way it looks like it should.
   */
  const openPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    if (item.kind !== "date") return;
    const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
    try {
      el.showPicker?.();
    } catch {
      /* Not permitted in this browser — the icon and keyboard entry still work. */
    }
  };

  return (
    <div className={item.kind === "date" ? "field fieldDate" : "field"}>
      {label}
      <input
        id={id}
        type={item.kind}
        value={value}
        onChange={(e) => set(item.name, e.target.value)}
        onClick={openPicker}
        autoComplete="off"
      />
    </div>
  );
}
