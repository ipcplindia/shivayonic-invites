import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CTASection, SectionHead } from "@/features/public/sections";
import { faqs } from "@/features/public/pages";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "FAQ | Shivayonic Invites" },
  description: "Answers to common questions about the Shivayonic process, delivery, customisation, music and films.",
  alternates: { canonical: "/faq" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
        <SectionHead level={1} eyebrow="FAQ" title="Questions, answered" />
        <div className="faqList reveal">
          {faqs.map((f) => (
            <details key={f.q} className="faqItem">
              <summary>{f.q}</summary>
              <p className="faqAnswer">{f.a}</p>
            </details>
          ))}
        </div>
      </Band>
      <CTASection title="Still have a question?" primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "How it works", href: "/how-it-works" }} />
    </PageFrame>
  );
}
