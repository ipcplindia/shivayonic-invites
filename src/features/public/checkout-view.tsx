"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/features/public/cart";

/**
 * Checkout: who the commission is for and where it goes.
 *
 * No payment is taken here. The details are submitted to the studio and the
 * order is confirmed by a person; the payment step is added separately, and
 * this page says so rather than implying a charge has happened.
 */
export function CheckoutView() {
  const { design, plan, briefSubmitted, ready, clear } = useCart();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!ready) return <p className="cartNote">Loading…</p>;

  if (!design && !plan) {
    return (
      <div className="cartEmpty">
        <p className="sectionLede">There is nothing to check out yet.</p>
        <div className="cartActions">
          <Link className="btn btnPrimary" href="/catalogue">
            Browse the collection
          </Link>
        </div>
      </div>
    );
  }

  if (state === "sent") {
    return (
      <div className="checkoutDone">
        <h2 className="sectionTitle">Thank you — we have your details.</h2>
        <p className="sectionLede">
          Our team will contact you to confirm the commission and take it from here. Payment is
          arranged once the details are agreed.
        </p>
        <div className="cartActions">
          <Link className="btn btnPrimary" href="/catalogue">
            Continue browsing
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage(null);

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: data,
          design,
          plan,
          briefSubmitted,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "We could not submit your details.");
      }
      clear();
      setState("sent");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We could not submit your details.");
    }
  }

  return (
    <form className="checkoutGrid" onSubmit={onSubmit}>
      <div className="checkoutFields">
        <fieldset className="checkoutSet">
          <legend>Your details</legend>
          <div className="checkoutRow">
            <label className="filterField">
              <span>Full name *</span>
              <input autoComplete="name" name="name" required type="text" />
            </label>
            <label className="filterField">
              <span>Email *</span>
              <input autoComplete="email" name="email" required type="email" />
            </label>
          </div>
          <div className="checkoutRow">
            <label className="filterField">
              <span>Phone *</span>
              <input autoComplete="tel" inputMode="tel" name="phone" required type="tel" />
            </label>
            <label className="filterField">
              <span>WhatsApp number</span>
              <input inputMode="tel" name="whatsapp" type="tel" />
            </label>
          </div>
        </fieldset>

        <fieldset className="checkoutSet">
          <legend>Address</legend>
          <label className="filterField">
            <span>Address line 1 *</span>
            <input autoComplete="address-line1" name="address1" required type="text" />
          </label>
          <label className="filterField">
            <span>Address line 2</span>
            <input autoComplete="address-line2" name="address2" type="text" />
          </label>
          <div className="checkoutRow">
            <label className="filterField">
              <span>City *</span>
              <input autoComplete="address-level2" name="city" required type="text" />
            </label>
            <label className="filterField">
              <span>State *</span>
              <input autoComplete="address-level1" name="state" required type="text" />
            </label>
          </div>
          <div className="checkoutRow">
            <label className="filterField">
              <span>PIN code *</span>
              <input
                autoComplete="postal-code"
                inputMode="numeric"
                name="pincode"
                pattern="[0-9]{6}"
                required
                title="Six digits"
                type="text"
              />
            </label>
            <label className="filterField">
              <span>Country</span>
              <input autoComplete="country-name" defaultValue="India" name="country" type="text" />
            </label>
          </div>
        </fieldset>

        <fieldset className="checkoutSet">
          <legend>Event</legend>
          <div className="checkoutRow">
            <label className="filterField">
              <span>Event date</span>
              <input name="eventDate" type="date" />
            </label>
            <label className="filterField">
              <span>Event city / venue</span>
              <input name="eventLocation" type="text" />
            </label>
          </div>
          <label className="filterField">
            <span>Anything else we should know</span>
            <textarea name="notes" rows={4} />
          </label>
        </fieldset>

        <fieldset className="checkoutSet">
          <legend>Staying in touch</legend>
          <label className="checkoutCheck">
            <input defaultChecked name="contactEmail" type="checkbox" value="yes" />
            <span>Email me about this commission</span>
          </label>
          <label className="checkoutCheck">
            <input defaultChecked name="contactSms" type="checkbox" value="yes" />
            <span>Send me texts and WhatsApp updates about this commission</span>
          </label>
          <label className="checkoutCheck">
            <input name="marketing" type="checkbox" value="yes" />
            <span>Occasionally tell me about new designs and offers</span>
          </label>
        </fieldset>
      </div>

      <aside className="cartSummary">
        <h2 className="cartSummaryTitle">Your commission</h2>
        <dl className="cartSummaryList">
          <div>
            <dt>Design</dt>
            <dd>{design?.name ?? "Not chosen"}</dd>
          </div>
          <div>
            <dt>Occasion</dt>
            <dd>{design?.occasion ?? "—"}</dd>
          </div>
          <div>
            <dt>Plan</dt>
            <dd>{plan?.name ?? "Not chosen"}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{plan?.price ?? "Quoted after we talk"}</dd>
          </div>
        </dl>

        {!briefSubmitted && design ? (
          <p className="cartNote cartNoteWarn">
            The brief for this design has not been filled in.{" "}
            <Link href={`/customise/${design.formSlug}`}>Fill it now</Link> so we have your details.
          </p>
        ) : null}

        <p className="cartNote">
          No payment is taken on this page. We confirm the commission with you first; online
          payment is being added shortly.
        </p>

        {message ? (
          <p className="cartNote cartNoteWarn" role="alert">
            {message}
          </p>
        ) : null}

        <div className="cartActions">
          <button className="btn btnPrimary" disabled={state === "sending"} type="submit">
            {state === "sending" ? "Submitting…" : "Submit order request"}
          </button>
          <Link className="btn btnGhost" href="/cart">
            Back to cart
          </Link>
        </div>
      </aside>
    </form>
  );
}
