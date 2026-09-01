import { PageFrame } from "@/features/public/page-frame";
import { Band, CategoryHero, CTASection, SectionHead } from "@/features/public/sections";
import { SocialRibbon } from "@/features/public/marquee";
import { youtubeItems, instagramItems, contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Our Work | Shivayonic Invites" },
  description: "Sample invitation films and reels from Shivayonic Invites on YouTube and Instagram.",
  alternates: { canonical: "/our-work" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame>
      <CategoryHero eyebrow="Our Work" title="Sample invitations and films" lede="Featured work from our YouTube channel and Instagram. Thumbnails first — a film opens only when you choose it." tone="gold" primary={{ label: "Watch on YouTube", href: contact.youtubeChannelUrl }} secondary={{ label: "Follow on Instagram", href: contact.instagramProfileUrl }} />
      <section className="section">
        <div className="shell"><SectionHead eyebrow="Watch" title="On YouTube" lede={"Featured films from " + contact.youtubeChannel + "."} /></div>
        <SocialRibbon items={youtubeItems} platform="youtube" direction="ltr" duration={52} />
      </section>
      <section className="section creamSection">
        <div className="shell"><SectionHead eyebrow="Discover" title="On Instagram" lede={"Follow " + contact.instagramHandle + " for reels and behind-the-scenes."} /></div>
        <SocialRibbon items={instagramItems} platform="instagram" direction="rtl" duration={44} />
      </section>
      <Band variant="cocoa" label="Delivered work">
        <SectionHead eyebrow="Crafted for Real Celebrations" title="Delivered work, coming soon" lede="A gallery of real Shivayonic invitations will live here as approved work is added." />
        <div className="deliveredSlot reveal">
          {[0,1,2,3].map((i) => (<div key={i} className="deliveredEmpty">Approved delivered work will appear here.</div>))}
        </div>
      </Band>
      <CTASection title="Like what you see?" primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "Browse invitations", href: "/invitations" }} />
    </PageFrame>
  );
}
