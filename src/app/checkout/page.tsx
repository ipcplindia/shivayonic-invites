import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, SectionHead } from "@/features/public/sections";
import { CheckoutView } from "@/features/public/checkout-view";

export const metadata = {
  title: { absolute: "Checkout | Shivayonic Invites" },
  description: "Share your details so we can confirm your commission.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb
          trail={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
        />
        <SectionHead
          center={false}
          eyebrow="Checkout"
          lede="Tell us where to reach you. We confirm every commission personally before any payment is taken."
          title="Your details"
        />
      </Band>
      <section className="section">
        <div className="shell">
          <CheckoutView />
        </div>
      </section>
    </PageFrame>
  );
}
