import { PageFrame } from "@/features/public/page-frame";
import { Band, CategoryHero, CrumbBar, CTASection, EditorialSplit, PlansSection, SectionHead } from "@/features/public/sections";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Plans | Shivayonic Invites" },
  description: "Choose your level of service — Silver, Gold, Platinum or a fully bespoke package. Get in touch to learn what each includes.",
  alternates: { canonical: "/plans" },
  robots: { index: true, follow: true },
};

const promises = [
  { title: "One team, everything covered", body: "Invitation, film and music come from a single studio, so your celebration feels of a piece." },
  { title: "Personalised, not templated", body: "Every design is built around your names, your occasion and your chosen visual world." },
  { title: "Guided from start to shared", body: "We stay with you from the first idea to the final files, delivered ready to share." },
];

export default function Page() {
  return (
    <PageFrame solidNav>
      <CategoryHero
        eyebrow="Plans"
        title="Choose the level that fits your celebration"
        lede="Four simple levels of service. To keep it personal, what each one includes is shared when you get in touch — no fine print, just a conversation."
        tone="gold"
        image="/categories/wedding.webp"
        primary={{ label: "Talk to us", href: "/contact" }}
      />

      <CrumbBar trail={[{ label: "Home", href: "/" }, { label: "Plans" }]} />

      <PlansSection showHead={false} />

      <Band label="Why Shivayonic">
        <SectionHead
          eyebrow="What every level shares"
          title="The Shivayonic promise, at every tier"
          lede="Whichever level you choose, the craft and the care stay the same."
        />
        <div className="promiseGrid reveal">
          {promises.map((p) => (
            <article key={p.title} className="promiseCard">
              <h3 className="promiseTitle">{p.title}</h3>
              <p className="promiseBody">{p.body}</p>
            </article>
          ))}
        </div>
      </Band>

      <Band variant="cream">
        <EditorialSplit
          eyebrow="Not sure yet?"
          title="Tell us about your celebration"
          body="Share the occasion, the dates and the feeling you are after. We will suggest the level that fits and walk you through exactly what it includes — with no obligation."
          tone="rose"
          action={{ label: "See how it works", href: "/how-it-works" }}
        />
      </Band>

      <CTASection
        title="Ready to choose your level?"
        lede="Message us and we will guide you to the right package for your occasion."
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </PageFrame>
  );
}
