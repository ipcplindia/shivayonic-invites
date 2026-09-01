import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, CTASection, EditorialSplit } from "@/features/public/sections";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "About | Shivayonic Invites" },
  description: "Shivayonic Invites crafts cinematic invitations, original music and celebration films, presented by Bholenath Productions and Shivayonic Music.",
  alternates: { canonical: "/about" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame>
      <CategoryHero eyebrow="About" title="Cinema, music and invitation craft" lede="Shivayonic Invites is presented by Bholenath Productions and Shivayonic Music — a studio for celebrations told beautifully." tone="cocoa" primary={{ label: "Talk to us", href: "/contact" }} />
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "About" }]} />
        <EditorialSplit eyebrow="Our craft" title="One studio for the whole celebration" body="We bring together cinematic invitations, original music and celebration films, so the invitation, the score and the film all feel of a piece — designed around your occasion and your visual world." tone="gold" action={{ label: "See how it works", href: "/how-it-works" }} />
      </Band>
      <Band variant="cream">
        <EditorialSplit eyebrow="What we value" title="Bespoke direction, personal delivery" body="Every celebration is different. We craft each invitation with care, work closely with you on the details, and deliver the final experience digitally, ready to share." tone="rose" flip />
      </Band>
      <CTASection title="Let us craft yours" primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "Browse invitations", href: "/invitations" }} />
    </PageFrame>
  );
}
