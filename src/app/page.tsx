import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import heroImage from "../../public/hero/hero-desktop.webp";
import "@/features/public/public.css";
import "@/features/public/public-sections.css";
import { PIcon } from "@/features/public/icons";
import { SiteNav } from "@/features/public/site-nav";
import { SocialRibbon } from "@/features/public/marquee";
import {
  categories,
  contact,
  corporate,
  familyCelebrations,
  featuredProducts,
  festivals,
  filmKinds,
  instagramItems,
  musicKinds,
  steps,
  visualStyles,
  weddingJourney,
  youtubeItems,
} from "@/features/public/data";

const siteUrl = "https://shivayonic.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Absolute so the admin layout's "· Command Center" template does not apply.
  title: {
    absolute: "Shivayonic Invites | Cinematic Invitations, Original Music & Celebration Films",
  },
  description:
    "Shivayonic Invites creates cinematic wedding and celebration invitations, original invitation music, devotional experiences and corporate event films crafted for moments worth remembering.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Shivayonic Invites",
    title: "Shivayonic Invites | Cinematic Invitations, Original Music & Celebration Films",
    description:
      "Cinematic wedding and celebration invitations, original invitation music, devotional experiences and corporate event films.",
    images: [{ url: "/hero/og.jpg", width: 1200, height: 630, alt: "Shivayonic Invites" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shivayonic Invites",
    description:
      "Cinematic invitations, original music and celebration films crafted for moments worth remembering.",
    images: ["/hero/og.jpg"],
  },
};

function Ornament() {
  return (
    <span className="ornament" aria-hidden="true">
      <span className="diamond" />
    </span>
  );
}

