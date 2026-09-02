import { PageFrame } from "@/features/public/page-frame";
import { CategoryHero, CTASection, SectionHead } from "@/features/public/sections";
import { SocialRibbon } from "@/features/public/marquee";
import { socialWorks, contact } from "@/features/public/data";
import { PublishedWork } from "@/features/public/published-work";

export const metadata = {
  title: { absolute: "Our Work | Shivayonic Invites" },
  description: "Sample invitation films and reels from Shivayonic Invites on YouTube and Instagram.",
  alternates: { canonical: "/our-work" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame>
      <CategoryHero eyebrow="Our Work" title="Sample invitations and films" lede="Featured work from our YouTube channel and Instagram. Thumbnails first — a film opens only when you choose it." tone="gold" image="/products/reception-gala.webp" primary={{ label: "Watch on YouTube", href: contact.youtubeChannelUrl }} secondary={{ label: "Follow on Instagram", href: contact.instagramProfileUrl }} />
      <section className="section">
        <div className="shell"><SectionHead eyebrow="Watch" title="On YouTube" lede={"Featured films from " + contact.youtubeChannel + "."} /></div>
        <SocialRibbon works={socialWorks} platform="youtube" direction="ltr" duration={64} />
      </section>
      <section className="section creamSection">
        <div className="shell"><SectionHead eyebrow="Discover" title="On Instagram" lede={"Follow " + contact.instagramHandle + " for reels and behind-the-scenes."} /></div>
        <SocialRibbon works={socialWorks} platform="instagram" direction="rtl" duration={56} />
      </section>
      <PublishedWork placement="OUR_WORK_GRID" title="Published from the studio" />
      <CTASection title="Like what you see?" primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "Browse invitations", href: "/invitations" }} />
    </PageFrame>
  );
}
