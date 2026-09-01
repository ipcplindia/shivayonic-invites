import type { ReactNode } from "react";

import { PIcon } from "@/features/public/icons";
import type { ToneName } from "@/features/public/pages";
import { priceLabel, toneForProduct } from "@/features/public/catalogue-data";
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
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "sectionHead reveal" : "reveal"} style={center ? undefined : { maxWidth: "46ch" }}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="sectionTitle" style={center ? undefined : { textAlign: "left" }}>
        {title}
      </h2>
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
  flip = false,
  action,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  tone: ToneName;
  flip?: boolean;
  action?: { label: string; href: string };
}) {
  return (
    <div className={flip ? "split splitFlip reveal" : "split reveal"}>
      <span className={`splitArt tone-${tone}`} aria-hidden="true" />
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
  const price = priceLabel(product);
  const style = product.styles[0]?.name ?? product.category.name;
  return (
    <article className="pcard">
      <a href={`/product/${product.slug}`} className={`pcardArt tone-${toneForProduct(product)}`} aria-label={product.name}>
        <span className="pcardTag">{product.category.name}</span>
      </a>
      <div className="pcardBody">
        <h3 className="pcardName">{product.name}</h3>
        <p className="pcardMeta">{style}</p>
        {price ? (
          <p className="pcardPrice">
            {price} <span>starting</span>
          </p>
        ) : null}
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

export function StyleCard({ name, note, tone }: { name: string; note: string; tone: ToneName }) {
  return (
    <div className="styleCard">
      <span className={`styleCardArt tone-${tone}`} aria-hidden="true" />
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
