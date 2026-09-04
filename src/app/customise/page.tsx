import { PageFrame } from "@/features/public/page-frame";
import { Band, CategoryHero, CrumbBar, CTASection, MiniFaq, ProcessBand, SectionHead } from "@/features/public/sections";
import { PIcon } from "@/features/public/icons";
import { clientForms } from "@/features/public/client-forms";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Order Now | Shivayonic Invites" },
  description:
    "Start your invitation, film or music project — fill the client form online, or download the PDF and send it back by WhatsApp or email.",
  alternates: { canonical: "/customise" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PageFrame solidNav>
      <CategoryHero
        eyebrow="Order Now"
        title="Tell us about your celebration"
        lede="Pick the form that fits your project. Fill it in online — your answers save as you go — or download the PDF and send it back whenever suits you."
        tone="rose"
        image="/pages/customise.webp"
        primary={{ label: "Choose your form", href: "#briefs" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
      />

      <CrumbBar trail={[{ label: "Home", href: "/" }, { label: "Order Now" }]} />

      <Band label="Choose your brief">
        <div id="briefs">
          <SectionHead
            eyebrow="Two Ways to Start"
            title="The same form, online or on paper"
            lede="Both routes ask exactly the same questions. Online, your answers save in this browser as you type, so you can stop and come back. Offline, fill the PDF in your own time and send it over."
          />
        </div>

        <div className="briefGrid reveal">
          {clientForms.map((f) => (
            <article key={f.slug} className="briefCard">
              <span
                className={`briefArt tone-${f.tone} hasPhoto`}
                style={{ backgroundImage: `url(${f.image})` }}
                aria-hidden="true"
              />
              <div className="briefBody">
                <span className="briefNo">Form {f.formNo}</span>
                <h3 className="briefName">{f.name}</h3>
                <p className="briefBlurb">{f.blurb}</p>
                <div className="briefActions">
                  <a href={`/customise/${f.slug}`} className="btn btnSaffron">
                    Fill online
                  </a>
                  <a href={f.pdf} className="btn btnGhost" download>
                    <PIcon name="arrow" size={15} /> Download PDF
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Band>

      <ProcessBand variant="cream" />

      <Band label="Sending an offline form">
        <SectionHead
          eyebrow="Offline Forms"
          title="Prefer to fill it in your own time?"
          lede="Download the form above, complete it on your computer or on paper, then send it back to us — whichever is easier."
        />
        <div className="promiseGrid reveal">
          <article className="promiseCard">
            <h3 className="promiseTitle">Send on WhatsApp</h3>
            <p className="promiseBody">
              Message the completed form to {contact.whatsappNumber}. Photographs of a printed form are
              perfectly fine.
            </p>
            <div style={{ marginTop: "1.2rem" }}>
              <a href={contact.whatsappUrl} className="btn btnGhost" target="_blank" rel="noopener noreferrer">
                Open WhatsApp
              </a>
            </div>
          </article>
          <article className="promiseCard">
            <h3 className="promiseTitle">Send by email</h3>
            <p className="promiseBody">
              Attach the completed PDF and email it to our team. We reply with next steps and a timeline.
            </p>
            <div style={{ marginTop: "1.2rem" }}>
              <a href="mailto:ipcplindia@gmail.com?subject=Shivayonic%20client%20form" className="btn btnGhost">
                Open email
              </a>
            </div>
          </article>
          <article className="promiseCard">
            <h3 className="promiseTitle">Not sure which form?</h3>
            <p className="promiseBody">
              Message us and we will point you to the right one — or simply talk it through and we will fill
              in the details together.
            </p>
            <div style={{ marginTop: "1.2rem" }}>
              <a href="/contact" className="btn btnGhost">
                Contact us
              </a>
            </div>
          </article>
        </div>
      </Band>

      <MiniFaq variant="cream" />

      <CTASection
        title="Ready when you are"
        lede="Start the online form, or send the offline PDF whenever it suits you."
        primary={{ label: "Chat on WhatsApp", href: contact.whatsappUrl, external: true }}
        secondary={{ label: "See the plans", href: "/plans" }}
      />
    </PageFrame>
  );
}
