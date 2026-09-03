import { PageFrame } from "@/features/public/page-frame";
import {
  Band,
  Breadcrumb,
  CategoryHero,
  CollectionGrid,
  CTASection,
  ChipRail,
  EditorialSplit,
  MiniFaq,
  ProcessBand,
  PromiseBand,
  SectionHead,
  StyleCard,
} from "@/features/public/sections";
import { contact } from "@/features/public/data";
import { listProducts, listStyles } from "@/features/public/catalogue-data";
import type { CategoryConfig, ToneName } from "@/features/public/pages";

const styleTones: ToneName[] = ["gold", "rose", "teal", "sage"];

/**
 * One reusable category-page architecture, now backed by the real catalogue.
 * Products and styles come from the verified public APIs; the hero copy and
 * accent stay config-driven. No cloned pages, no redesign.
 */
export async function CategoryPage({
  config,
  breadcrumb,
}: {
  config: CategoryConfig;
  breadcrumb: { label: string; href?: string }[];
}) {
  const [{ products }, styles] = await Promise.all([
    listProducts({ category: config.productCategory, limit: 12 }),
    listStyles(),
  ]);
  const styleCards = styles.slice(0, 4);

  return (
    <PageFrame>
      <CategoryHero
        eyebrow={config.eyebrow}
        title={config.title}
        lede={config.lede}
        tone={config.tone}
        image={config.heroImage}
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
          image={config.introImage}
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
            lede="Each design can be personalised in your chosen visual world."
          />
          {products.length > 0 ? (
            <CollectionGrid products={products} />
          ) : (
            <p className="sectionLede" style={{ textAlign: "center" }}>
              New designs for this category are on the way. Message us and we will craft yours.
            </p>
          )}
        </div>
      </section>

      {styleCards.length > 0 ? (
        <Band variant="cream" label="Visual styles">
          <SectionHead
            eyebrow="Choose Your Visual World"
            title="One occasion, many ways to tell it"
            lede="Pick a direction — the same event can be royal and cinematic, or soft and hand-drawn."
          />
          <div className="styleCards reveal">
            {styleCards.map((s, i) => (
              <StyleCard key={s.id} name={s.name} note={s.description ?? ""} tone={styleTones[i % styleTones.length]} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <a href="/styles" className="btn btnGhost">
              Explore all styles
            </a>
          </div>
        </Band>
      ) : null}

      <PromiseBand />

      <ProcessBand variant="cream" />

      <MiniFaq />

      <CTASection
        title="Ready to make yours?"
        lede="Choose a design, share your date, and our team takes it from there."
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </PageFrame>
  );
}
