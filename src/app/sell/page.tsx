import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, SectionHead } from "@/features/public/sections";
import { SellerForm } from "@/features/public/seller-form";

export const metadata = {
  title: { absolute: "Become a Seller | Shivayonic Invites" },
  description: "Partner with Shivayonic Invites — apply to sell our cinematic invitations, music and films.",
  alternates: { canonical: "/sell" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Become a Seller" }]} />
        <SectionHead
          level={1}
          eyebrow="Partner With Us"
          title="Become a Shivayonic seller"
          lede="Represent our cinematic invitations, original music and celebration films. Share a few details and our team will get in touch."
        />
        <SellerForm />
      </Band>
    </PageFrame>
  );
}
