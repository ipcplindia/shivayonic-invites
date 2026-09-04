/**
 * Public homepage content, kept out of markup so it can be swapped for real
 * media and real product data without touching layout.
 *
 * Social links live in one place so a verified URL replaces the placeholder in
 * a single edit. Nothing here is presented as a real completed-client claim.
 */

export const contact = {
  // Supplied by the business. Replace with verified profile URLs when confirmed.
  instagramHandle: "@shivayonic.invites",
  youtubeChannel: "Shivayonic Invites",
  // PLACEHOLDER links — point at search until the exact URLs are configured.
  instagramProfileUrl: "https://www.instagram.com/shivayonic.invites/",
  youtubeChannelUrl: "https://www.youtube.com/@SHIVAYONICINVITES",
  /**
   * The number every public "talk to us" goes to. The studio takes enquiries on
   * 99900 99980; 99900 99990 also receives submitted forms but is not the
   * number customers are pointed at.
   */
  whatsappNumber: "+91 99900 99980",
  whatsappUrl:
    "https://wa.me/919990099980?text=" +
    encodeURIComponent("Hello Shivayonic Invites, I would like to discuss a cinematic invitation."),
};

/** Numbers a completed client form is delivered to. */
export const formRecipients = {
  email: "ipcplindia@gmail.com",
  whatsapp: ["919990099990", "919990099980"],
};

/**
 * The business identity the policy pages are required to publish.
 *
 * Rule 4(x) of the Consumer Protection (E-Commerce) Rules, 2020 requires an
 * e-commerce entity to display its legal name, the address of its headquarters,
 * its customer-care contact, and the name, designation and contact of its
 * grievance officer. Rule 4 of the IT (Reasonable Security Practices) Rules,
 * 2011 requires the grievance officer's details to be published alongside the
 * privacy policy.
 *
 * Only the facts we actually hold are set here. Every field is optional and the
 * policy pages render a line only when it is filled, so nothing is invented and
 * no placeholder ships to a customer. Fill the blanks below and the disclosures
 * complete themselves — nothing else needs editing.
 */
export const legalEntity = {
  /** Registered legal name, e.g. "Bholenath Productions Private Limited". */
  registeredName: "",
  /** Trading name shown throughout the site. */
  tradingName: "Shivayonic Invites",
  parent: "Bholenath Productions",
  /** Principal place of business, as registered. */
  address: "",
  /** GSTIN, if registered. */
  gstin: "",
  /** CIN / LLPIN, if incorporated. */
  cin: "",
  email: "ipcplindia@gmail.com",
  phone: "+91 99900 99980",
  website: "www.shivayonic.com",
  grievanceOfficer: {
    /** Name of the officer, as required to be published. */
    name: "",
    designation: "Grievance Officer",
    email: "ipcplindia@gmail.com",
    phone: "+91 99900 99980",
  },
};

/** WhatsApp deep link prefilled for a specific design or service. */
export function whatsappFor(subject: string): string {
  return (
    "https://wa.me/919990099980?text=" +
    encodeURIComponent(`Hello Shivayonic Invites, I would like to customise the ${subject} invitation.`)
  );
}

export type NavLink = { label: string; href: string };

export const navLinks: NavLink[] = [
  { label: "Home", href: "#top" },
  { label: "Wedding", href: "/invitations/wedding" },
  { label: "Celebrations", href: "#celebrations" },
  { label: "Music", href: "#music" },
  { label: "Films", href: "#films" },
  { label: "Devotional", href: "/devotional" },
  { label: "Corporate", href: "/corporate" },
  { label: "Contact", href: "#contact" },
];

/** Grouped shortcuts for the hero search — real destinations, not fake results. */
export const searchShortcuts: { group: string; items: NavLink[] }[] = [
  {
    group: "Occasions",
    items: [
      { label: "Wedding", href: "/invitations/wedding" },
      { label: "Mehendi", href: "/invitations/wedding/mehendi" },
      { label: "Haldi", href: "/invitations/wedding/haldi" },
      { label: "Sangeet", href: "/invitations/wedding/sangeet" },
      { label: "Birthday", href: "/celebrations" },
      { label: "Devotional", href: "/devotional" },
      { label: "Corporate", href: "/corporate" },
    ],
  },
  {
    group: "Craft",
    items: [
      { label: "Invitation Songs", href: "/music" },
      { label: "Cinematic Films", href: "/films" },
      { label: "Visual Styles", href: "/styles" },
    ],
  },
];

export type Category = {
  title: string;
  blurb: string;
  href: string;
  /** Local optimised artwork under /public/categories. */
  img: string;
  tone: "rose" | "saffron" | "gold" | "teal" | "sage" | "cocoa";
  span?: "wide" | "tall";
};

