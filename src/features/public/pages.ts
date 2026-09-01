/**
 * Public multi-page content and a small concept-data fixture set.
 *
 * Everything here is honest concept/demo content behind one module, so real
 * catalogue data or a real API can replace it without touching page markup.
 * Nothing is presented as a real completed-client claim, and no price implies a
 * live checkout.
 */

export type ToneName = "rose" | "saffron" | "gold" | "teal" | "sage" | "cocoa";

export type Product = {
  slug: string;
  name: string;
  occasion: string;
  style: string;
  priceFrom?: string;
  tone: ToneName;
  category: "wedding" | "celebrations" | "devotional" | "corporate";
};

export type CategoryConfig = {
  key: string;
  path: string;
  eyebrow: string;
  title: string;
  lede: string;
  tone: ToneName;
  intro: { title: string; body: string };
  /** Sub-occasions shown as a chip rail (each may become a route later). */
  chips: { label: string; href: string }[];
  productCategory: Product["category"];
};

/* ---------------------------------------------------------- Products */

export const products: Product[] = [
  { slug: "marigold-vows", name: "Marigold Vows", occasion: "Wedding", style: "Royal Cinematic", priceFrom: "₹4,999", tone: "rose", category: "wedding" },
  { slug: "golden-hour", name: "Golden Hour", occasion: "Reception", style: "Modern Luxe", priceFrom: "₹3,499", tone: "gold", category: "wedding" },
  { slug: "turmeric-sun", name: "Turmeric Sun", occasion: "Haldi", style: "Floral", priceFrom: "₹2,499", tone: "saffron", category: "wedding" },
  { slug: "peacock-court", name: "Peacock Court", occasion: "Sangeet", style: "Heritage", priceFrom: "₹3,999", tone: "teal", category: "wedding" },
  { slug: "henna-nights", name: "Henna Nights", occasion: "Mehendi", style: "Traditional", priceFrom: "₹2,499", tone: "sage", category: "wedding" },
  { slug: "first-light", name: "First Light", occasion: "Save the Date", style: "Minimal Elegant", priceFrom: "₹1,999", tone: "gold", category: "wedding" },
  { slug: "little-star", name: "Little Star", occasion: "Birthday", style: "Storybook", priceFrom: "₹1,799", tone: "rose", category: "celebrations" },
  { slug: "silver-years", name: "Silver Years", occasion: "Anniversary", style: "Watercolour", priceFrom: "₹2,199", tone: "sage", category: "celebrations" },
  { slug: "cradle-song", name: "Cradle Song", occasion: "Godh Bharai", style: "Floral", priceFrom: "₹1,999", tone: "saffron", category: "celebrations" },
  { slug: "diya-glow", name: "Diya Glow", occasion: "Diwali", style: "Heritage", priceFrom: "₹1,499", tone: "gold", category: "devotional" },
  { slug: "ganesha-blessings", name: "Ganesha Blessings", occasion: "Ganesh Chaturthi", style: "Devotional", priceFrom: "₹1,499", tone: "saffron", category: "devotional" },
  { slug: "brand-unveiled", name: "Brand Unveiled", occasion: "Product Launch", style: "Modern Minimal", priceFrom: "₹4,499", tone: "teal", category: "corporate" },
  { slug: "annual-stage", name: "Annual Stage", occasion: "Annual Day", style: "Modern Luxe", priceFrom: "₹3,999", tone: "cocoa", category: "corporate" },
];

export function productsFor(category: Product["category"]) {
  return products.filter((p) => p.category === category);
}

export function findProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

/* ---------------------------------------------------------- Categories */

