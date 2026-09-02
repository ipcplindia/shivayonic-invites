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
          We have opened WhatsApp with your details filled in — just press send. Our team will review your
          interest in becoming a Shivayonic dealer / distributor and reach out to you soon.
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
        const data = new FormData(e.currentTarget);
        const line = (k: string, label: string) => {
          const v = (data.get(k) as string)?.trim();
          return v ? `${label}: ${v}` : null;
        };
        const body = [
          "Hello Shivayonic Invites, my company would like to become a dealer / distributor partner.",
          "",
          line("name", "Name"),
          line("organisation", "Organisation"),
          line("email", "Email"),
          line("mobile", "Mobile"),
          line("gstn", "GSTN"),
          line("country", "Country"),
          line("state", "State"),
          line("pin", "PIN"),
          line("address", "Address"),
          line("about", "About"),
        ]
          .filter((l) => l !== null)
          .join("\n");
        window.open(`https://wa.me/919990099990?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
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
