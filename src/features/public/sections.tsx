import type { ReactNode } from "react";

import { PIcon } from "@/features/public/icons";
import type { ToneName } from "@/features/public/pages";
import { faqs } from "@/features/public/pages";
import { toneForProduct } from "@/features/public/catalogue-data";
import { artFor, contact, featuredBySlug, plans, steps } from "@/features/public/data";
import type { PublicProductSummary } from "@/shared/catalogue";

/** Small shared bits reused across the public pages. */

export function Ornament() {
  return (
    <span className="ornament" aria-hidden="true">
      <span className="diamond" />
    </span>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  center = true,
  level = 2,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  center?: boolean;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className={center ? "sectionHead reveal" : "reveal"} style={center ? undefined : { maxWidth: "46ch" }}>
      <span className="eyebrow">{eyebrow}</span>
      <Heading className="sectionTitle" style={center ? undefined : { textAlign: "left" }}>
        {title}
      </Heading>
      {lede ? (
        <p className="sectionLede" style={center ? undefined : { margin: "1rem 0 0", textAlign: "left" }}>
          {lede}
        </p>
      ) : null}
      {center ? <Ornament /> : null}
    </div>
  );
}

/* ---------------------------------------------------------- Breadcrumb */

export function Breadcrumb({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={c.label} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            {c.href && !last ? <a href={c.href}>{c.label}</a> : <span className={last ? "crumbCurrent" : undefined}>{c.label}</span>}
            {!last ? <span className="crumbSep" aria-hidden="true">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}

/* ---------------------------------------------------------- Category hero */

export function CategoryHero({
  eyebrow,
  title,
  lede,
  tone,
  image,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  tone: ToneName;
  /** Optional lead photo — reuses the same approved artwork as the homepage card. */
  image?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="catHero">
      <span className={`catHeroArt tone-${tone}`} aria-hidden="true">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="catHeroPhoto" src={image} alt="" aria-hidden="true" decoding="async" />
        ) : null}
      </span>
      <div className="catHeroInner">
        <p className="catHeroEyebrow">{eyebrow}</p>
        <h1 className="catHeroTitle">{title}</h1>
        <p className="catHeroLede">{lede}</p>
        {primary || secondary ? (
          <div className="catHeroCtas">
            {primary ? (
              <a href={primary.href} className="btn btnSaffron">
                {primary.label}
              </a>
            ) : null}
            {secondary ? (
              <a href={secondary.href} className="btn btnOnDark">
                {secondary.label}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Editorial split */

export function EditorialSplit({
  eyebrow,
  title,
  body,
  tone,
  image,
  flip = false,
  action,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  tone: ToneName;
  image?: string;
  flip?: boolean;
  action?: { label: string; href: string };
}) {
  return (
    <div className={flip ? "split splitFlip reveal" : "split reveal"}>
      <span
        className={`splitArt tone-${tone}${image ? " hasPhoto" : ""}`}
        style={image ? { backgroundImage: `url(${image})` } : undefined}
        aria-hidden="true"
      />
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="splitTitle2">{title}</h2>
        <p className="splitBody2">{body}</p>
        {action ? (
          <div className="splitActions">
            <a href={action.href} className="btn btnPrimary">
              {action.label} <PIcon name="arrow" size={15} />
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Chip rail */

export function ChipRail({ items }: { items: { label: string; href: string }[] }) {
  return (
    <div className="chipRail reveal">
      {items.map((item) => (
        <a key={item.href + item.label} href={item.href} className="chipLink">
          {item.label}
        </a>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- Product card */

export function ProductCard({ product }: { product: PublicProductSummary }) {
  const style = product.styles[0]?.name ?? product.category.name;
  return (
    <article className="pcard">
      <a
        href={`/product/${product.slug}`}
        className={`pcardArt tone-${toneForProduct(product)} hasPhoto`}
        style={{ backgroundImage: `url(${featuredBySlug(product.slug)?.img ?? artFor(product.slug)})` }}
        aria-label={product.name}
      >
        <span className="pcardTag">{product.category.name}</span>
      </a>
      <div className="pcardBody">
        <h3 className="pcardName">{product.name}</h3>
        <p className="pcardMeta">{style}</p>
        <div className="pcardCtas">
          <a href={`/product/${product.slug}`} className="btn btnGhost">
            View
          </a>
          <a href={`/product/${product.slug}`} className="btn btnPrimary">
            Customize
          </a>
        </div>
      </div>
    </article>
  );
}

export function CollectionGrid({ products }: { products: PublicProductSummary[] }) {
  return (
    <div className="collection reveal">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- Style card */

export function StyleCard({
  name,
  note,
  tone,
  image,
}: {
  name: string;
  note: string;
  tone: ToneName;
  image?: string;
}) {
  return (
    <div className="styleCard">
      <span
        className={`styleCardArt tone-${tone}${image ? " hasPhoto" : ""}`}
        style={image ? { backgroundImage: `url(${image})` } : undefined}
        aria-hidden="true"
      />
      <div className="styleCardBody">
        <p className="styleCardName">{name}</p>
        <p className="styleCardNote">{note}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- CTA band */

export function CTASection({
  title,
  lede,
  primary,
  secondary,
  tone = "cocoa",
}: {
  title: string;
  lede?: string;
  primary: { label: string; href: string; external?: boolean };
  secondary?: { label: string; href: string; external?: boolean };
  tone?: "cocoa" | "teal";
}) {
  const ext = (e?: boolean) => (e ? { target: "_blank", rel: "noopener noreferrer" } : {});
  return (
    <section className={`ctaBand ${tone === "teal" ? "ctaTeal" : "ctaCocoa"}`}>
      <div className="shell reveal">
        <h2 className="ctaTitle">{title}</h2>
        {lede ? <p className="ctaLede">{lede}</p> : null}
        <div className="ctaActions">
          <a href={primary.href} className="btn btnSaffron" {...ext(primary.external)}>
            {primary.label}
          </a>
          {secondary ? (
            <a href={secondary.href} className="btn btnOnDark" {...ext(secondary.external)}>
              {secondary.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Plans */

/** Shared across every level, so the cards can stay quiet about specifics. */
const planIncludes = [
  "A personal creative consultation",
  "Your chosen visual style",
  "Delivery by WhatsApp and email",
];

export function PlansSection({ id, showHead = true }: { id?: string; showHead?: boolean }) {
  return (
    <section className="section plansBand" id={id}>
      <div className="shell">
        {showHead ? (
          <SectionHead
            eyebrow="Choose Your Level"
            title="One package for the whole celebration"
            lede="Pick the level of service that fits your occasion. To learn exactly what each includes, just get in touch — we will walk you through it."
          />
        ) : null}

        <div className="plans reveal">
          {plans.map((plan, i) => (
            <article key={plan.key} className={`planCard${plan.featured ? " planFeatured" : ""}`}>
              <span className={`planRail tone-${plan.tone}`} aria-hidden="true" />

              <header className="planHead">
                <h3 className="planName">{plan.name}</h3>
                {plan.featured ? <span className="planBadge">Most chosen</span> : null}
              </header>

              {/*
                The tiers cannot list their contents, so the ladder carries the
                sense of scale instead — four rungs, filled to this tier's rank.
                Decorative only; the name and price do the real telling.
              */}
              <span className="planLadder" aria-hidden="true">
                {plans.map((_, rung) => (
                  <span key={rung} className={rung <= i ? "rung rungOn" : "rung"} />
                ))}
              </span>

              <div className="planPriceBlock">
                {plan.price ? (
                  <>
                    <p className="planPrice">{plan.price}</p>
                    <span className="planGst">{plan.priceNote}</span>
                  </>
                ) : (
                  <p className="planPriceAsk">{plan.priceNote}</p>
                )}
              </div>

              <p className="planTagline">{plan.tagline}</p>

              <a
                href={contact.whatsappUrl}
                className={`btn ${plan.featured ? "btnSaffron" : "btnGhost"} planBtn`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get in touch
              </a>
              <span className="planReassure">No advance to talk to us</span>
            </article>
          ))}
        </div>

        <div className="planIncludes reveal">
          <span className="planIncludesLabel">Every level includes</span>
          <ul className="planIncludesList">
            {planIncludes.map((item) => (
              <li key={item}>
                <span className="planTick" aria-hidden="true">
                  <PIcon name="check" size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="plansFoot">All prices are inclusive of GST.</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Slim breadcrumb bar */

/** Breadcrumb without a full section's padding — avoids tall empty strips. */
export function CrumbBar({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <div className="crumbBar">
      <Breadcrumb trail={trail} />
    </div>
  );
}

/* ---------------------------------------------------------- Process band */

const processStepBlurbs = [
  "Pick a design, an occasion or a creative direction — or just tell us your idea.",
  "Send your names, dates, photographs and any references over WhatsApp or email.",
  "Our team personalises the invitation, music and film around your celebration.",
  "Approve the final direction, then receive your invitation, ready to share.",
];

export function ProcessBand({ variant = "cream" }: { variant?: "cream" | "cocoa" }) {
  return (
    <Band variant={variant} label="How it works">
      <SectionHead
        eyebrow="How It Works"
        title="From first idea to shared invitation"
        lede="A simple, guided process — personal at every step, and quicker than you would expect."
      />
      <div className="processGrid reveal">
        {steps.map((s, i) => (
          <article key={s.title} className="processStep">
            <span className="processNum" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="processTitle">{s.title}</h3>
            <p className="processBody">{processStepBlurbs[i] ?? s.body}</p>
          </article>
        ))}
      </div>
    </Band>
  );
}

/* ---------------------------------------------------------- Promise band */

const brandPromises = [
  { title: "One studio, everything covered", body: "Invitation, film and original music come from a single team, so the whole celebration feels of a piece." },
  { title: "Personalised, never templated", body: "Every design is built around your names, your occasion and the visual world you choose." },
  { title: "Delivered ready to share", body: "Final files arrive digitally by WhatsApp and email, sized and ready for your guests." },
];

export function PromiseBand({ variant }: { variant?: "cream" | "cocoa" }) {
  return (
    <Band variant={variant} label="Why Shivayonic">
      <SectionHead
        eyebrow="Why Shivayonic"
        title="Craft you can feel in every detail"
        lede="What stays the same, whatever you choose."
      />
      <div className="promiseGrid reveal">
        {brandPromises.map((p) => (
          <article key={p.title} className="promiseCard">
            <h3 className="promiseTitle">{p.title}</h3>
            <p className="promiseBody">{p.body}</p>
          </article>
        ))}
      </div>
    </Band>
  );
}

/* ---------------------------------------------------------- Mini FAQ */

export function MiniFaq({ count = 4, variant }: { count?: number; variant?: "cream" | "cocoa" }) {
  return (
    <Band variant={variant} label="Common questions">
      <SectionHead eyebrow="Good to Know" title="Common questions" />
      <div className="faqList reveal" style={{ marginTop: "2rem" }}>
        {faqs.slice(0, count).map((f) => (
          <details key={f.q} className="faqItem">
            <summary>{f.q}</summary>
            <p className="faqAnswer">{f.a}</p>
          </details>
        ))}
      </div>
    </Band>
  );
}

/* ---------------------------------------------------------- Section shell */

export function Band({
  children,
  variant,
  label,
}: {
  children: ReactNode;
  variant?: "cream" | "cocoa";
  label?: string;
}) {
  const cls = ["section", variant === "cream" ? "creamSection" : "", variant === "cocoa" ? "cocoaSection" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={cls} aria-label={label}>
      <div className="shell">{children}</div>
    </section>
  );
}

/* ------------------------------------------------- Make-it-yours panel */

/**
 * The two things a visitor can actually do on any occasion or catalogue page:
 * talk to the studio, or fill the client form for their own invitation.
 *
 * It is one component so every occasion page carries the same pair of actions
 * in the same place. Previously these pages ended in a single line of prose
 * with nothing to click.
 */
export function MakeItYours({
  title,
  lede,
  formHref = "/customise/weddings-celebrations",
  formLabel = "Customise your invite",
}: {
  title: string;
  lede: string;
  formHref?: string;
  formLabel?: string;
}) {
  return (
    <section className="section creamSection">
      <div className="shell">
        <div className="makeYours">
          <div className="makeYoursText">
            <p className="sectionEyebrow">Make it yours</p>
            <h2 className="sectionTitle">{title}</h2>
            <p className="sectionLede">{lede}</p>
            <div className="makeYoursCtas">
              <a className="btn btnPrimary" href={formHref}>
                {formLabel}
              </a>
              <a className="btn btnGhost" href="/contact">
                Talk to us
              </a>
            </div>
          </div>
          <ul className="makeYoursSteps">
            {[
              { n: "01", t: "Choose a design", b: "Pick any design, or describe the one you have in mind." },
              { n: "02", t: "Tell us the details", b: "Names, dates, venues and the visual world you want." },
              { n: "03", t: "We craft it", b: "Your invitation, film and score, made for your celebration." },
            ].map((step) => (
              <li className="makeYoursStep" key={step.n}>
                <span className="makeYoursNum">{step.n}</span>
                <span className="makeYoursStepText">
                  <strong>{step.t}</strong>
                  <span>{step.b}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