export const categories: Category[] = [
  { title: "Wedding Invitations", blurb: "From Save the Date to the Pheras — the whole journey, crafted.", href: "/invitations/wedding", img: "/categories/wedding.webp", tone: "rose", span: "wide" },
  { title: "Celebrations", blurb: "Birthdays, anniversaries and the milestones between.", href: "/celebrations", img: "/categories/celebrations.webp", tone: "saffron" },
  { title: "Devotional", blurb: "Pujas, paths and festivals, rendered with reverence.", href: "/devotional", img: "/categories/devotional.webp", tone: "gold" },
  { title: "Corporate", blurb: "Launches, conferences and awards, on brand.", href: "/corporate", img: "/categories/corporate.webp", tone: "teal" },
  { title: "Invitation Music", blurb: "Original songs written for your occasion.", href: "/music", img: "/categories/music.webp", tone: "cocoa" },
  { title: "Cinematic Films", blurb: "Invitation films that move people to reply.", href: "/films", img: "/categories/films.webp", tone: "sage", span: "tall" },
];

/**
 * The functions of a wedding, each pointing at the page that holds its designs.
 *
 * These were inert cards. Every function now has a page where its designs can
 * be browsed and added to the cart, so each chapter opens it — a list of
 * occasions the reader cannot act on is just decoration.
 */
export const weddingJourney: { label: string; note: string; href: string }[] = [
  { label: "Save the Date", note: "The first flutter", href: "/invitations/wedding/save-the-date" },
  { label: "Roka", note: "Two families, one promise", href: "/invitations/wedding/roka" },
  { label: "Engagement", note: "The ring, the reveal", href: "/invitations/wedding/engagement" },
  // Godh Tilak has no page of its own yet, so it opens the wedding overview.
  { label: "Godh Tilak", note: "Blessings begin", href: "/invitations/wedding" },
  { label: "Mehendi", note: "Colour and song", href: "/invitations/wedding/mehendi" },
  { label: "Haldi", note: "Turmeric and joy", href: "/invitations/wedding/haldi" },
  { label: "Sangeet", note: "The night of music", href: "/invitations/wedding/sangeet" },
  { label: "Cocktail", note: "Toasts and glamour", href: "/invitations/wedding/cocktail" },
  { label: "Wedding · Pheras", note: "The seven vows", href: "/invitations/wedding/wedding" },
  { label: "Reception", note: "The grand welcome", href: "/invitations/wedding/reception" },
  { label: "Invitation Songs", note: "Your story, scored", href: "/music" },
];

/**
 * Celebration title tiles. The artwork carries its own lettering, so these are
 * shown as pictures alone — no caption, no link. `alt` stays descriptive for
 * anyone who cannot see the tile.
 */
export const celebrationTiles: { slug: string; alt: string }[] = [
  { slug: "engagement-soiree", alt: "Engagement Soirée" },
  { slug: "cocktail-and-sangeet", alt: "Cocktail & Sangeet" },
  { slug: "haldi-utsav", alt: "Haldi Utsav" },
  { slug: "bhaat-and-mayra", alt: "Bhaat & Mayra" },
  { slug: "bachelors-night", alt: "Bachelors Night" },
  { slug: "baby-shower", alt: "Baby Shower" },
  { slug: "silver-jubilee", alt: "Silver Jubilee" },
  { slug: "diwali-soiree", alt: "Diwali Soirée" },
  { slug: "diwali-casino", alt: "Diwali Casino" },
  { slug: "holi-utsav", alt: "Holi Utsav" },
  { slug: "teej-mahotsav", alt: "Teej Mahotsav" },
  { slug: "valentines-soiree", alt: "Valentine's Soirée" },
  { slug: "new-years-eve", alt: "New Year's Eve" },
];

export const festivals: string[] = [
  "Diwali", "Holi", "Raksha Bandhan", "Janmashtami", "Ganesh Chaturthi",
  "Navratri", "Maha Shivaratri", "Satyanarayan Puja", "Mata Ki Chowki",
  "Sunderkand", "Akhand Path", "Gurpurab",
];

export const corporate: { title: string; blurb: string }[] = [
  { title: "Brand Launch", blurb: "Announce arrival with intent." },
  { title: "Product Launch", blurb: "A reveal worth the room." },
  { title: "Conference", blurb: "Invitations that set the tone." },
  { title: "Annual Day", blurb: "Celebrate the year, in style." },
  { title: "Dealer Meet", blurb: "Bring the network together." },
  { title: "Awards", blurb: "Honour the moment properly." },
  { title: "Corporate Greetings", blurb: "Seasonal notes that feel personal." },
  { title: "Store Opening", blurb: "Open the doors with fanfare." },
];

