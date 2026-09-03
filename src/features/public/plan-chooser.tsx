"use client";

import { ChoosePlanButton } from "@/features/public/cart-controls";
import { plans } from "@/features/public/data";

/**
 * The plan ladder, shown in place once a brief is submitted.
 *
 * The customer is not sent anywhere to pick a plan — the choice belongs to the
 * moment they finish the brief. Choosing one puts it in the basket and opens
 * the cart, where the design and the plan are reviewed together.
 *
 * It reuses the plan card styling from the plans page so the two surfaces are
 * the same component language, not a second design.
 */
export function PlanChooser() {
  return (
    <div className="plans reveal planChooser">
      {plans.map((plan, index) => (
        <article className={`planCard${plan.featured ? " planFeatured" : ""}`} key={plan.key}>
          <span aria-hidden="true" className={`planRail tone-${plan.tone}`} />

          <header className="planHead">
            <h3 className="planName">{plan.name}</h3>
            {plan.featured ? <span className="planBadge">Most chosen</span> : null}
          </header>

          <span aria-hidden="true" className="planLadder">
            {plans.map((_, rung) => (
              <span className={rung <= index ? "rung rungOn" : "rung"} key={rung} />
            ))}
          </span>

          <div className="planPriceBlock">
            {plan.price ? (
              <>
                <p className="planPrice">{plan.price}</p>
                <span className="planGst">{plan.priceNote}</span>
              </>
            ) : (
              <p className="planPriceAsk">{plan.priceNote}</p>
            )}
          </div>

          <p className="planTagline">{plan.tagline}</p>

          <div className="planActions">
            <ChoosePlanButton
              plan={{
                key: plan.key,
                name: plan.name,
                price: plan.price,
                priceNote: plan.priceNote,
              }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
