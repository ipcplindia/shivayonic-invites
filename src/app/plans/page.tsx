import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CTASection, PlansSection } from "@/features/public/sections";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Plans | Shivayonic Invites" },
  description: "Choose your level of service — Silver, Gold, Platinum or a fully bespoke package. Get in touch to learn what each includes.",
  alternates: { canonical: "/plans" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Plans" }]} />
      </Band>
      <PlansSection />
      <CTASection
        title="Not sure which level fits?"
        lede="Tell us about your celebration and we will guide you to the right package."
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </PageFrame>
  );
}
