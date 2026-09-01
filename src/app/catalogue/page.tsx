import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CategoryHero, ChipRail, CollectionGrid, CTASection, SectionHead } from "@/features/public/sections";
import { products } from "@/features/public/pages";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Catalogue | Shivayonic Invites" },
  description: "Browse the full Shivayonic invitation catalogue across weddings, celebrations, devotional and corporate.",
  alternates: { canonical: "/catalogue" },
  robots: { index: true, follow: true },
};

const groups = [
  { key: "wedding", label: "Wedding" },
  { key: "celebrations", label: "Celebrations" },
  { key: "devotional", label: "Devotional" },
  { key: "corporate", label: "Corporate" },
];
export default function Page() {
  return (
    <PageFrame>
      <CategoryHero eyebrow="Catalogue" title="The full collection" lede="Concept designs across every occasion. Full catalogue browsing and search arrive with the shop." tone="gold" primary={{ label: "Talk to us", href: "/contact" }} />
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Catalogue" }]} />
        <ChipRail items={groups.map((g) => ({ label: g.label, href: "#" + g.key }))} />
      </Band>
      {groups.map((g, i) => (
        <section key={g.key} id={g.key} className={"section " + (i % 2 === 1 ? "creamSection" : "")}>
          <div className="shell">
            <SectionHead center={false} eyebrow={g.label} title={g.label + " invitations"} />
            <div style={{ marginTop: "2rem" }}>
              <CollectionGrid products={products.filter((p) => p.category === g.key)} />
            </div>
          </div>
        </section>
      ))}
      <CTASection title="Ready to make one yours?" primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "Choose a style", href: "/styles" }} />
    </PageFrame>
  );
}