export const visualStyles: string[] = [
  "Royal Cinematic", "Cartoon", "Sketch", "Watercolour", "Minimal Elegant",
  "Floral", "Traditional", "Modern Luxe", "Heritage", "Beach",
  "Storybook", "Contemporary",
];

export type Product = {
  slug: string;
  name: string;
  occasion: string;
  style: string;
  img?: string;
  tone: Category["tone"];
  /** One-line premium description for the product page. */
  blurb: string;
};

export const featuredProducts: Product[] = [
  { slug: "diwali-nights", name: "Diwali Nights", occasion: "Diwali", style: "Heritage", img: "/products/diwali-nights.webp", tone: "rose", blurb: "A warm, lamp-lit Diwali invitation with gold-leaf detailing and a heritage soul." },
  { slug: "birthday-bash", name: "Birthday Bash", occasion: "Birthday", style: "Storybook", img: "/products/birthday-bash.webp", tone: "gold", blurb: "A playful, storybook birthday invite built to make everyone smile at first glance." },
  { slug: "mehendi-night", name: "Mehendi Night", occasion: "Mehendi", style: "Floral", img: "/products/mehendi-night.webp", tone: "saffron", blurb: "Henna greens and marigold golds — a floral mehendi invitation full of colour and song." },
  { slug: "reception-gala", name: "Reception Gala", occasion: "Reception", style: "Modern Luxe", img: "/products/reception-gala.webp", tone: "teal", blurb: "A modern-luxe reception invitation with clean type and a grand, welcoming glow." },
];

export function featuredBySlug(slug: string): Product | undefined {
  return featuredProducts.find((p) => p.slug === slug);
}

/**
 * Every approved artwork on the site, used as a fallback so no card ever
 * renders as a bare gradient. Catalogue records carry no local art yet, so a
 * stable hash of the slug picks one — the same product always shows the same
 * image rather than shuffling between renders.
 */
export const artPool: string[] = [
  "/gallery/janmashtami.webp",
  "/gallery/bhaat-mayra.webp",
  "/gallery/baby-shower.webp",
  "/gallery/corporate-conference.webp",
  "/gallery/mata-ki-chowki.webp",
  "/gallery/gurpurab.webp",
];

/**
 * Art by position, for a list rendered in order.
 *
 * The hashed variant below can hand the same photograph to two entries of the
 * same list — with a pool of six and a page of five panels that is likely, not
 * rare. Indexing walks the pool instead, so a list never repeats itself until
 * it is longer than the pool.
 */
export function artAt(index: number): string {
  return artPool[index % artPool.length];
}

export function artFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return artPool[hash % artPool.length];
}

/**
 * Service plans. Price is the ONLY place any figure is shown on the site.
 * What each tier includes is intentionally not listed — customers get in touch
 * to learn that. The bespoke tier shows no number by design.
 */
export type Plan = {
  key: string;
  name: string;
  price: string | null;
  priceNote: string;
  tagline: string;
  tone: Category["tone"];
  featured?: boolean;
};

export const plans: Plan[] = [
  { key: "silver", name: "Silver", price: "₹50,000", priceNote: "inclusive of GST", tagline: "A beautiful start to your celebration.", tone: "sage" },
  { key: "gold", name: "Gold", price: "₹75,000", priceNote: "inclusive of GST", tagline: "More craft, more of the celebration covered.", tone: "gold", featured: true },
  { key: "platinum", name: "Platinum", price: "₹1,00,000", priceNote: "inclusive of GST", tagline: "Our fullest cinematic treatment.", tone: "teal" },
  { key: "customise", name: "Customise It All", price: null, priceNote: "Get in touch to find out the exact price.", tagline: "Built entirely around your vision.", tone: "rose" },
];

export type SocialWork = {
  id: string;
  /** YouTube Shorts video id; drives the canonical poster shared by both rails. */
  youtubeId: string;
  youtubeUrl: string;
  instagramUrl: string;
  /** One poster per work (the Short's own thumbnail), reused on both platforms. */
  poster: string;
};

/**
 * The 13 matched works. The same video lives as a YouTube Short and an Instagram
 * Reel, so both rails share one canonical poster (the Short thumbnail); only the
 * platform label, marquee direction and destination differ. No embeds, no
 * autoplay — poster cards that open the real post on click.
 */
