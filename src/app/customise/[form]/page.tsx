import { notFound } from "next/navigation";

import { PageFrame } from "@/features/public/page-frame";
import { Band, CategoryHero, CrumbBar, CTASection, MiniFaq, SectionHead } from "@/features/public/sections";
import { PIcon } from "@/features/public/icons";
import { ClientFormView } from "@/features/public/client-form-view";
import { clientForms, clientFormBySlug, formFieldCount } from "@/features/public/client-forms";
import { contact } from "@/features/public/data";

export function generateStaticParams() {
  return clientForms.map((f) => ({ form: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ form: string }> }) {
  const { form } = await params;
  const def = clientFormBySlug(form);
  if (!def) return {};
  return {
    title: { absolute: `${def.name} — Client Form | Shivayonic Invites` },
    description: `${def.blurb} Fill the form online, or download the PDF.`,
    alternates: { canonical: `/customise/${form}` },
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ form: string }> }) {
  const { form } = await params;
  const def = clientFormBySlug(form);
  if (!def) notFound();

  const others = clientForms.filter((f) => f.slug !== def.slug);
  const count = formFieldCount(def);

  return (
    <PageFrame solidNav>
      <CategoryHero
        eyebrow={`Client Form ${def.formNo}`}
        title={def.name}
        lede={def.blurb}
        tone={def.tone}
        image={def.image}
        primary={{ label: "Start the form", href: "#brief" }}
        secondary={{ label: "Download the PDF", href: def.pdf }}
      />

      <CrumbBar
        trail={[
          { label: "Home", href: "/" },
          { label: "Customise", href: "/customise" },
          { label: def.shortName },
        ]}
      />

      <Band label="Online form">
        <div id="brief">
          <SectionHead
            eyebrow="Online Form"
            title="Fill it in at your own pace"
            lede={`The complete brief — ${def.sections.length} sections, ${count} questions. Answer what you can; blanks are simply left out, and your progress saves in this browser as you type.`}
          />
        </div>
        <ClientFormView form={def} />
      </Band>

      <Band variant="cream" label="Offline form">
        <div className="offlineNote reveal">
          <span className="eyebrow">Offline Form {def.formNo}</span>
          <h2 className="splitTitle2">Would you rather fill it in on paper?</h2>
          <p className="splitBody2">
            Download the printable {def.shortName.toLowerCase()} form — the same questions, in a fillable PDF.
            Complete it on your computer or by hand, then send it back on WhatsApp or by email.
          </p>
          <div className="splitActions">
            <a href={def.pdf} className="btn btnPrimary" download>
              <PIcon name="arrow" size={15} /> Download the PDF
            </a>
            <a href={contact.whatsappUrl} className="btn btnGhost" target="_blank" rel="noopener noreferrer">
              Send it on WhatsApp
            </a>
            <a
              href={`mailto:ipcplindia@gmail.com?subject=${encodeURIComponent(`Shivayonic client form ${def.formNo} — ${def.shortName}`)}`}
              className="btn btnGhost"
            >
              Send it by email
            </a>
          </div>
        </div>
      </Band>

      <Band label="Other forms">
        <SectionHead center={false} eyebrow="Other Forms" title="Not the right one?" />
        <div className="chipRail reveal" style={{ marginTop: "1.75rem" }}>
          {others.map((f) => (
            <a key={f.slug} href={`/customise/${f.slug}`} className="chipLink">
              {f.name}
            </a>
          ))}
        </div>
      </Band>

      <MiniFaq variant="cream" />

      <CTASection
        title="Questions before you start?"
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </PageFrame>
  );
}
