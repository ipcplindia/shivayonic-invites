import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, CTASection, MiniFaq, ProcessBand, SectionHead, StyleCard } from "@/features/public/sections";
import { listStyles } from "@/features/public/catalogue-data";
import { artFor, contact } from "@/features/public/data";
import type { ToneName } from "@/features/public/pages";

export const metadata = {
  title: { absolute: "Visual Styles | Shivayonic Invites" },
  description: "Choose a visual world for your invitation — royal cinematic, watercolour, sketch, minimal and more.",
  alternates: { canonical: "/styles" },
  robots: { index: true, follow: true },
};

const tones: ToneName[] = ["gold", "rose", "saffron", "teal", "sage", "cocoa"];

export default async function Page() {
  const styles = await listStyles();
  return (
    <PageFrame>
      <CategoryHero
        eyebrow="Choose Your Visual World"
        title="One occasion, many ways to tell it"
        lede="Pick a visual direction — the same event can be royal and cinematic, or soft and hand-drawn."
        tone="teal"
        image="/products/mehendi-night.webp"
        primary={{ label: "Browse invitations", href: "/invitations" }}
      />
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Styles" }]} />
        <SectionHead eyebrow="Styles" title="Find your look" lede="These are visual styles, not occasions — any occasion can be told in any of them." />
        {styles.length > 0 ? (
          <div className="styleCards reveal">
            {styles.map((s, i) => (
              <StyleCard key={s.id} name={s.name} note={s.description ?? ""} tone={tones[i % tones.length]} image={artFor(s.name)} />
            ))}
          </div>
        ) : (
          <p className="sectionLede" style={{ textAlign: "center" }}>
            Visual styles are being added. Message us and we will guide the direction for your invitation.
          </p>
        )}
      </Band>
      <ProcessBand variant="cream" />
      <MiniFaq />
      <CTASection
        title="Not sure which style fits?"
        lede="Tell us the occasion and mood; we will suggest a direction."
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </PageFrame>
  );
}
