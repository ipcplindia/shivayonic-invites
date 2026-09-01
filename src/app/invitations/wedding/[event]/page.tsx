import { notFound } from "next/navigation";

import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, CollectionGrid, CTASection, SectionHead } from "@/features/public/sections";
import { contact } from "@/features/public/data";
import { productsFor, weddingEvents, weddingEventSlugs } from "@/features/public/pages";

export function generateStaticParams() {
  return weddingEventSlugs.map((event) => ({ event }));
}

export async function generateMetadata({ params }: { params: Promise<{ event: string }> }) {
  const { event: slug } = await params;
  const event = weddingEvents[slug];
  if (!event) return {};
  return {
    title: { absolute: event.title + " Invitations | Shivayonic Invites" },
    description: event.title + " invitations, films and music, crafted for your wedding.",
    alternates: { canonical: "/invitations/wedding/" + slug },
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ event: string }> }) {
  const { event: slug } = await params;
  const event = weddingEvents[slug];
  if (!event) notFound();
  const products = productsFor("wedding").filter((p) => p.occasion === event.occasion);
  const shown = products.length > 0 ? products : productsFor("wedding").slice(0, 4);
  return (
    <PageFrame>
      <CategoryHero
        eyebrow={"Wedding · " + event.title}
        title={event.title + " invitations"}
        lede={event.note + " A coordinated invitation, film and score for this function."}
        tone="rose"
        primary={{ label: "Browse designs", href: "#designs" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
      />
      <Band>
        <Breadcrumb
          trail={[
            { label: "Home", href: "/" },
            { label: "Invitations", href: "/invitations" },
            { label: "Wedding", href: "/invitations/wedding" },
            { label: event.title },
          ]}
        />
        <SectionHead center={false} eyebrow={event.title} title={"Designed for the " + event.title.toLowerCase()} lede="Concept designs shown here, each personalised in your chosen visual world." />
      </Band>
      <section className="section" id="designs">
        <div className="shell">
          <CollectionGrid products={shown} />
        </div>
      </section>
      <CTASection
        title={"Make your " + event.title + " invitation"}
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "See all wedding functions", href: "/invitations/wedding" }}
      />
    </PageFrame>
  );
}
