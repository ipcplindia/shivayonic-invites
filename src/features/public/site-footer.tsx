import { contact } from "@/features/public/data";

/** Shared public footer. One definition, used on every public page. */
export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footerTop">
          <div>
            <p className="footerBrandName">SHIVAYONIC INVITES</p>
            <p className="footerBrandSub">By Bholenath Productions &amp; Shivayonic Music</p>
          </div>
          <FooterCol
            title="Explore"
            links={[
              ["Wedding", "/invitations/wedding"],
              ["Celebrations", "/celebrations"],
              ["Devotional", "/devotional"],
              ["Corporate", "/corporate"],
              ["Music", "/music"],
              ["Films", "/films"],
            ]}
          />
          <FooterCol
            title="Help"
            links={[
              ["How It Works", "/how-it-works"],
              ["Catalogue", "/catalogue"],
              ["Our Work", "/our-work"],
              ["About", "/about"],
              ["Contact", "/contact"],
              ["FAQ", "/faq"],
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              ["Privacy", "/privacy"],
              ["Terms", "/terms"],
              ["Refund & Cancellation", "/refund"],
              ["Content & IP", "/content-ip"],
            ]}
          />
          <FooterCol
            title="Follow"
            links={[
              ["Instagram", contact.instagramProfileUrl],
              ["YouTube", contact.youtubeChannelUrl],
              ["WhatsApp", contact.whatsappUrl],
            ]}
          />
        </div>
        <div className="footerBottom">
          <span>© 2026 Shivayonic Invites. All rights reserved.</span>
          <span>Crafted in India.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  const external = (href: string) => href.startsWith("http");
  return (
    <div className="footerCol">
      <p className="footerColTitle">{title}</p>
      <ul>
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              {...(external(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
