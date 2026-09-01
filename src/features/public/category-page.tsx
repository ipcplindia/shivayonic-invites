import { PageFrame } from "@/features/public/page-frame";
import {
  Band,
  Breadcrumb,
  CategoryHero,
  CollectionGrid,
  CTASection,
  ChipRail,
  EditorialSplit,
  SectionHead,
  StyleCard,
} from "@/features/public/sections";
import { contact } from "@/features/public/data";
import {
  productsFor,
  visualStyleCards,
  type CategoryConfig,
} from "@/features/public/pages";

/**
 * One reusable category-page architecture. Wedding, celebrations, devotional and
 * corporate all render through this with different config — no cloned pages.
 */
export function CategoryPage({
  config,
  breadcrumb,
}: {
  config: CategoryConfig;
  breadcrumb: { label: string; href?: string }[];
}) {
  const products = productsFor(config.productCategory);
  const styles = visualStyleCards.slice(0, 4);

  return (
    <PageFrame>
      <CategoryHero
        eyebrow={config.eyebrow}
        title={config.title}
        lede={config.lede}
        tone={config.tone}
        primary={{ label: "Browse designs", href: "#designs" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
      />

      <Band>
        <Breadcrumb trail={breadcrumb} />
        <EditorialSplit
          eyebrow={config.eyebrow}
          title={config.intro.title}
          body={config.intro.body}
          tone={config.tone}
          action={{ label: "See how it works", href: "/how-it-works" }}
        />
      </Band>

      {config.chips.length > 0 ? (
        <Band variant="cream" label="Occasions">
          <SectionHead eyebrow="Occasions" title="Choose the moment" />
          <ChipRail items={config.chips} />
        </Band>
      ) : null}

      <section className="section" id="designs">
        <div className="shell">
          <SectionHead
            eyebrow="Featured Designs"
            title="Invitations you can make your own"
            lede="Concept designs shown here — each can be personalised in your chosen visual world."
          />
          <CollectionGrid products={products} />
        </div>
      </section>

      <Band variant="cream" label="Visual styles">
        <SectionHead
          eyebrow="Choose Your Visual World"
          title="One occasion, many ways to tell it"
          lede="Pick a direction — the same event can be royal and cinematic, or soft and hand-drawn."
        />
        <div className="styleCards reveal">
          {styles.map((s) => (
            <StyleCard key={s.name} name={s.name} note={s.note} tone={s.tone} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <a href="/styles" className="btn btnGhost">
            Explore all styles
          </a>
        </div>
      </Band>

      <CTASection
        title="Ready to make yours?"
        lede="Choose a design, share your date, and our team takes it from there."
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </PageFrame>
  );
}
