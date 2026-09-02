import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, CTASection, EditorialSplit, MiniFaq, ProcessBand } from "@/features/public/sections";
import { artFor, musicKinds, contact } from "@/features/public/data";
import { PublishedWork } from "@/features/public/published-work";

export const metadata = {
  title: { absolute: "Original Invitation Music | Shivayonic Invites" },
  description: "Original invitation songs, scored voiceovers and theme music written around your occasion.",
  alternates: { canonical: "/music" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame>
      <CategoryHero eyebrow="Original Music" title="Music that makes the invitation yours" lede="An original song, a scored voiceover, a signature motif — written around your names and your date." tone="cocoa" image="/categories/music.webp" primary={{ label: "Talk to us", href: "/contact" }} secondary={{ label: "Watch our films", href: "/films" }} />
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Music" }]} />
        <div style={{ display: "grid", gap: "clamp(3rem,7vw,5rem)" }}>
          {musicKinds.map((m, i) => (
            <EditorialSplit key={m.title} title={m.title} body={m.blurb} tone={(["gold","rose","teal","saffron","sage"] as const)[i % 5]} image={artFor(m.title)} flip={i % 2 === 1} />
          ))}
        </div>
      </Band>
      <PublishedWork placement="MUSIC_SHOWCASE" title="Published music" />
      <ProcessBand variant="cream" />
      <MiniFaq />
      <CTASection title="Let us score your celebration" primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "How it works", href: "/how-it-works" }} />
    </PageFrame>
  );
}
