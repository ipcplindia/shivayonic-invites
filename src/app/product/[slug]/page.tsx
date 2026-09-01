import { notFound } from "next/navigation";

import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CollectionGrid, CTASection, SectionHead } from "@/features/public/sections";
import { PIcon } from "@/features/public/icons";
import { getProduct, listProducts, priceLabel, toneForProduct } from "@/features/public/catalogue-data";
import { contact } from "@/features/public/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: { absolute: `${product.name} | Shivayonic Invites` },
    description: `${product.name} — ${product.shortDescription}`,
    alternates: { canonical: `/product/${slug}` },
    robots: { index: true, follow: true },
  };
}

const included = [
  "Personalised names and event details",
  "Your chosen visual style",
  "Digital delivery by email and WhatsApp",
  "A short revision window with our team",
];

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const tone = toneForProduct(product);
  const price = priceLabel(product);
  const { products: relatedAll } = await listProducts({ category: product.category.slug, limit: 5 });
  const related = relatedAll.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb
          trail={[
            { label: "Home", href: "/" },
            { label: "Catalogue", href: "/catalogue" },
            { label: product.name },
          ]}
        />
        <div className="productHero">
          <div className="productGallery">
            <span className={`productMain tone-${tone}`} aria-hidden="true" />
            <div className="productThumbs">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`productThumb tone-${tone}`} aria-hidden="true" />
              ))}
            </div>
          </div>
          <div className="productInfo">
            <p className="productLabel">
              {product.category.name}
              {product.styles[0] ? ` · ${product.styles[0].name}` : ""}
            </p>
            <h1 className="productTitle">{product.name}</h1>
            <p className="splitBody2" style={{ marginTop: "0.6rem", maxWidth: "44ch" }}>
              {product.shortDescription}
            </p>
            {price ? (
              <p className="productPriceLg">
                {price} <span>{product.pricingLabel ? product.pricingLabel : "starting"}</span>
              </p>
            ) : null}
            <div className="productActions">
              <a href={contact.whatsappUrl} className="btn btnSaffron" target="_blank" rel="noopener noreferrer">
                Customize Your Invite
              </a>
              <a href="/contact" className="btn btnGhost">
                Contact us
              </a>
            </div>
            <p className="productNote">
              Ordering and checkout open with our commerce launch. For now, start on WhatsApp and our
              team will take it forward.
            </p>
            <div className="included">
              {included.map((it) => (
                <div key={it} className="includedItem">
                  <span className="tick">
                    <PIcon name="play" size={11} />
                  </span>
                  {it}
                </div>
              ))}
            </div>
            {product.styles.length > 0 ? (
              <>
                <p className="productLabel" style={{ marginTop: "1.4rem" }}>
                  Available visual styles
                </p>
                <div className="styleRow">
                  {product.styles.map((s) => (
                    <span key={s.id} className="stylePill">
                      {s.name}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </Band>
      {related.length > 0 ? (
        <Band variant="cream" label="Related designs">
          <SectionHead center={false} eyebrow="Related" title="You may also like" />
          <div style={{ marginTop: "2rem" }}>
            <CollectionGrid products={related} />
          </div>
        </Band>
      ) : null}
      <CTASection
        title={`Make ${product.name} yours`}
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "Back to catalogue", href: "/catalogue" }}
      />
    </PageFrame>
  );
}
