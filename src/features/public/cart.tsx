"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * The browsing basket.
 *
 * A celebration is commissioned, not bought off a shelf: the customer picks a
 * design, fills the brief for it, then chooses the plan that covers the work.
 * So the cart holds one design and one plan rather than a quantity of things.
 *
 * It lives in localStorage only. Nothing is sent anywhere until the customer
 * submits the checkout form, and no payment is taken here — that arrives with
 * the payment integration.
 */

export type CartDesign = {
  slug: string;
  name: string;
  occasion: string;
  style: string;
  /** The form this design's brief is filled on. */
  formSlug: string;
};

export type CartPlan = {
  key: string;
  name: string;
  price: string | null;
  priceNote: string;
};

export type CartState = {
  design: CartDesign | null;
  plan: CartPlan | null;
  /** Set once the client form for this design has been submitted. */
  briefSubmitted: boolean;
};

const EMPTY: CartState = { design: null, plan: null, briefSubmitted: false };
const STORAGE_KEY = "shivayonic:cart:v1";

type CartApi = CartState & {
  ready: boolean;
  setDesign: (design: CartDesign) => void;
  setPlan: (plan: CartPlan) => void;
  markBriefSubmitted: () => void;
  removeDesign: () => void;
  removePlan: () => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

function read(): CartState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<CartState>;
    return {
      design: parsed.design ?? null,
      plan: parsed.plan ?? null,
      briefSubmitted: Boolean(parsed.briefSubmitted),
    };
  } catch {
    // Private mode, blocked storage, or a corrupt value: start empty.
    return EMPTY;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY);
  // `ready` keeps the server and first client render identical; the cart is
  // read after mount, so nothing hydrates against a mismatched basket.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  const persist = useCallback((next: CartState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // The basket still works for this session if it cannot be persisted.
    }
  }, []);

  const api = useMemo<CartApi>(
    () => ({
      ...state,
      ready,
      setDesign: (design) => persist({ ...state, design, briefSubmitted: false }),
      setPlan: (plan) => persist({ ...state, plan }),
      markBriefSubmitted: () => persist({ ...state, briefSubmitted: true }),
      removeDesign: () => persist({ ...state, design: null, briefSubmitted: false }),
      removePlan: () => persist({ ...state, plan: null }),
      clear: () => persist(EMPTY),
    }),
    [state, ready, persist],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider.");
  return value;
}

/** Which client form covers a given occasion. */
export function formSlugForOccasion(occasion: string): string {
  const key = occasion.toLowerCase();
  if (key.includes("corporate")) return "corporate-events";
  if (key.includes("hospitality") || key.includes("nightlife") || key.includes("club")) {
    return "hospitality-nightlife";
  }
  if (key.includes("bespoke")) return "bespoke-projects";
  return "weddings-celebrations";
}
