"use client";

import Link from "next/link";

import { artFor, featuredBySlug } from "@/features/public/data";
import { focusFor } from "@/features/public/image-focus";
import { useCart } from "@/features/public/cart";

/**
 * The basket: the design, the plan, and the two ways onward.
 *
 * No total is shown. A commission is priced by its plan, and the bespoke tier
 * has no number at all, so adding figures together here would invent one.
 */
export function CartView() {
  const { design, plan, briefSubmitted, ready, removeDesign, removePlan } = useCart();

  if (!ready) {
    return <p className="cartNote">Loading your cart…</p>;
  }

  if (!design && !plan) {
    return (
      <div className="cartEmpty">
        <p className="sectionLede">
          Your cart is empty. Browse the collection and add the design you would like us to craft.
        </p>
        <div className="cartActions">
          <Link className="btn btnPrimary" href="/catalogue">
            Browse the collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cartGrid">
      <div className="cartItems">
        {design ? (
          <article className="cartItem">
            <span
              aria-hidden="true"
              className="cartItemArt"
              style={{
                backgroundImage: `url(${featuredBySlug(design.slug)?.img ?? artFor(design.slug)})`,
                backgroundPosition: focusFor(featuredBySlug(design.slug)?.img ?? artFor(design.slug)),
              }}
            />
            <div className="cartItemBody">
              <p className="cartItemKind">Design</p>
              <h2 className="cartItemName">{design.name}</h2>
              <p className="cartItemMeta">
                {design.occasion} · {design.style}
              </p>
              <p className={briefSubmitted ? "cartBrief cartBriefDone" : "cartBrief"}>
                {briefSubmitted
                  ? "Brief submitted — we have your details."
                  : "Brief not filled in yet."}
              </p>
              <div className="cartItemActions">
                <Link className="btn btnGhost btnSm" href="/catalogue">
                  Change design
                </Link>
                <Link className="btn btnGhost btnSm" href={`/customise/${design.formSlug}`}>
                  {briefSubmitted ? "Edit the brief" : "Fill the form"}
                </Link>
                <button className="btn btnGhost btnSm" onClick={removeDesign} type="button">
                  Remove
                </button>
              </div>
            </div>
          </article>
        ) : (
          <article className="cartItem cartItemMissing">
            <div className="cartItemBody">
              <p className="cartItemKind">Design</p>
              <h2 className="cartItemName">No design chosen</h2>
              <p className="cartItemMeta">Pick the invitation you would like us to craft.</p>
              <div className="cartItemActions">
                <Link className="btn btnPrimary btnSm" href="/catalogue">
                  Browse designs
                </Link>
              </div>
            </div>
          </article>
        )}

        {plan ? (
          <article className="cartItem">
            <span aria-hidden="true" className="cartItemArt cartItemArtPlan">
              {plan.name.charAt(0)}
            </span>
            <div className="cartItemBody">
              <p className="cartItemKind">Plan</p>
              <h2 className="cartItemName">{plan.name}</h2>
              <p className="cartItemMeta">{plan.price ?? plan.priceNote}</p>
              {plan.price ? <p className="cartItemMeta">{plan.priceNote}</p> : null}
              <div className="cartItemActions">
                <Link className="btn btnGhost btnSm" href="/plans">
                  Change plan
                </Link>
                <button className="btn btnGhost btnSm" onClick={removePlan} type="button">
                  Remove
                </button>
              </div>
            </div>
          </article>
        ) : (
          <article className="cartItem cartItemMissing">
            <div className="cartItemBody">
              <p className="cartItemKind">Plan</p>
              <h2 className="cartItemName">No plan chosen</h2>
              <p className="cartItemMeta">Choose the level of service for your celebration.</p>
              <div className="cartItemActions">
                <Link className="btn btnPrimary btnSm" href="/plans">
                  Choose a plan
                </Link>
              </div>
            </div>
          </article>
        )}
      </div>

      <aside className="cartSummary">
        <h2 className="cartSummaryTitle">Summary</h2>
        <dl className="cartSummaryList">
          <div>
            <dt>Design</dt>
            <dd>{design?.name ?? "Not chosen"}</dd>
          </div>
          <div>
            <dt>Brief</dt>
            <dd>{briefSubmitted ? "Submitted" : "Not filled in"}</dd>
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
        <p className="cartNote">
          Nothing is charged here. We confirm every commission with you before any payment.
        </p>
        <div className="cartActions">
          <Link className="btn btnPrimary" href="/checkout">
            Continue to checkout
          </Link>
          <Link className="btn btnGhost" href="/catalogue">
            Continue browsing
          </Link>
        </div>
      </aside>
    </div>
  );
}
