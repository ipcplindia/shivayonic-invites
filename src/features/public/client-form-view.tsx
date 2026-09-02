"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { PIcon } from "@/features/public/icons";
import { fillFormPdf } from "@/features/public/fill-form-pdf";
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
 *    from. On a phone it is shared straight into WhatsApp or mail; elsewhere it
 *    downloads and the message opens alongside it.
 */

const WHATSAPP = "919990099990";
const EMAIL = "ipcplindia@gmail.com";

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
      if (typeof v === "string" && v.trim()) lines.push(`${item.label}: ${v.trim()}`);
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
  const [done, setDone] = useState<"whatsapp" | "email" | null>(null);
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sharedFile, setSharedFile] = useState(false);
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

  /*
   * The PDF carries the answers, so the message only has to say what is attached
   * and who it is from — short enough to survive any mail client or wa.me link.
   */
  const coveringNote = (unprintable: { label: string; value: string }[]) => {
    const lines = [
      "Hello Shivayonic Invites — my completed client form is attached.",
      "",
      `Form ${form.formNo} · ${form.name}`,
    ];
    const name = answerLike("_client_name_");
    const mobile = answerLike("_client_mobile_");
    const email = answerLike("_client_email_");
    if (name) lines.push(`Name: ${name}`);
    if (mobile) lines.push(`Mobile: ${mobile}`);
    if (email) lines.push(`Email: ${email}`);
    if (unprintable.length) {
      lines.push(
        "",
        "These answers use characters the PDF form cannot print, so they are written here instead:",
        ...unprintable.map((u) => `${u.label}: ${u.value}`),
      );
    }
    return lines.join("\n");
  };

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

  const send = async (channel: "whatsapp" | "email") => {
    setBusy(true);
    setSendError(null);
    try {
      const { blob, fileName, unprintable } = await fillFormPdf(form, values);
      const text = coveringNote(unprintable);
      const file = new File([blob], fileName, { type: "application/pdf" });

      // On a phone this hands the PDF straight to WhatsApp or mail, already
      // attached. Desktop browsers cannot attach a file to a link, so there the
      // PDF downloads and the message opens beside it.
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text, title: `Shivayonic — ${form.name}` });
          setSharedFile(true);
          setDone(channel);
          return;
        } catch (err) {
          // A cancelled share is the user's choice, not a failure.
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      saveBlob(blob, fileName);
      setSharedFile(false);
      const url =
        channel === "whatsapp"
          ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
          : `mailto:${EMAIL}?subject=${encodeURIComponent(`Shivayonic client form ${form.formNo} — ${form.shortName}`)}&body=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setDone(channel);
    } catch (err) {
      // Never strand the answers: fall back to sending them as text.
      setSendError(
        err instanceof Error
          ? `${err.message} Your answers were sent as text instead.`
          : "Could not build the PDF. Your answers were sent as text instead.",
      );
      const url =
        channel === "whatsapp"
          ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(summary)}`
          : `mailto:${EMAIL}?subject=${encodeURIComponent(`Shivayonic brief — ${form.name}`)}&body=${encodeURIComponent(summary)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setDone(channel);
    } finally {
      setBusy(false);
    }
  };

  const clearDraft = () => {
    try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setValues({});
    setRestored(false);
    setDone(null);
    go(0);
  };

  if (done) {
    return (
      <div className="formThanks reveal">
        <span className="formThanksMark">
          <PIcon name="check" size={26} />
        </span>
        <h2 className="sectionTitle">Almost there</h2>
        <p className="sectionLede" style={{ margin: "1rem auto 0" }}>
          {sharedFile
            ? "Your completed form has been handed to the app you chose — press send there and it reaches our team."
            : done === "whatsapp"
              ? "Your completed form has downloaded and WhatsApp is open. Attach the PDF to the message, then press send."
              : "Your completed form has downloaded and your email app is open. Attach the PDF to the message, then press send."}
        </p>
        <p className="formThanksNote">
          Nothing has been submitted until you send that message. Your answers stay saved in this browser
          until you clear them.
        </p>
        {sendError ? <p className="briefWarn">{sendError}</p> : null}
        <div className="formThanksActions">
          <button type="button" className="btn btnGhost" onClick={() => setDone(null)}>
            Back to the form
          </button>
          <button type="button" className="btn btnGhost" disabled={busy} onClick={downloadPdf}>
            {busy ? "Preparing…" : "Download the PDF again"}
          </button>
          <Link href="/" className="btn btnPrimary">
            Return home
          </Link>
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

          {sendError ? <p className="briefWarn">{sendError}</p> : null}

          <div className="briefSend">
            <button
              type="button"
              className="btn btnSaffron"
              disabled={!answered || busy}
              onClick={() => send("whatsapp")}
            >
              <PIcon name="whatsapp" size={17} /> {busy ? "Preparing…" : "Send on WhatsApp"}
            </button>
            <button
              type="button"
              className="btn btnPrimary"
              disabled={!answered || busy}
              onClick={() => send("email")}
            >
              {busy ? "Preparing…" : "Send by email"}
            </button>
            <button type="button" className="btn btnGhost" disabled={!answered || busy} onClick={downloadPdf}>
              {busy ? "Preparing…" : "Download the PDF"}
            </button>
          </div>
          <p className="formFoot">
            Your answers are written into the real Shivayonic form and sent as a PDF. On a phone it attaches
            itself; on a computer it downloads and you attach it to the message.
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

  return (
    <div className="field">
      {label}
      <input
        id={id}
        type={item.kind}
        value={value}
        onChange={(e) => set(item.name, e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}
