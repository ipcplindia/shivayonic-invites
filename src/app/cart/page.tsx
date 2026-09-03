import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, SectionHead } from "@/features/public/sections";
import { CartView } from "@/features/public/cart-view";

export const metadata = {
  title: { absolute: "Your Cart | Shivayonic Invites" },
  description: "Review the design and plan you have chosen before checkout.",
  alternates: { canonical: "/cart" },
  // A personal basket has nothing to index.
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
        <SectionHead
          center={false}
          eyebrow="Your cart"
          lede="Everything you have chosen so far. Change anything here before you continue."
          title="Review your commission"
        />
      </Band>
      <section className="section">
        <div className="shell">
          <CartView />
        </div>
      </section>
    </PageFrame>
  );
}
