import { notFound } from "next/navigation";

import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CollectionGrid, CTASection, SectionHead } from "@/features/public/sections";
import { PIcon } from "@/features/public/icons";
import { findProduct, products, visualStyleCards } from "@/features/public/pages";
import { contact } from "@/features/public/data";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return {};
  return {
    title: { absolute: product.name + " | Shivayonic Invites" },
    description: product.name + " — a " + product.style + " invitation for " + product.occasion + ", personalised for your event.",
    alternates: { canonical: "/product/" + slug },
    robots: { index: true, follow: true },
  };
}

const included = ["Personalised names and event details", "Your chosen visual style", "Digital delivery by email and WhatsApp", "A short revision window with our team"];
const styleChoices = visualStyleCards.slice(0, 8);

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);
  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Catalogue", href: "/catalogue" }, { label: product.name }]} />
        <div className="productHero">
          <div className="productGallery">
            <span className={"productMain tone-" + product.tone} aria-hidden="true" />
            <div className="productThumbs">
              {[0,1,2,3].map((i) => (<span key={i} className={"productThumb tone-" + product.tone} aria-hidden="true" />))}
            </div>
          </div>
          <div className="productInfo">
            <p className="productLabel">{product.occasion} · {product.style}</p>
            <h1 className="productTitle">{product.name}</h1>
            {product.priceFrom ? (<p className="productPriceLg">{product.priceFrom} <span>starting</span></p>) : null}
            <div className="productActions">
              <a href={contact.whatsappUrl} className="btn btnSaffron" target="_blank" rel="noopener noreferrer">Customize Your Invite</a>
              <a href="/contact" className="btn btnGhost">Contact us</a>
            </div>
            <p className="productNote">Ordering and checkout open with our commerce launch. For now, start on WhatsApp and our team will take it forward.</p>
            <div className="included">
              {included.map((it) => (
                <div key={it} className="includedItem"><span className="tick"><PIcon name="play" size={11} /></span>{it}</div>
              ))}
            </div>
            <p className="productLabel" style={{ marginTop: "1.4rem" }}>Choose a visual world</p>
            <div className="styleRow">
              {styleChoices.map((s) => (<button key={s.name} type="button" className="stylePill">{s.name}</button>))}
            </div>
          </div>
        </div>
      </Band>
      <Band variant="cream" label="Related designs">
        <SectionHead center={false} eyebrow="Related" title="You may also like" />
        <div style={{ marginTop: "2rem" }}><CollectionGrid products={related} /></div>
      </Band>
      <CTASection title={"Make " + product.name + " yours"} primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "Back to catalogue", href: "/catalogue" }} />
    </PageFrame>
  );
}
