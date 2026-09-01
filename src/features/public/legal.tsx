import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CTASection, SectionHead } from "@/features/public/sections";
import { contact } from "@/features/public/data";

export type LegalDoc = {
  slug: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

/**
 * Plain, honest policy pages. Concise and factual — no invented legal clauses,
 * no promises beyond how Shivayonic actually works today. One renderer, so all
 * four documents share the site's typography and never dead-link the footer.
 */
export const legalDocs: Record<string, LegalDoc> = {
  privacy: {
    slug: "privacy",
    title: "Privacy",
    intro:
      "We keep this simple. We only use the details you share to create and deliver your invitation and to reply to you.",
    sections: [
      { heading: "What we collect", body: "The details you choose to share with us — your name, contact number or email, event details, photographs, and any creative direction — usually over WhatsApp, email, or an enquiry message." },
      { heading: "How we use it", body: "Solely to design, personalise and deliver your invitation, music or film, and to stay in touch about your project. We do not sell your information." },
      { heading: "How long we keep it", body: "For as long as needed to complete and support your project. Ask us any time and we will remove your details from our active records." },
      { heading: "Reach us", body: `For any privacy request, message us on WhatsApp at ${contact.whatsappNumber} and we will help.` },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms",
    intro:
      "These terms describe how our creative service works. By commissioning a design, you agree to them.",
    sections: [
      { heading: "Our service", body: "We create bespoke digital invitations, original music and celebration films. Scope, price and timeline are confirmed with you before work begins." },
      { heading: "Timelines", body: "Delivery estimates are indicative and depend on the occasion, the level of detail, and how quickly the required content and approvals reach us." },
      { heading: "Your content", body: "Please share only names, photographs and material you have the right to use. You remain responsible for the accuracy of the details you provide." },
      { heading: "Use of the final files", body: "Completed invitations are delivered digitally for your own celebration and the use we agree on together." },
    ],
  },
  refund: {
    slug: "refund",
    title: "Refund & Cancellation",
    intro:
      "Every invitation is custom-made, so please read this before you commission.",
    sections: [
      { heading: "Before work begins", body: "If you cancel before we start on your design, you can do so without obligation." },
      { heading: "Once customisation starts", body: "Because the work is bespoke and made specifically for you, it may be non-refundable once creative work is under way. We will always be fair and talk it through." },
      { heading: "If something is wrong", body: "If you are unhappy with a delivery, tell us. Your revision window with our team is there to make it right." },
      { heading: "Talk to us", body: `Questions about an order? Message us on WhatsApp at ${contact.whatsappNumber}.` },
    ],
  },
  "content-ip": {
    slug: "content-ip",
    title: "Content & IP",
    intro:
      "A short note on who owns what.",
    sections: [
      { heading: "Your material", body: "The personal details and photographs you share remain yours." },
      { heading: "Our craft", body: "Our design systems, original music, templates and production methods remain the intellectual property of Shivayonic Invites, Bholenath Productions and Shivayonic Music." },
      { heading: "Showcasing work", body: "We may feature delivered work as samples of our craft. If you would prefer your invitation stay private, just let us know and we will honour it." },
    ],
  },
};

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: doc.title }]} />
        <SectionHead level={1} center={false} eyebrow="Policies" title={doc.title} lede={doc.intro} />
        <div className="legalDoc reveal">
          {doc.sections.map((s) => (
            <section key={s.heading} className="legalSection">
              <h2 className="legalHeading">{s.heading}</h2>
              <p className="legalBody">{s.body}</p>
            </section>
          ))}
        </div>
      </Band>
      <CTASection
        title="Have a question?"
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </PageFrame>
  );
}
