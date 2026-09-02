import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, ChipRail, CollectionGrid, CTASection, SectionHead } from "@/features/public/sections";
import { listCategories, listProducts, listStyles } from "@/features/public/catalogue-data";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Catalogue | Shivayonic Invites" },
  description: "Browse the Shivayonic invitation catalogue across weddings, celebrations, devotional and corporate.",
  alternates: { canonical: "/catalogue" },
  robots: { index: true, follow: true },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; style?: string }>;
}) {
  const filters = await searchParams;
  // One request for the newest published designs; grouped by their category.
  const [{ products, pageInfo }, categories, styles] = await Promise.all([
    listProducts({ q: filters.q, category: filters.category, style: filters.style, limit: 48 }),
    listCategories(),
    listStyles(),
  ]);
  const groups = new Map<string, { name: string; slug: string; items: typeof products }>();
  for (const p of products) {
    const g = groups.get(p.category.slug) ?? { name: p.category.name, slug: p.category.slug, items: [] };
    g.items.push(p);
    groups.set(p.category.slug, g);
  }
  const groupList = [...groups.values()];

  return (
    <PageFrame>
      <CategoryHero
        eyebrow="Catalogue"
        title="The full collection"
        lede="Published invitation designs across every occasion. Message us to personalise any of them."
        tone="gold"
        image="/products/diwali-nights.webp"
        primary={{ label: "Talk to us", href: "/contact" }}
      />
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Catalogue" }]} />
        <form className="catalogueFilters" method="get" action="/catalogue" aria-label="Filter catalogue">
          <label className="filterField">
            <span>Search</span>
            <input name="q" type="search" defaultValue={filters.q} placeholder="Invitation name or occasion" />
          </label>
          <label className="filterField">
            <span>Category</span>
            <select name="category" defaultValue={filters.category ?? ""}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
            </select>
          </label>
          <label className="filterField">
            <span>Style</span>
            <select name="style" defaultValue={filters.style ?? ""}>
              <option value="">All styles</option>
              {styles.map((style) => <option key={style.slug} value={style.slug}>{style.name}</option>)}
            </select>
          </label>
          <button className="btn btnPrimary" type="submit">Apply filters</button>
          {filters.q || filters.category || filters.style ? <a className="btn btnGhost" href="/catalogue">Clear filters</a> : null}
        </form>
        {groupList.length > 0 ? (
          <ChipRail items={groupList.map((g) => ({ label: g.name, href: `#${g.slug}` }))} />
        ) : null}
      </Band>

      {groupList.length === 0 ? (
        <Band>
          <p className="sectionLede" style={{ textAlign: "center" }}>
            {filters.q || filters.category || filters.style
              ? "No invitations match those filters. Clear them or message us for a custom direction."
              : "The catalogue is being prepared. Message us and we will craft your invitation directly."}
          </p>
        </Band>
      ) : (
        groupList.map((g, i) => (
          <section key={g.slug} id={g.slug} className={"section " + (i % 2 === 1 ? "creamSection" : "")}>
            <div className="shell">
              <SectionHead center={false} eyebrow={g.name} title={`${g.name} invitations`} />
              <div style={{ marginTop: "2rem" }}>
                <CollectionGrid products={g.items} />
              </div>
            </div>
          </section>
        ))
      )}

      {pageInfo.hasMore ? (
        <Band>
          <p className="sectionLede" style={{ textAlign: "center" }}>
            More designs are available — full browsing and search arrive with the shop.
          </p>
        </Band>
      ) : null}

      <CTASection
        title="Ready to make one yours?"
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "Choose a style", href: "/styles" }}
      />
    </PageFrame>
  );
}
