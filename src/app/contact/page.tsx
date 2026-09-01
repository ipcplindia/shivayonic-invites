import { PageFrame } from "@/features/public/page-frame";
import { Band, Breadcrumb, SectionHead } from "@/features/public/sections";
import { PIcon } from "@/features/public/icons";
import { contact } from "@/features/public/data";

export const metadata = {
  title: { absolute: "Contact | Shivayonic Invites" },
  description: "Message Shivayonic Invites on WhatsApp, or follow along on Instagram and YouTube.",
  alternates: { canonical: "/contact" },
  robots: { index: true, follow: true },
};

const cards = [
  { icon: "whatsapp", label: "WhatsApp", value: contact.whatsappNumber, href: contact.whatsappUrl },
  { icon: "instagram", label: "Instagram", value: contact.instagramHandle, href: contact.instagramProfileUrl },
  { icon: "youtube", label: "YouTube", value: contact.youtubeChannel, href: contact.youtubeChannelUrl },
];
export default function Page() {
  return (
    <PageFrame solidNav>
      <Band>
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <div className="contactGrid">
          <div className="reveal">
            <SectionHead level={1} center={false} eyebrow="Contact" title="Let us craft yours" lede="Message us on WhatsApp or follow along. Choose an invitation, share your date, and our team takes it from there." />
          </div>
          <div className="contactCards reveal">
            {cards.map((c) => (
              <a key={c.label} href={c.href} className="contactCard" target="_blank" rel="noopener noreferrer">
                <span className="contactIcon"><PIcon name={c.icon} size={22} /></span>
                <span>
                  <span className="contactLabel">{c.label}</span><br />
                  <span className="contactValue">{c.value}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </Band>
    </PageFrame>
  );
}
