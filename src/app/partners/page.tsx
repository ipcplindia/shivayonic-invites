import { PageFrame } from "@/features/public/page-frame";
import { Band, CategoryHero, SectionHead } from "@/features/public/sections";
import { SellerForm } from "@/features/public/seller-form";

export const metadata = {
  title: { absolute: "Partners & Dealerships | Shivayonic Invites" },
  description: "Partner with Shivayonic Invites — offer our cinematic invitations, original music and films to your clients as an authorised dealer or distributor.",
  alternates: { canonical: "/partners" },
  robots: { index: true, follow: true },
};

const perks = [
  { title: "A ready-made premium catalogue", body: "Offer your clients cinematic invitations, original music and films they cannot find anywhere else." },
  { title: "We handle the craft", body: "You bring the relationship; our studio delivers the design, music and film behind the scenes, under our shared standard." },
  { title: "Grow with every occasion", body: "Weddings, festivals, corporate events — a reason to reconnect with every client, all year round." },
];

export default function Page() {
  return (
    <PageFrame solidNav>
      <CategoryHero
        eyebrow="Partner With Us"
        title="Become a Shivayonic dealer"
        lede="For studios, planners and companies who want to offer our cinematic invitations, original music and films to their own clients. Share a few details and our team will reach out."
        tone="teal"
        image="/pages/partners.webp"
        primary={{ label: "Apply below", href: "#apply" }}
      />

      <Band label="Why partner with us">
        <SectionHead
          eyebrow="Why Partner"
          title="A premium studio behind your brand"
          lede="You focus on your clients; we make the work unforgettable — as your authorised dealer network."
        />
        <div className="promiseGrid reveal">
          {perks.map((p) => (
            <article key={p.title} className="promiseCard">
              <h3 className="promiseTitle">{p.title}</h3>
              <p className="promiseBody">{p.body}</p>
            </article>
          ))}
        </div>
      </Band>

      <Band variant="cream" label="Partner application">
        <div id="apply">
          <SectionHead
            eyebrow="Apply"
            title="Tell us about your company"
            lede="Fill in your details and we will be in touch to talk about becoming a Shivayonic dealer or distributor."
          />
        </div>
        <SellerForm />
      </Band>
    </PageFrame>
  );
}