function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <div className="sectionHead reveal">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="sectionTitle">{title}</h2>
      {lede ? <p className="sectionLede">{lede}</p> : null}
      <Ornament />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="site" id="top">
      <SiteNav />

      {/* 01 — HERO */}
      <section className="hero" aria-label="Shivayonic Invites">
        <div className="heroBg" aria-hidden="true" />
        <Image
          src={heroImage}
          alt="A royal ivory-and-gold wedding pavilion at golden sunset, framed by peach and rose flowers over a reflective marble floor"
          className="heroImg"
          fill
          priority
          sizes="100vw"
          placeholder="blur"
        />
        <div className="heroScrim" />
        <div className="heroInner">
          <p className="heroEyebrow">Crafting Invitations</p>
          <h1 className="heroTitle">
            That Celebrate
            <br />
            Life&rsquo;s Finest Moments
          </h1>
          <p className="heroSub">
            Cinematic invitations, original music and beautifully crafted experiences for moments
            worth remembering.
          </p>
          <div className="heroCtas">
            <a href="#explore" className="btn btnSaffron">
              Explore Invitations
            </a>
            <Link href="/films" className="btn btnOnDark">
              <PIcon name="play" size={16} /> Watch Our Work
            </Link>
          </div>
        </div>
        <a href="#explore" className="heroScroll" aria-label="Scroll to explore">
          <PIcon name="chevronDown" size={26} />
        </a>
      </section>

      <main className="siteMain">
        {/* 02 — EXPLORE OUR WORLD */}
        <section className="section" id="explore">
          <div className="shell">
            <SectionHead
              eyebrow="Explore Our World"
              title="Everything you need, beautifully created"
              lede="One studio for the whole celebration — the invitation, the film, and the music that ties it together."
            />
            <div className="bento reveal">
              {categories.map((cat) => (
                <a
                  key={cat.title}
                  href={cat.href}
                  className={`tile ${cat.span === "wide" ? "tileWide" : ""} ${cat.span === "tall" ? "tileTall" : ""} ${cat.tone === "cocoa" ? "tileCocoa" : ""}`}
                >
                  <span className={`tileArt tone-${cat.tone}`} aria-hidden="true" />
                  <div className="tileBody">
                    <h3 className="tileTitle">{cat.title}</h3>
                    <p className="tileBlurb">{cat.blurb}</p>
                    <span className="tileArrow">
                      Explore <PIcon name="arrow" size={15} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — WEDDING JOURNEY */}
        <section className="section creamSection" id="wedding">
          <div className="shell">
            <SectionHead
              eyebrow="The Wedding Journey"
              title="Every celebration along the journey"
              lede="From the first Save the Date to the last reception toast — a chapter for every function."
            />
            <div className="rail reveal">
              {weddingJourney.map((event, i) => (
                <article key={event.label} className="chapter">
                  <span className="chapterNum">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="chapterLabel">{event.label}</h3>
                  <p className="chapterNote">{event.note}</p>
                </article>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link href="/invitations/wedding" className="btn btnGhost">View all wedding invitations</Link>
            </div>
          </div>
        </section>

        {/* 04 — FEATURED WEDDING PRODUCTS */}
        <section className="section">
          <div className="shell">
            <SectionHead
              eyebrow="Featured Wedding Invitations"
              title="Invitations you can make your own"
              lede="Curated designs, each ready to be personalised in your chosen visual world."
            />
            <div className="productGrid reveal">
              {featuredProducts.map((product) => (
                <article key={product.name} className="product">
                  <div className={`productArt tone-${product.tone}`} aria-hidden="true" />
                  <div className="productBody">
                    <h3 className="productName">{product.name}</h3>
                    <p className="productMeta">
                      {product.occasion} · {product.style}
                    </p>
                    {product.priceFrom ? (
                      <p className="productPrice">
                        {product.priceFrom} <span>starting</span>
                      </p>
                    ) : null}
                    <div className="productCtas">
                      <Link href="/catalogue" className="btn btnGhost">
                        View Details
                      </Link>
                      <Link href="/catalogue" className="btn btnPrimary">
                        Customize
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 05 — LIFE & FAMILY CELEBRATIONS */}
        <section className="section creamSection" id="celebrations">
          <div className="shell">
            <SectionHead
              eyebrow="Life & Family"
              title="For every milestone worth marking"
              lede="The small ceremonies and the big ones — announced with the same care."
            />
            <div className="celebGrid reveal">
              {familyCelebrations.map((item) => (
                <article key={item.title} className="celebCard">
                  <h3 className="celebTitle">{item.title}</h3>
                  <p className="celebBlurb">{item.blurb}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 06 — FESTIVALS & DEVOTIONAL */}
        <section className="section cocoaSection" id="devotional">
          <div className="shell">
            <SectionHead
              eyebrow="Festivals & Devotional"
              title="Sacred occasions, rendered with reverence"
              lede="Luminous invitations for the days that gather families in devotion."
            />
            <div className="festWrap reveal">
              {festivals.map((festival) => (
                <span key={festival} className="festPill">
                  {festival}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 07 — CORPORATE */}
        <section className="section" id="corporate">
          <div className="shell">
            <SectionHead
              eyebrow="Corporate"
              title="Polished invitations for the room that matters"
              lede="The same craft, in a cleaner, brand-aligned register."
            />
            <div className="corpGrid reveal">
              {corporate.map((item) => (
                <article key={item.title} className="corpCell">
                  <h3 className="corpTitle">{item.title}</h3>
                  <p className="corpBlurb">{item.blurb}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 08 — VISUAL STYLE EXPLORER */}
        <section className="section creamSection" id="styles">
          <div className="shell">
            <SectionHead
              eyebrow="Choose Your Visual World"
              title="One occasion, many ways to tell it"
              lede="Pick a visual direction — the same event can be royal and cinematic, or soft and hand-drawn."
            />
            <div className="styleWrap reveal">
              {visualStyles.map((style) => (
                <Link key={style} href="/styles" className="styleChip">
                  {style}
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link href="/styles" className="btn btnGhost">Explore all styles</Link>
            </div>
          </div>
        </section>

        {/* 09 — YOUTUBE SHOWCASE (LEFT → RIGHT) */}
        <section className="section" id="watch">
          <div className="shell">
            <SectionHead
              eyebrow="Watch Our Invitations"
              title="Sample invitation films from YouTube"
              lede={`Featured work from ${contact.youtubeChannel}. Thumbnails first — a film opens only when you choose it.`}
            />
          </div>
          <SocialRibbon items={youtubeItems} platform="youtube" direction="ltr" duration={52} />
        </section>

        {/* 10 — INSTAGRAM SHOWCASE (RIGHT → LEFT) */}
        <section className="section creamSection">
          <div className="shell">
            <SectionHead
              eyebrow="On Instagram"
              title="Reels & moments from the studio"
              lede={`Follow ${contact.instagramHandle} for vertical cuts and behind-the-scenes.`}
            />
          </div>
          <SocialRibbon items={instagramItems} platform="instagram" direction="rtl" duration={44} />
        </section>

        {/* 11 — ORIGINAL MUSIC */}
        <section className="section cocoaSection" id="music">
          <div className="shell">
            <SectionHead
              eyebrow="Original Music"
              title="Music that makes the invitation yours"
              lede="An original song, a scored voiceover, a signature motif — written around your occasion."
            />
            <div className="splitGrid reveal">
              {musicKinds.map((item) => (
                <article key={item.title} className="splitCard">
                  <h3 className="splitTitle">{item.title}</h3>
                  <p className="splitBlurb">{item.blurb}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 12 — CINEMATIC FILMS */}
        <section className="section" id="films">
          <div className="shell">
            <SectionHead
              eyebrow="Cinematic Films"
              title="Stories that move"
              lede="Invitation films that carry the whole feeling of the day."
            />
            <div className="productGrid reveal">
              {filmKinds.map((film, i) => (
                <article key={film.title} className="product">
                  <div className={`productArt tone-${["rose", "gold", "teal", "sage"][i % 4]}`} aria-hidden="true" />
                  <div className="productBody">
                    <h3 className="productName">{film.title}</h3>
                    <p className="productMeta">{film.blurb}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 13 — DELIVERED WORK (honest empty slot) */}
        <section className="section creamSection">
          <div className="shell">
            <SectionHead
              eyebrow="Crafted for Real Celebrations"
              title="Delivered work, coming soon"
              lede="A gallery of real Shivayonic invitations will live here as approved work is added."
            />
            <div className="deliveredSlot reveal" aria-label="Delivered work gallery — awaiting media">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="deliveredEmpty">
                  Approved delivered work will appear here.
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 14 — HOW IT WORKS */}
        <section className="section">
          <div className="shell">
            <SectionHead eyebrow="How Shivayonic Works" title="Four steps, start to shared" />
            <div className="steps reveal">
              {steps.map((step) => (
                <div key={step.title} className="step">
                  <span className="stepNum" aria-hidden="true" />
                  <h3 className="stepTitle">{step.title}</h3>
                  <p className="stepBody">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 15 — BESPOKE CTA */}
        <section className="bespoke">
          <div className="shell reveal">
            <h2 className="bespokeTitle">
              Your celebration doesn&rsquo;t have to look like anyone else&rsquo;s.
            </h2>
            <div className="bespokeCtas">
              <Link href="/invitations" className="btn btnSaffron">
                Customize an Invite
              </Link>
              <a
                href={contact.whatsappUrl}
                className="btn btnOnDark"
                target="_blank"
                rel="noopener noreferrer"
              >
                <PIcon name="whatsapp" size={17} /> Talk to Shivayonic
              </a>
            </div>
          </div>
        </section>

        {/* 16 — CONTACT */}
        <section className="section" id="contact">
          <div className="shell">
            <div className="contactGrid">
              <div className="reveal">
                <span className="eyebrow">Contact</span>
                <h2 className="sectionTitle" style={{ textAlign: "left" }}>
                  Let&rsquo;s craft yours
                </h2>
                <p className="sectionLede" style={{ margin: "1rem 0 0", textAlign: "left" }}>
                  Message us on WhatsApp or follow along. Choose an invitation, share your date, and
                  our team takes it from there.
                </p>
              </div>
              <div className="contactCards reveal">
                <a
                  href={contact.whatsappUrl}
                  className="contactCard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="contactIcon">
                    <PIcon name="whatsapp" size={22} />
                  </span>
                  <span>
                    <span className="contactLabel">WhatsApp</span>
                    <br />
                    <span className="contactValue">{contact.whatsappNumber}</span>
                  </span>
                </a>
                <a
                  href={contact.instagramProfileUrl}
                  className="contactCard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="contactIcon">
                    <PIcon name="instagram" size={22} />
                  </span>
                  <span>
                    <span className="contactLabel">Instagram</span>
                    <br />
                    <span className="contactValue">{contact.instagramHandle}</span>
                  </span>
                </a>
                <a
                  href={contact.youtubeChannelUrl}
                  className="contactCard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="contactIcon">
                    <PIcon name="youtube" size={22} />
                  </span>
                  <span>
                    <span className="contactLabel">YouTube</span>
                    <br />
                    <span className="contactValue">{contact.youtubeChannel}</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
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
                ["Wedding", "#wedding"],
                ["Celebrations", "#celebrations"],
                ["Devotional", "#devotional"],
                ["Corporate", "#corporate"],
                ["Music", "#music"],
                ["Films", "#films"],
              ]}
            />
            <FooterCol
              title="Help"
              links={[
                ["How It Works", "#explore"],
                ["Customization", "#styles"],
                ["Delivery", "#contact"],
                ["Contact", "#contact"],
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                ["Privacy", "#"],
                ["Terms", "#"],
                ["Refund & Cancellation", "#"],
                ["Content & IP", "#"],
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
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="footerCol">
      <p className="footerColTitle">{title}</p>
      <ul>
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
