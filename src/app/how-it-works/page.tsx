import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, CTASection, SectionHead } from "@/features/public/sections";
import { steps, contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "How It Works | Shivayonic Invites" },
  description: "Four simple steps from choosing an invitation to receiving your final experience, ready to share.",
  alternates: { canonical: "/how-it-works" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "How It Works" }]} />
        <SectionHead level={1} eyebrow="How Shivayonic Works" title="Four steps, start to shared" lede="Simple, personal, and quick — most invitations are delivered within 1 to 4 days." />
        <div className="steps reveal">
          {steps.map((s) => (
            <div key={s.title} className="step">
              <span className="stepNum" aria-hidden="true" />
              <h3 className="stepTitle">{s.title}</h3>
              <p className="stepBody">{s.body}</p>
            </div>
          ))}
        </div>
      </Band>
      <Band variant="cream">
        <SectionHead eyebrow="Good to know" title="A short, guided process" lede="After you begin, our team reaches out to finalise the creative direction over a short discussion window. Final invitations are delivered digitally by email and WhatsApp." />
      </Band>
      <CTASection title="Ready to begin?" primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }} secondary={{ label: "Browse invitations", href: "/invitations" }} />
    </PageFrame>
  );
}
