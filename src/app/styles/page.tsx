import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, CTASection, SectionHead, StyleCard } from "@/features/public/sections";
import { visualStyleCards } from "@/features/public/pages";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Visual Styles | Shivayonic Invites" },
  description: "Choose a visual world for your invitation — royal cinematic, watercolour, sketch, minimal and more.",
  alternates: { canonical: "/styles" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame>
      <CategoryHero eyebrow="Choose Your Visual World" title="One occasion, many ways to tell it" lede="Pick a visual direction — the same event can be royal and cinematic, or soft and hand-drawn." tone="teal" primary={{ label: "Browse invitations", href: "/invitations" }} />
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Styles" }]} />
        <SectionHead eyebrow="Styles" title="Find your look" lede="These are visual styles, not occasions — any occasion can be told in any of them." />
        <div className="styleCards reveal">
          {visualStyleCards.map((s) => (<StyleCard key={s.name} name={s.name} note={s.note} tone={s.tone} />))}
        </div>
      </Band>
      <CTASection title="Not sure which style fits?" lede="Tell us the occasion and mood; we will suggest a direction." primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "Contact us", href: "/contact" }} />
    </PageFrame>
  );
}
