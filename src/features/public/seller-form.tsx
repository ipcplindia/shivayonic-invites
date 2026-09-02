"use client";

import { useState } from "react";

import Link from "next/link";

import { PIcon } from "@/features/public/icons";

/**
 * Seller / partner enquiry form.
 *
 * No backend yet, so this is honest about what it does: it collects the details
 * and shows a thank-you screen. It never claims the application was transmitted
 * or stored. When a backend or email endpoint exists, POST from handleSubmit.
 */

const fields = [
  { name: "name", label: "Full name", type: "text", wide: false, required: true },
  { name: "organisation", label: "Organisation", type: "text", wide: false, required: true },
  { name: "email", label: "Email", type: "email", wide: false, required: true },
  { name: "mobile", label: "Mobile number", type: "tel", wide: false, required: true },
  { name: "gstn", label: "GSTN", type: "text", wide: false, required: false },
  { name: "country", label: "Country", type: "text", wide: false, required: true },
  { name: "state", label: "State", type: "text", wide: false, required: true },
  { name: "pin", label: "PIN code", type: "text", wide: false, required: true },
  { name: "address", label: "Address", type: "text", wide: true, required: true },
] as const;

export function SellerForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="formThanks reveal">
        <span className="formThanksMark">
          <PIcon name="play" size={26} />
        </span>
        <h2 className="sectionTitle">Thank you</h2>
        <p className="sectionLede" style={{ margin: "1rem auto 0" }}>
          Your details are in. Our team will review your interest in becoming a Shivayonic seller and reach out
          to you soon.
        </p>
        <div style={{ marginTop: "2rem" }}>
          <Link href="/" className="btn btnGhost">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="formWrap reveal"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="formGrid">
        {fields.map((f) => (
          <div key={f.name} className={f.wide ? "field fieldWide" : "field"}>
            <label htmlFor={f.name}>
              {f.label}
              {f.required ? " *" : ""}
            </label>
            <input id={f.name} name={f.name} type={f.type} required={f.required} autoComplete="off" />
          </div>
        ))}
        <div className="field fieldWide">
          <label htmlFor="about">Tell us about yourself *</label>
          <textarea id="about" name="about" required />
        </div>
        <div className="formActions">
          <button type="submit" className="btn btnSaffron">
            Submit application
          </button>
        </div>
      </div>
    </form>
  );
}
