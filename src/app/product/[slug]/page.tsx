import { notFound } from "next/navigation";
import Link from "next/link";

import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CTASection, MiniFaq, ProcessBand, ProductCard, SectionHead } from "@/features/public/sections";
import { PIcon } from "@/features/public/icons";
import { getProduct, listProducts, toneForProduct } from "@/features/public/catalogue-data";
import { featuredBySlug, featuredProducts, whatsappFor } from "@/features/public/data";
import type { PublicProductSummary } from "@/shared/catalogue";
import type { ToneName } from "@/features/public/pages";

/**
 * A single premium product page for both the live catalogue and the featured
 * sample designs. When the catalogue has a record we use it; otherwise we fall
 * back to the four featured designs (real sample artwork), so the homepage
 * cards always open a complete page that shows the same image — never a 404.
 */

type ProductView = {
  name: string;
  categoryName: string;
  styleName: string;
  description: string;
  image?: string;
  tone: ToneName;
  styles: string[];
};

const included = [
  "Personalised names and event details",
  "Your chosen visual style",
  "Digital delivery by email and WhatsApp",
  "A short revision window with our team",
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (product) {
    return {
      title: { absolute: `${product.name} | Shivayonic Invites` },
      description: `${product.name} — ${product.shortDescription}`,
      alternates: { canonical: `/product/${slug}` },
      robots: { index: true, follow: true },
    };
  }
  const featured = featuredBySlug(slug);
  if (featured) {
    return {
      title: { absolute: `${featured.name} | Shivayonic Invites` },
      description: `${featured.name} — ${featured.blurb}`,
      alternates: { canonical: `/product/${slug}` },
      robots: { index: true, follow: true },
    };
  }
  return {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  let view: ProductView;
  let related: PublicProductSummary[] = [];
  let breadcrumbMid: { label: string; href: string };

  if (product) {
    view = {
      name: product.name,
      categoryName: product.category.name,
      styleName: product.styles[0]?.name ?? product.category.name,
      description: product.shortDescription,
      tone: toneForProduct(product) as ToneName,
      styles: product.styles.map((s) => s.name),
    };
    breadcrumbMid = { label: "Catalogue", href: "/catalogue" };
    const { products: relatedAll } = await listProducts({ category: product.category.slug, limit: 5 });
    related = relatedAll.filter((p) => p.slug !== product.slug).slice(0, 4);
  } else {
    const featured = featuredBySlug(slug);
    if (!featured) notFound();
    view = {
      name: featured.name,
      categoryName: featured.occasion,
      styleName: featured.style,
      description: featured.blurb,
      image: featured.img,
      tone: featured.tone as ToneName,
      styles: [featured.style],
    };
    breadcrumbMid = { label: "Featured", href: "/#featured" };
  }

  const otherFeatured = featuredProducts.filter((p) => p.slug !== slug);
  const artStyle = view.image
    ? { backgroundImage: `url(${view.image})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb
          trail={[
            { label: "Home", href: "/" },
            breadcrumbMid,
            { label: view.name },
          ]}
        />
        <div className="productHero">
          <div className="productGallery">
            <span className={`productMain tone-${view.tone}`} style={artStyle} aria-hidden="true" />
            <div className="productThumbs">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`productThumb tone-${view.tone}`} style={artStyle} aria-hidden="true" />
              ))}
            </div>
          </div>
          <div className="productInfo">
            <p className="productLabel">
              {view.categoryName}
              {view.styleName ? ` · ${view.styleName}` : ""}
            </p>
            <h1 className="productTitle">{view.name}</h1>
            <p className="splitBody2" style={{ marginTop: "0.6rem", maxWidth: "44ch" }}>
              {view.description}
            </p>
            <div className="productActions">
              <Link href="/customise/weddings-celebrations" className="btn btnSaffron">
                Customize This Invite
              </Link>
              <a href="/contact" className="btn btnGhost">
                Contact us
              </a>
            </div>
            <p className="productNote">
              Choose this design and our team personalises the names, details and style with you over WhatsApp.
              Full checkout arrives with our commerce launch.
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
            {view.styles.length > 0 ? (
              <>
                <p className="productLabel" style={{ marginTop: "1.4rem" }}>
                  Available visual styles
                </p>
                <div className="styleRow">
                  {view.styles.map((s) => (
                    <span key={s} className="stylePill">
                      {s}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </Band>

      <Band variant="cream" label="Customisation and delivery">
        <div className="deliverCols reveal">
          <div>
            <h3 className="legalHeading">Personalised for your occasion</h3>
            <p className="legalBody">
              After you choose a design, our team connects with you to personalise names, event details,
              photographs, music and creative direction.
            </p>
          </div>
          <div>
            <h3 className="legalHeading">Customisation window</h3>
            <p className="legalBody">
              Your consultation and customisation window can stay open for up to 6 days, giving time to finalise
              the details together.
            </p>
          </div>
          <div>
            <h3 className="legalHeading">Delivery</h3>
            <p className="legalBody">
              Once the final details are confirmed, your invitation is typically delivered within 1–4 days,
              through WhatsApp and email. Bespoke invitation films and original music follow a separate
              timeline we confirm with you.
            </p>
          </div>
        </div>
      </Band>

      {related.length > 0 ? (
        <Band label="Related designs">
          <SectionHead center={false} eyebrow="Related" title="You may also like" />
          <div className="collection reveal" style={{ marginTop: "2rem" }}>
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Band>
      ) : (
        <Band label="More featured designs">
          <SectionHead center={false} eyebrow="More designs" title="You may also like" />
          <div className="productGrid reveal" style={{ marginTop: "2rem" }}>
            {otherFeatured.map((p) => (
              <article key={p.slug} className="product">
                <a
                  href={`/product/${p.slug}`}
                  className={`productArt tone-${p.tone}`}
                  style={p.img ? { backgroundImage: `url(${p.img})`, backgroundSize: "cover", backgroundPosition: "center", display: "block" } : { display: "block" }}
                  aria-label={p.name}
                />
                <div className="productBody">
                  <h3 className="productName">{p.name}</h3>
                  <p className="productMeta">
                    {p.occasion} · {p.style}
                  </p>
                  <div className="productCtas">
                    <a href={`/product/${p.slug}`} className="btn btnGhost">
                      View Details
                    </a>
                    <a href={`/product/${p.slug}`} className="btn btnPrimary">
                      Customize
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Band>
      )}

      <ProcessBand variant="cream" />

      <MiniFaq />

      <CTASection
        title={`Make ${view.name} yours`}
        primary={{ label: "Chat on WhatsApp", href: whatsappFor(view.name), external: true }}
        secondary={{ label: "Browse catalogue", href: "/catalogue" }}
      />
    </PageFrame>
  );
}
