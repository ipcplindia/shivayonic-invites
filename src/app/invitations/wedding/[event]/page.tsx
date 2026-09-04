import { notFound } from "next/navigation";

import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, CollectionGrid, CTASection, MakeItYours, SectionHead } from "@/features/public/sections";
import { contact } from "@/features/public/data";
import { listProductsForDisplay } from "@/features/public/catalogue-data";
import { weddingEvents } from "@/features/public/pages";

export async function generateMetadata({ params }: { params: Promise<{ event: string }> }) {
  const { event: slug } = await params;
  const event = weddingEvents[slug];
  if (!event) return {};
  return {
    title: { absolute: `${event.title} Invitations | Shivayonic Invites` },
    description: `${event.title} invitations, films and music, crafted for your wedding.`,
    alternates: { canonical: `/invitations/wedding/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ event: string }> }) {
  const { event: slug } = await params;
  const event = weddingEvents[slug];
  if (!event) notFound();

  /*
   * Designs for this specific function first — a haldi page should lead with
   * haldi designs. When none carry that occasion, the page falls back to the
   * wider published collection rather than to an empty column, which is what
   * every one of these pages rendered before.
   */
  const occasionSlug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { products: all } = await listProductsForDisplay({ limit: 24 });
  // One read, partitioned here. Asking the catalogue twice — once filtered by
  // occasion, once unfiltered — doubled the wait for no extra designs.
  const forOccasion = all.filter((p) => p.category.slug === occasionSlug);
  const products = [...forOccasion, ...all.filter((p) => p.category.slug !== occasionSlug)];
  const showingThisOccasion = forOccasion.length > 0;

  return (
    <PageFrame>
      <CategoryHero
        eyebrow={`Wedding · ${event.title}`}
        title={`${event.title} invitations`}
        lede={`${event.note} A coordinated invitation, film and score for this function.`}
        tone="rose"
        image={event.image}
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
        <SectionHead
          center={false}
          eyebrow={event.title}
          title={`Designed for the ${event.title.toLowerCase()}`}
          lede="Wedding designs you can personalise in your chosen visual world."
        />
      </Band>
      <section className="section" id="designs">
        <div className="shell">
          <SectionHead
            center
            eyebrow={showingThisOccasion ? `${event.title} designs` : "From the collection"}
            lede={
              showingThisOccasion
                ? `Designs made for the ${event.title.toLowerCase()}, followed by the rest of the collection.`
                : `Designs from across the collection, each one personalised for your ${event.title.toLowerCase()}.`
            }
            title="Start from any of these"
          />
          <div style={{ marginTop: "2rem" }}>
            <CollectionGrid products={products} />
          </div>
        </div>
      </section>

      <MakeItYours
        lede={`Tell us the names, the date and the visual world you want, and we will craft the ${event.title.toLowerCase()} invitation around it — with a matching film and score if you want them.`}
        title={`Your ${event.title.toLowerCase()}, your way`}
      />

      <CTASection
        title={`Make your ${event.title} invitation`}
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "See all wedding functions", href: "/invitations/wedding" }}
      />
    </PageFrame>
  );
}
