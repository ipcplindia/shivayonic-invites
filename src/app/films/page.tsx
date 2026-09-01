import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, CTASection, SectionHead } from "@/features/public/sections";
import { filmKinds, contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Cinematic Invitation Films | Shivayonic Invites" },
  description: "Cinematic invitation films for weddings, celebrations, devotional occasions and corporate events.",
  alternates: { canonical: "/films" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame>
      <CategoryHero eyebrow="Cinematic Films" title="Stories that move" lede="Invitation films that carry the whole feeling of the day, and make people want to reply." tone="rose" image="/categories/films.webp" primary={{ label: "Talk to us", href: "/contact" }} secondary={{ label: "See our work", href: "/our-work" }} />
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Films" }]} />
        <SectionHead eyebrow="Films" title="What we craft" />
        <div className="styleCards reveal">
          {filmKinds.map((f, i) => (
            <div key={f.title} className="styleCard">
              <span
                className={"styleCardArt tone-" + (["gold","rose","teal","sage"][i % 4])}
                style={{ backgroundImage: `url(${f.img})`, backgroundSize: "cover", backgroundPosition: "center" }}
                aria-hidden="true"
              />
              <div className="styleCardBody">
                <p className="styleCardName">{f.title}</p>
                <p className="styleCardNote">{f.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </Band>
      <CTASection title="Let us film your invitation" tone="cocoa" primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "Explore music", href: "/music" }} />
    </PageFrame>
  );
}
