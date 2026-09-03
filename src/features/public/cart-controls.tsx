"use client";

import Link from "next/link";

import { formSlugForOccasion, useCart, type CartDesign, type CartPlan } from "@/features/public/cart";

/**
 * Add a design to the basket, then point at the brief for it.
 *
 * The two steps are deliberately one control: once a design is in the basket
 * the same slot becomes "Fill the form", because that is the only next step
 * that moves the commission forward.
 */
export function AddDesignToCart({
  design,
  compact = false,
}: {
  design: Omit<CartDesign, "formSlug">;
  compact?: boolean;
}) {
  const { design: current, ready, setDesign } = useCart();
  const inCart = ready && current?.slug === design.slug;
  const formSlug = formSlugForOccasion(design.occasion);

  if (inCart) {
    return (
      <Link className={compact ? "btn btnPrimary btnSm" : "btn btnPrimary"} href={`/customise/${formSlug}`}>
        Fill the form
      </Link>
    );
  }

  return (
    <button
      className={compact ? "btn btnPrimary btnSm" : "btn btnPrimary"}
      onClick={() => setDesign({ ...design, formSlug })}
      type="button"
    >
      Add to cart
    </button>
  );
}

/**
 * Choose a plan. Selecting one completes the basket, so this is the point the
 * customer is taken to the cart to review everything together.
 */
export function ChoosePlanButton({ plan, href = "/cart" }: { plan: CartPlan; href?: string }) {
  const { plan: current, ready, setPlan } = useCart();
  const chosen = ready && current?.key === plan.key;

  return (
    <Link
      aria-label={`Choose the ${plan.name} plan`}
      className={chosen ? "btn btnGhost planChoose" : "btn btnPrimary planChoose"}
      href={href}
      onClick={() => setPlan(plan)}
    >
      {chosen ? "Chosen — review cart" : "Choose"}
    </Link>
  );
}

/** The basket link in the header, showing whether anything is in it. */
export function CartLink() {
  const { design, plan, ready } = useCart();
  const count = ready ? (design ? 1 : 0) + (plan ? 1 : 0) : 0;

  return (
    <Link aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`} className="navCart" href="/cart">
      Cart
      {count > 0 ? <span className="navCartCount">{count}</span> : null}
    </Link>
  );
}