export const socialWorks: SocialWork[] = [
  { id: "w1", youtubeId: "N93M7kERy_Y", youtubeUrl: "https://youtube.com/shorts/N93M7kERy_Y", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuAIyey-f4/", poster: "https://i.ytimg.com/vi/N93M7kERy_Y/hqdefault.jpg" },
  { id: "w2", youtubeId: "XzM-_cadqug", youtubeUrl: "https://youtube.com/shorts/XzM-_cadqug", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuAuxtye1A/", poster: "https://i.ytimg.com/vi/XzM-_cadqug/hqdefault.jpg" },
  { id: "w3", youtubeId: "zTLablk6oiI", youtubeUrl: "https://youtube.com/shorts/zTLablk6oiI", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuA-uWStux/", poster: "https://i.ytimg.com/vi/zTLablk6oiI/hqdefault.jpg" },
  { id: "w4", youtubeId: "UhrJrt7xakw", youtubeUrl: "https://youtube.com/shorts/UhrJrt7xakw", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuBJw5ya_L/", poster: "https://i.ytimg.com/vi/UhrJrt7xakw/hqdefault.jpg" },
  { id: "w5", youtubeId: "LhHEV0cvrzQ", youtubeUrl: "https://youtube.com/shorts/LhHEV0cvrzQ", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuBYT4yoSn/", poster: "https://i.ytimg.com/vi/LhHEV0cvrzQ/hqdefault.jpg" },
  { id: "w6", youtubeId: "HVjMl2Ky2_w", youtubeUrl: "https://youtube.com/shorts/HVjMl2Ky2_w", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuBmz3S9B_/", poster: "https://i.ytimg.com/vi/HVjMl2Ky2_w/hqdefault.jpg" },
  { id: "w7", youtubeId: "Euz7zxO0Eiw", youtubeUrl: "https://youtube.com/shorts/Euz7zxO0Eiw", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuB2vkS8O4/", poster: "https://i.ytimg.com/vi/Euz7zxO0Eiw/hqdefault.jpg" },
  { id: "w8", youtubeId: "gLF5yoARRxQ", youtubeUrl: "https://youtube.com/shorts/gLF5yoARRxQ", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuCrsZST5i/", poster: "https://i.ytimg.com/vi/gLF5yoARRxQ/hqdefault.jpg" },
  { id: "w9", youtubeId: "l3asgJS-ibI", youtubeUrl: "https://youtube.com/shorts/l3asgJS-ibI", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuDGytyAe1/", poster: "https://i.ytimg.com/vi/l3asgJS-ibI/hqdefault.jpg" },
  { id: "w10", youtubeId: "SX5GwzQ5U2M", youtubeUrl: "https://youtube.com/shorts/SX5GwzQ5U2M", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuDdflSsYc/", poster: "https://i.ytimg.com/vi/SX5GwzQ5U2M/hqdefault.jpg" },
  { id: "w11", youtubeId: "1uMzZ5JXXmc", youtubeUrl: "https://youtube.com/shorts/1uMzZ5JXXmc", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcuDqBPygwl/", poster: "https://i.ytimg.com/vi/1uMzZ5JXXmc/hqdefault.jpg" },
  { id: "w12", youtubeId: "trFAyYd-ItA", youtubeUrl: "https://youtube.com/shorts/trFAyYd-ItA", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcvgkbQSZij/", poster: "https://i.ytimg.com/vi/trFAyYd-ItA/hqdefault.jpg" },
  { id: "w13", youtubeId: "DClkScuy3es", youtubeUrl: "https://youtube.com/shorts/DClkScuy3es", instagramUrl: "https://www.instagram.com/shivayonic.invites/reel/DcvgvzsSaeN/", poster: "https://i.ytimg.com/vi/DClkScuy3es/hqdefault.jpg" },
];

export const musicKinds: { title: string; blurb: string }[] = [
  { title: "Custom Invitation Songs", blurb: "An original song written around your names and your date." },
  { title: "Musical Voiceovers", blurb: "A narrated invitation, scored to match the mood." },
  { title: "Celebration Songs", blurb: "Up-tempo numbers for the sangeet and the after-party." },
  { title: "Theme Music", blurb: "A signature motif that threads the whole event." },
  { title: "Corporate & Event Music", blurb: "Brand-aligned scores for launches and awards." },
];

export const filmKinds: { title: string; blurb: string; img: string }[] = [
  { title: "Wedding Invitation Films", blurb: "Cinematic reveals that carry the whole story.", img: "/films/wedding-invitation-films.webp" },
  { title: "Celebration Films", blurb: "Birthdays, anniversaries and milestones, framed beautifully.", img: "/films/celebration-films.webp" },
  { title: "Corporate Films", blurb: "Polished invitation films for the room that matters.", img: "/films/corporate-films.webp" },
  { title: "Devotional Films", blurb: "Reverent, luminous films for sacred occasions.", img: "/films/devotional-films.webp" },
];

export const steps: { title: string; body: string }[] = [
  { title: "Discover", body: "Choose an invitation, occasion or creative direction." },
  { title: "Personalize", body: "Share your event details and preferences." },
  { title: "We Create", body: "Our team crafts the invitation, music and visual experience." },
  { title: "Delivered", body: "Receive the final experience digitally, ready to share." },
];
