import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, CTASection, SectionHead } from "@/features/public/sections";
import { PIcon } from "@/features/public/icons";
import { categoryConfigs } from "@/features/public/pages";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Invitations | Shivayonic Invites" },
  description: "Explore cinematic invitations for weddings, celebrations, devotional occasions and corporate events.",
  alternates: { canonical: "/invitations" },
  robots: { index: true, follow: true },
};

const cards = [categoryConfigs.wedding, categoryConfigs.celebrations, categoryConfigs.devotional, categoryConfigs.corporate];

export default function Page() {
  return (
    <PageFrame>
      <CategoryHero
        eyebrow="Invitations"
        title="Cinematic invitations for every occasion"
        lede="One studio for the whole celebration — the invitation, the film, and the music that ties it together."
        tone="gold"
        image="/hero/hero-desktop.webp"
        primary={{ label: "Browse the catalogue", href: "/catalogue" }}
        secondary={{ label: "Choose a style", href: "/styles" }}
      />
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Invitations" }]} />
        <SectionHead eyebrow="Explore" title="Where would you like to begin?" />
        <div className="bento reveal">
          {cards.map((c, i) => (
            <a key={c.key} href={c.path} className={"tile " + (i === 0 ? "tileWide " : "") + (c.tone === "cocoa" ? "tileCocoa" : "")}>
              <span
                className={"tileArt tone-" + c.tone}
                style={{ backgroundImage: `url(${c.heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
                aria-hidden="true"
              />
              <div className="tileBody">
                <h3 className="tileTitle">{c.eyebrow}</h3>
                <p className="tileBlurb">{c.lede}</p>
                <span className="tileArrow">Explore <PIcon name="arrow" size={15} /></span>
              </div>
            </a>
          ))}
        </div>
      </Band>
      <CTASection
        title="Not sure where to start?"
        lede="Tell us the occasion and we will point you to the right place."
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "How it works", href: "/how-it-works" }}
      />
    </PageFrame>
  );
}
