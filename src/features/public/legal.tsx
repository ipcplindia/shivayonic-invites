import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CTASection, SectionHead } from "@/features/public/sections";
import { contact, legalEntity } from "@/features/public/data";

export type LegalDoc = {
  slug: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

/**
 * The site's policy pages, written to the Indian law that actually applies to
 * a business selling a service to consumers online:
 *
 *  - Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025 —
 *    notice, consent, the rights of a Data Principal, and a named contact for
 *    grievances.
 *  - Information Technology Act, 2000 with the Reasonable Security Practices
 *    and Sensitive Personal Data or Information Rules, 2011 — a published
 *    privacy policy, reasonable security practices, and a grievance officer
 *    whose details appear on the website and who answers within a month.
 *  - Consumer Protection Act, 2019 with the Consumer Protection (E-Commerce)
 *    Rules, 2020 — the entity's legal name, address and customer care details,
 *    a published cancellation and refund policy, and a grievance officer who
 *    acknowledges a complaint within 48 hours and redresses it within a month.
 *  - Copyright Act, 1957 for the ownership terms.
 *
 * The rule kept throughout: state only what is true of how Shivayonic actually
 * works. Nothing is claimed that the studio does not do, and no term is invented
 * to look thorough. Business identity that has not been supplied is omitted
 * rather than filled with a placeholder — see `legalEntity` in data.ts.
 */

/** Renders a labelled line only when the underlying fact has been supplied. */
function line(label: string, value: string): string | null {
  return value.trim() ? `${label}: ${value.trim()}` : null;
}

/** The identity block the E-Commerce Rules require to be displayed. */
function entityDetails(): string {
  const name = legalEntity.registeredName || `${legalEntity.tradingName}, a unit of ${legalEntity.parent}`;
  return [
    line("Business", name),
    line("Website", legalEntity.website),
    line("Registered address", legalEntity.address),
    line("GSTIN", legalEntity.gstin),
    line("CIN", legalEntity.cin),
    line("Customer care email", legalEntity.email),
    line("Customer care phone / WhatsApp", legalEntity.phone),
  ]
    .filter((entry) => entry !== null)
    .join(". ")
    .concat(".");
}

/** The grievance officer block, required by both the IT Rules and the E-Commerce Rules. */
function grievanceDetails(): string {
  const officer = legalEntity.grievanceOfficer;
  return [
    line("Grievance Officer", officer.name),
    line("Designation", officer.designation),
    line("Email", officer.email),
    line("Phone / WhatsApp", officer.phone),
    line("Address", legalEntity.address),
  ]
    .filter((entry) => entry !== null)
    .join(". ")
    .concat(".");
}

const GRIEVANCE_PROCESS =
  "Write to us at the address above with your name, contact details, what happened and what you would like done. " +
  "We acknowledge every complaint within 48 hours and work to resolve it within one month of receiving it, as required " +
  "by the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology (Reasonable Security Practices " +
  "and Procedures and Sensitive Personal Data or Information) Rules, 2011. Data protection grievances under the Digital " +
  "Personal Data Protection Act, 2023 are answered within 90 days, and usually far sooner.";

export const legalDocs: Record<string, LegalDoc> = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    intro:
      "How Shivayonic Invites collects, uses and protects your personal data, published under the Digital Personal Data Protection Act, 2023 and Rule 4 of the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.",
    sections: [
      {
        heading: "Who we are",
        body: `${entityDetails()} We are the Data Fiduciary for the personal data described below — we decide why and how it is processed.`,
      },
      {
        heading: "What we collect",
        body:
          "Only what you give us. From an enquiry or a client brief: your name, mobile number, email address, city, and the details of your event — dates, venue, the names to appear on the invitation, family details you choose to include, your creative preferences, and any photographs, music or reference material you send. At checkout: your delivery and billing address, PIN code, and whether you want updates by email or text. From your visit to the site: standard technical data such as your IP address, browser and the pages you opened, through the analytics described below. We do not ask for and do not want your financial account numbers, card details, passwords, biometrics or health information.",
      },
      {
        heading: "Why we use it",
        body:
          "To design, personalise, produce and deliver the invitation, film or music you commission; to reply to your enquiry and stay in touch about your project; to raise a quotation and, where applicable, an invoice; to keep records the law requires us to keep; and to improve the site. That is the whole list. We do not sell your personal data, we do not rent it, and we do not use it to build advertising profiles about you.",
      },
      {
        heading: "Your consent, and taking it back",
        body:
          "We process your data on the consent you give when you send an enquiry, submit a brief or place an order, and for the specific purposes set out above. You can withdraw that consent at any time by writing to us — it is as easy to withdraw as it was to give. Withdrawing consent does not undo processing already carried out lawfully, and if you withdraw while a commission is in progress we may be unable to continue the work.",
      },
      {
        heading: "Who else sees it",
        body:
          "A small number of service providers who process data on our instructions and are not permitted to use it for their own purposes: our website host and our email delivery provider, who carry the submitted form to our inbox; WhatsApp, when you choose to message us there; and our analytics and measurement tools, described below. We share personal data with no one else, except where we are legally obliged to disclose it to a court or a lawful authority. Some of these providers operate servers outside India; where that happens, the transfer is limited to what the service needs to function and is subject to any restrictions the Central Government notifies under the Digital Personal Data Protection Act, 2023.",
      },
      {
        heading: "Cookies and analytics",
        body:
          "The site uses cookies and similar technology that are necessary for it to work — for example, remembering the design and plan in your basket, which is stored in your own browser and never sent to us until you submit an order. We also use Google Analytics and the Meta pixel to understand, in aggregate, how the site is used. You can block or delete cookies in your browser settings; the site will still work, though your basket will not be remembered.",
      },
      {
        heading: "How long we keep it",
        body:
          "Enquiry and brief data is kept while your project is live and for as long as we may reasonably need it to support what we delivered. Records we are required to retain — invoices and tax records in particular — are kept for the period the law prescribes. After that it is erased. You can ask us to erase your data sooner and we will, unless we are required to keep it.",
      },
      {
        heading: "How we protect it",
        body:
          "The site is served only over HTTPS. Access to submissions is limited to the people in the studio who need it. Our administrative systems require an account, and sessions and login attempts are rate limited. Credentials and access tokens are stored encrypted. These are the reasonable security practices required by Rule 8 of the IT Rules, 2011; no system is perfect, and if a personal data breach occurs we will notify you and the Data Protection Board as the Digital Personal Data Protection Act, 2023 requires.",
      },
      {
        heading: "Your rights",
        body:
          "Under the Digital Personal Data Protection Act, 2023 you may ask us for a summary of the personal data we hold about you and how we are processing it; ask us to correct anything inaccurate, incomplete or out of date; ask us to erase data we no longer need; nominate someone to exercise these rights on your behalf if you die or become incapacitated; and raise a grievance with us. Write to us using the details below and we will act on it. If you are not satisfied with our response you may complain to the Data Protection Board of India.",
      },
      {
        heading: "Children",
        body:
          "This site is meant for adults commissioning work for their own celebrations. We do not knowingly collect the personal data of anyone under 18 without the verifiable consent of a parent or guardian, and we do not track children or advertise to them. Photographs of children shared with us as part of a brief are used only to produce what you commissioned. If you believe a child's data has reached us otherwise, tell us and we will erase it.",
      },
      {
        heading: "Changes",
        body:
          "If this policy changes we will publish the new version on this page. Material changes affecting how we use data you have already given us will be brought to your attention directly.",
      },
      {
        heading: "Grievance Officer",
        body: `${grievanceDetails()} ${GRIEVANCE_PROCESS}`,
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    intro:
      "These terms govern your use of www.shivayonic.com and any work you commission from us. By using the site or commissioning a design, you accept them.",
    sections: [
      {
        heading: "Who you are contracting with",
        body: entityDetails(),
      },
      {
        heading: "What we do",
        body:
          "We create bespoke digital invitations, original music and celebration films. Everything is made to order for your occasion. Browsing the site, adding a design to your basket or submitting a brief does not by itself form a contract: a commission begins when we have confirmed the scope, the price and the timeline with you and you have accepted them.",
      },
      {
        heading: "Prices, taxes and quotations",
        body:
          "Prices shown on the site are indicative starting points for the level of service described. The price for your commission is the one we confirm to you in writing, and it depends on scope, complexity and delivery timeline. All prices are in Indian Rupees. Applicable taxes are charged as required by law and shown separately on the invoice. Nothing is charged through this website today; payment is arranged with you directly, and we will tell you plainly before any amount becomes due.",
      },
      {
        heading: "Delivery",
        body:
          "Everything we make is delivered digitally, by email and WhatsApp, to the contact details you give us. There is no physical shipment and no shipping charge. Once the brief and the final details are confirmed, an invitation is typically delivered within 1 to 4 days; bespoke films and original music follow a separate schedule that we agree with you in advance. Timelines are estimates that depend on how quickly your content, approvals and answers reach us.",
      },
      {
        heading: "Revisions",
        body:
          "Your commission includes a revision window with our team, and the consultation and customisation window can stay open for up to 6 days. Revisions cover refining what was agreed. A change of direction, a new concept or additional deliverables are new work and are quoted separately.",
      },
      {
        heading: "What you give us",
        body:
          "You confirm that the names, photographs, music, logos and any other material you send us are accurate and are yours to use, or that you have permission to use them. Please check names, dates, spellings and venue details carefully — we produce what you supply, and reprints of an approved file caused by an error in the details you gave are chargeable. You agree not to send us anything unlawful, defamatory, obscene, or infringing someone else's rights.",
      },
      {
        heading: "Using the site",
        body:
          "You may use this site to browse our work and commission ours. You may not copy, scrape, resell or republish the designs, photographs, text, music or code on it, attempt to breach its security, or use it in any way that interferes with other people's use of it.",
      },
      {
        heading: "Our responsibility",
        body:
          "We will carry out your commission with reasonable skill and care. We are not liable for delays or failures caused by events outside our reasonable control, including power or internet failure, acts of government, or natural events. Nothing in these terms limits or excludes any right you have as a consumer under the Consumer Protection Act, 2019, or any liability that cannot lawfully be limited.",
      },
      {
        heading: "Governing law",
        body:
          "These terms are governed by the laws of India. Disputes are subject to the jurisdiction of the competent courts in India. Your rights and remedies under the Consumer Protection Act, 2019, including your right to approach a consumer commission, are unaffected.",
      },
      {
        heading: "Grievance Officer",
        body: `${grievanceDetails()} ${GRIEVANCE_PROCESS}`,
      },
    ],
  },
  refund: {
    slug: "refund",
    title: "Refund & Cancellation",
    intro:
      "Every invitation is made to order, so please read this before you commission. Published under Rule 4 of the Consumer Protection (E-Commerce) Rules, 2020.",
    sections: [
      {
        heading: "Cancelling before work begins",
        body:
          "You can cancel at any time before we start creative work on your commission, at no cost and with no obligation. If you have paid anything at that point, it is refunded in full.",
      },
      {
        heading: "Cancelling after work has begun",
        body:
          "Because each commission is designed specifically for you and cannot be resold, amounts covering work already done are non-refundable once creative work is under way. Where a project is cancelled part-way, we will assess in good faith what has actually been produced and refund the balance. We would rather be fair than technical about this — talk to us.",
      },
      {
        heading: "If the delivery is not right",
        body:
          "If what we deliver does not match what we agreed, tell us within 7 days of delivery. We will correct it. If we cannot put it right, we will refund the amount attributable to the part that was wrong. This is in addition to your rights under the Consumer Protection Act, 2019, which are not affected by anything on this page.",
      },
      {
        heading: "Errors in the details you supplied",
        body:
          "We produce the names, dates and details exactly as you approve them. A correction needed because the supplied details were wrong is chargeable rather than refundable, though we will always keep such charges to what the extra work actually costs.",
      },
      {
        heading: "How a refund is made",
        body:
          "Approved refunds are made to the original payment method. We process them within 7 working days of approving the refund; how long the amount takes to appear then depends on your bank or payment provider.",
      },
      {
        heading: "How to raise a cancellation or refund",
        body:
          `Message us on WhatsApp at ${contact.whatsappNumber} or email ${legalEntity.email} with your name, the design or commission concerned, and what you would like to happen. ${GRIEVANCE_PROCESS}`,
      },
      {
        heading: "Grievance Officer",
        body: grievanceDetails(),
      },
    ],
  },
  "content-ip": {
    slug: "content-ip",
    title: "Content & Intellectual Property",
    intro:
      "Who owns what, under the Copyright Act, 1957.",
    sections: [
      {
        heading: "Your material",
        body:
          "The names, details, photographs, videos and music you send us remain yours. By sending them you give us the permission we need to use them for one purpose: producing and delivering the work you commissioned.",
      },
      {
        heading: "What you receive",
        body:
          "On full payment you receive the delivered files with the right to use them for your own celebration — to share them with your guests, on your own social media, and in your personal keepsakes. That right is personal to you and does not include reselling the design, licensing it onward, or using it commercially without our written agreement.",
      },
      {
        heading: "What stays ours",
        body:
          "Our design systems, templates, typography choices, original compositions, production methods, source files and project files, and everything published on this website, remain the intellectual property of Shivayonic Invites, Bholenath Productions and Shivayonic Music. The Shivayonic and Bholenath names and marks are ours and may not be used without permission.",
      },
      {
        heading: "Third-party material",
        body:
          "Where a commission uses licensed fonts, stock imagery or licensed music, that material stays subject to its own licence, which covers your delivered piece and does not pass to you separately.",
      },
      {
        heading: "Showing our work",
        body:
          "We may show delivered work as a sample of our craft — on this site, on our social channels and in proposals. If you would rather your invitation stayed private, tell us and we will honour it, before or after delivery, with no reason needed.",
      },
      {
        heading: "If you think we have infringed something",
        body:
          `If any material on this site infringes your copyright or other rights, write to our Grievance Officer at ${legalEntity.grievanceOfficer.email} identifying the material, where it appears, and the right you hold. We will investigate and remove anything infringing. ${GRIEVANCE_PROCESS}`,
      },
      {
        heading: "Grievance Officer",
        body: grievanceDetails(),
      },
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
          <p className="legalUpdated">Last updated 4 September 2026.</p>
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
