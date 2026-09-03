import type { ReactNode } from "react";

import "@/features/public/public.css";
import "@/features/public/public-sections.css";
import "@/features/public/public-pages.css";
import { CartProvider } from "@/features/public/cart";
import { SiteNav } from "@/features/public/site-nav";
import { SiteFooter } from "@/features/public/site-footer";

/**
 * Shared wrapper for every inner public page: the ivory canvas, the navigation,
 * and the footer. `solidNav` renders the warm header from the top for pages
 * whose first element is not a full-bleed hero.
 */
export function PageFrame({
  children,
  solidNav = false,
}: {
  children: ReactNode;
  solidNav?: boolean;
}) {
  return (
    <CartProvider>
      <div className="site" id="top">
        <SiteNav solid={solidNav} />
        <main className={solidNav ? "pageMain" : undefined}>{children}</main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