export const categoryConfigs: Record<string, CategoryConfig> = {
  wedding: {
    key: "wedding",
    path: "/invitations/wedding",
    eyebrow: "Wedding Invitations",
    title: "Every celebration along the journey",
    lede: "From the first Save the Date to the last reception toast — cinematic invitations, films and music for each function of the wedding.",
    tone: "rose",
    intro: {
      title: "One wedding, told beautifully at every step",
      body: "Each function has its own mood. We craft a coherent suite — invitation, film and music — so the whole celebration feels of a piece, from Roka to Reception.",
    },
    chips: [
      { label: "Save the Date", href: "/invitations/wedding/save-the-date" },
      { label: "Roka", href: "/invitations/wedding/roka" },
      { label: "Engagement", href: "/invitations/wedding/engagement" },
      { label: "Mehendi", href: "/invitations/wedding/mehendi" },
      { label: "Haldi", href: "/invitations/wedding/haldi" },
      { label: "Sangeet", href: "/invitations/wedding/sangeet" },
      { label: "Cocktail", href: "/invitations/wedding/cocktail" },
      { label: "Wedding", href: "/invitations/wedding/wedding" },
      { label: "Reception", href: "/invitations/wedding/reception" },
    ],
    productCategory: "wedding",
  },
  celebrations: {
    key: "celebrations",
    path: "/celebrations",
    eyebrow: "Celebrations",
    title: "For every milestone worth marking",
    lede: "Birthdays, anniversaries, and the family ceremonies in between — announced with warmth and craft.",
    tone: "saffron",
    intro: {
      title: "The small ceremonies deserve the same care",
      body: "A first birthday, a silver anniversary, a naming day — we give each occasion an invitation as memorable as the moment itself.",
    },
    chips: [
      { label: "Birthday", href: "/celebrations" },
      { label: "Anniversary", href: "/celebrations" },
      { label: "Godh Bharai", href: "/celebrations" },
      { label: "Namkaran", href: "/celebrations" },
      { label: "Griha Pravesh", href: "/celebrations" },
      { label: "Milestones", href: "/celebrations" },
    ],
    productCategory: "celebrations",
  },
  devotional: {
    key: "devotional",
    path: "/devotional",
    eyebrow: "Festivals & Devotional",
    title: "Sacred occasions, rendered with reverence",
    lede: "Luminous invitations for the festivals and pujas that gather families in devotion.",
    tone: "gold",
    intro: {
      title: "Reverent, luminous, and true to the occasion",
      body: "Festival greetings and puja invitations crafted with care for the ritual and the feeling — never a mashup, always in good taste.",
    },
    chips: [
      { label: "Diwali", href: "/devotional" },
      { label: "Holi", href: "/devotional" },
      { label: "Ganesh Chaturthi", href: "/devotional" },
      { label: "Navratri", href: "/devotional" },
      { label: "Satyanarayan Puja", href: "/devotional" },
      { label: "Mata Ki Chowki", href: "/devotional" },
    ],
    productCategory: "devotional",
  },
  corporate: {
    key: "corporate",
    path: "/corporate",
    eyebrow: "Corporate",
    title: "Polished invitations for the room that matters",
    lede: "Launches, conferences, annual days and awards — the same craft, in a cleaner, brand-aligned register.",
    tone: "teal",
    intro: {
      title: "On-brand, on-message, and unmistakably premium",
      body: "We work to your brand and your moment — a launch teaser, a conference invite, an awards film — with structured, confident design.",
    },
    chips: [
      { label: "Brand Launch", href: "/corporate" },
      { label: "Product Launch", href: "/corporate" },
      { label: "Conference", href: "/corporate" },
      { label: "Annual Day", href: "/corporate" },
      { label: "Dealer Meet", href: "/corporate" },
      { label: "Awards", href: "/corporate" },
    ],
    productCategory: "corporate",
  },
};

/* ---------------------------------------------------------- Wedding events */

export const weddingEvents: Record<string, { title: string; note: string; occasion: string }> = {
  "save-the-date": { title: "Save the Date", note: "The first flutter of the celebration.", occasion: "Save the Date" },
  roka: { title: "Roka", note: "Two families, one promise.", occasion: "Roka" },
  engagement: { title: "Engagement", note: "The ring, and the reveal.", occasion: "Engagement" },
  mehendi: { title: "Mehendi", note: "Colour, henna and song.", occasion: "Mehendi" },
  haldi: { title: "Haldi", note: "Turmeric, sunshine and joy.", occasion: "Haldi" },
  sangeet: { title: "Sangeet", note: "The night of music.", occasion: "Sangeet" },
  cocktail: { title: "Cocktail", note: "Toasts and glamour.", occasion: "Cocktail" },
  wedding: { title: "Wedding · Pheras", note: "The seven vows.", occasion: "Wedding" },
  reception: { title: "Reception", note: "The grand welcome.", occasion: "Reception" },
};

export const weddingEventSlugs = Object.keys(weddingEvents);

/* ---------------------------------------------------------- Visual styles */

export const visualStyleCards: { name: string; note: string; tone: ToneName }[] = [
  { name: "Royal Cinematic", note: "Grand, warm, film-like.", tone: "gold" },
  { name: "Cartoon", note: "Playful and characterful.", tone: "saffron" },
  { name: "Sketch", note: "Hand-drawn intimacy.", tone: "sage" },
  { name: "Watercolour", note: "Soft washes of colour.", tone: "rose" },
  { name: "Minimal Elegant", note: "Quiet, confident, spare.", tone: "cocoa" },
  { name: "Floral", note: "Blooms and garlands.", tone: "rose" },
  { name: "Traditional", note: "Motifs and heritage.", tone: "saffron" },
  { name: "Modern Luxe", note: "Sleek and premium.", tone: "gold" },
  { name: "Heritage", note: "Palace-court richness.", tone: "teal" },
  { name: "Beach", note: "Airy, coastal light.", tone: "sage" },
  { name: "Storybook", note: "Warm and narrative.", tone: "rose" },
  { name: "Contemporary", note: "Clean and current.", tone: "teal" },
];

/* ---------------------------------------------------------- FAQ */

export const faqs: { q: string; a: string }[] = [
  {
    q: "How does the process work?",
    a: "You choose an invitation and a visual direction, share your event details, and our team crafts the invitation, music and film. You receive the final experience digitally, ready to share.",
  },
  {
    q: "How long does delivery take?",
    a: "Most invitations are delivered within 1–4 days depending on the occasion and level of detail. Bespoke films and music may take a little longer; we confirm timelines when we speak.",
  },
  {
    q: "Can I customise the design and music?",
    a: "Yes — that is the point. After you begin, our team works with you over a short discussion window to finalise the creative direction, names, dates and style.",
  },
  {
    q: "How do I receive the final invitation?",
    a: "Digitally, by email and WhatsApp, in formats ready to share with your guests.",
  },
  {
    q: "Do you make invitation songs and films?",
    a: "We do — original invitation songs, scored voiceovers, and cinematic invitation films for weddings, celebrations, devotional occasions and corporate events.",
  },
  {
    q: "Can you handle corporate events?",
    a: "Yes. We create brand-aligned invitations and films for launches, conferences, annual days, dealer meets and awards.",
  },
];
