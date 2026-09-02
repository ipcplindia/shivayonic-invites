"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { PIcon } from "@/features/public/icons";
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
 *  - only answered fields are sent, and if the result is too long to survive a
 *    WhatsApp or mailto URL we say so and hand over a file instead of silently
 *    truncating the answers.
 */

const WHATSAPP = "919990099990";
const EMAIL = "ipcplindia@gmail.com";
/*
 * Measured against the ENCODED length, since that is what actually travels in
 * the URL. Outlook and several mobile mail clients truncate a mailto around
 * 2000 characters, so warn below that rather than at it.
 */
const URL_SAFE_ENCODED = 1800;

type Values = Record<string, string | string[]>;

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
  const tooLongForUrl = encodeURIComponent(summary).length > URL_SAFE_ENCODED;

  const download = () => {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shivayonic-brief-${form.slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const send = (channel: "whatsapp" | "email") => {
    const url =
      channel === "whatsapp"
        ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(summary)}`
        : `mailto:${EMAIL}?subject=${encodeURIComponent(`Shivayonic brief — ${form.name}`)}&body=${encodeURIComponent(summary)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setDone(channel);
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
          {done === "whatsapp"
            ? "We have opened WhatsApp with your brief filled in — press send and it reaches our team."
            : "We have opened your email app with the brief filled in — press send and it reaches our team."}
        </p>
        <p className="formThanksNote">
          Nothing has been submitted until you send that message. Your answers stay saved in this browser
          until you clear them.
        </p>
        <div className="formThanksActions">
          <button type="button" className="btn btnGhost" onClick={() => setDone(null)}>
            Back to the brief
          </button>
          <button type="button" className="btn btnGhost" onClick={download}>
            Download a copy
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

          {answered > 0 ? <pre className="briefSummary">{summary}</pre> : null}

          {tooLongForUrl ? (
            <p className="briefWarn">
              This brief is now longer than a WhatsApp or email link can safely carry. Download it and attach
              the file instead — that way nothing gets cut off.
            </p>
          ) : null}

          {/* Past the URL limit the file becomes the reliable route, so it leads. */}
          <div className="briefSend">
            <button
              type="button"
              className={tooLongForUrl ? "btn btnSaffron" : "btn btnGhost"}
              disabled={!answered}
              onClick={download}
            >
              Download as a file
            </button>
            <button
              type="button"
              className={tooLongForUrl ? "btn btnGhost" : "btn btnSaffron"}
              disabled={!answered}
              onClick={() => send("whatsapp")}
            >
              <PIcon name="whatsapp" size={17} /> Send on WhatsApp
            </button>
            <button
              type="button"
              className={tooLongForUrl ? "btn btnGhost" : "btn btnPrimary"}
              disabled={!answered}
              onClick={() => send("email")}
            >
              Send by email
            </button>
          </div>
          <p className="formFoot">
            {tooLongForUrl
              ? "Download the file and attach it to a WhatsApp message or email — that way every answer arrives intact."
              : "WhatsApp and email both open with your answers already filled in — you just press send."}
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
