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
  youtubeChannelUrl: "https://www.youtube.com/results?search_query=Shivayonic+Invites",
  whatsappNumber: "+91 99900 99990",
  whatsappUrl:
    "https://wa.me/919990099990?text=" +
    encodeURIComponent("Hello Shivayonic Invites, I would like to discuss a cinematic invitation."),
};

export type NavLink = { label: string; href: string };

export const navLinks: NavLink[] = [
  { label: "Home", href: "#top" },
  { label: "Wedding", href: "#wedding" },
  { label: "Celebrations", href: "#celebrations" },
  { label: "Music", href: "#music" },
  { label: "Films", href: "#films" },
  { label: "Devotional", href: "#devotional" },
  { label: "Corporate", href: "#corporate" },
  { label: "Contact", href: "#contact" },
];

/** Grouped shortcuts for the hero search — real destinations, not fake results. */
export const searchShortcuts: { group: string; items: NavLink[] }[] = [
  {
    group: "Occasions",
    items: [
      { label: "Wedding", href: "#wedding" },
      { label: "Mehendi", href: "#wedding" },
      { label: "Haldi", href: "#wedding" },
      { label: "Sangeet", href: "#wedding" },
      { label: "Birthday", href: "#celebrations" },
      { label: "Devotional", href: "#devotional" },
      { label: "Corporate", href: "#corporate" },
    ],
  },
  {
    group: "Craft",
    items: [
      { label: "Invitation Songs", href: "#music" },
      { label: "Cinematic Films", href: "#films" },
      { label: "Visual Styles", href: "#styles" },
    ],
  },
];

export type Category = {
  title: string;
  blurb: string;
  href: string;
  tone: "rose" | "saffron" | "gold" | "teal" | "sage" | "cocoa";
  span?: "wide" | "tall";
};

export const categories: Category[] = [
  { title: "Wedding Invitations", blurb: "From Save the Date to the Pheras — the whole journey, crafted.", href: "#wedding", tone: "rose", span: "wide" },
  { title: "Celebrations", blurb: "Birthdays, anniversaries and the milestones between.", href: "#celebrations", tone: "saffron" },
  { title: "Devotional", blurb: "Pujas, paths and festivals, rendered with reverence.", href: "#devotional", tone: "gold" },
  { title: "Corporate", blurb: "Launches, conferences and awards, on brand.", href: "#corporate", tone: "teal" },
  { title: "Invitation Music", blurb: "Original songs written for your occasion.", href: "#music", tone: "cocoa" },
  { title: "Cinematic Films", blurb: "Invitation films that move people to reply.", href: "#films", tone: "sage", span: "tall" },
];

export const weddingJourney: { label: string; note: string }[] = [
  { label: "Save the Date", note: "The first flutter" },
  { label: "Roka", note: "Two families, one promise" },
  { label: "Engagement", note: "The ring, the reveal" },
  { label: "Godh Tilak", note: "Blessings begin" },
  { label: "Mehendi", note: "Colour and song" },
  { label: "Haldi", note: "Turmeric and joy" },
  { label: "Sangeet", note: "The night of music" },
  { label: "Cocktail", note: "Toasts and glamour" },
  { label: "Wedding · Pheras", note: "The seven vows" },
  { label: "Reception", note: "The grand welcome" },
  { label: "Invitation Songs", note: "Your story, scored" },
];

export const familyCelebrations: { title: string; blurb: string }[] = [
  { title: "Birthday", blurb: "From first candles to milestone years." },
  { title: "Anniversary", blurb: "Silver, golden, and every year worth marking." },
  { title: "Godh Bharai", blurb: "A baby shower wrapped in warmth." },
  { title: "Namkaran", blurb: "The naming, announced with grace." },
  { title: "Annaprashan", blurb: "First bites, first blessings." },
  { title: "Mundan", blurb: "A tender first ceremony." },
  { title: "Griha Pravesh", blurb: "A new home, a new beginning." },
  { title: "Milestones", blurb: "Retirements, reunions, and firsts of every kind." },
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
  name: string;
  occasion: string;
  style: string;
  priceFrom?: string;
  tone: Category["tone"];
};

export const featuredProducts: Product[] = [
  { name: "Marigold Vows", occasion: "Wedding", style: "Royal Cinematic", priceFrom: "₹4,999", tone: "rose" },
  { name: "Golden Hour", occasion: "Reception", style: "Modern Luxe", priceFrom: "₹3,499", tone: "gold" },
  { name: "Turmeric Sun", occasion: "Haldi", style: "Floral", priceFrom: "₹2,499", tone: "saffron" },
  { name: "Peacock Court", occasion: "Sangeet", style: "Heritage", priceFrom: "₹3,999", tone: "teal" },
];

export type SocialItem = {
  id: string;
  title: string;
  occasion: string;
  style: string;
  /** External link opened only on click. No embed loads at page load. */
  href: string;
};

/**
 * The same sample invitation work lives on both platforms; the two ribbons draw
 * from parallel lists so they read as coordinated, not duplicated. Replace
 * `href` with the real video/Reel URLs once configured.
 */
export const youtubeItems: SocialItem[] = [
  { id: "yt-1", title: "A Palace Wedding Film", occasion: "Wedding", style: "Royal Cinematic", href: contact.youtubeChannelUrl },
  { id: "yt-2", title: "Sangeet Night", occasion: "Sangeet", style: "Modern Luxe", href: contact.youtubeChannelUrl },
  { id: "yt-3", title: "Haldi Morning", occasion: "Haldi", style: "Floral", href: contact.youtubeChannelUrl },
  { id: "yt-4", title: "Diwali Greetings", occasion: "Devotional", style: "Heritage", href: contact.youtubeChannelUrl },
  { id: "yt-5", title: "Brand Launch Teaser", occasion: "Corporate", style: "Minimal Elegant", href: contact.youtubeChannelUrl },
  { id: "yt-6", title: "First Birthday", occasion: "Birthday", style: "Storybook", href: contact.youtubeChannelUrl },
];

export const instagramItems: SocialItem[] = [
  { id: "ig-1", title: "Marigold Reel", occasion: "Wedding", style: "Floral", href: contact.instagramProfileUrl },
  { id: "ig-2", title: "Mehendi Colours", occasion: "Mehendi", style: "Traditional", href: contact.instagramProfileUrl },
  { id: "ig-3", title: "Ganesh Chaturthi", occasion: "Devotional", style: "Heritage", href: contact.instagramProfileUrl },
  { id: "ig-4", title: "Anniversary Note", occasion: "Anniversary", style: "Watercolour", href: contact.instagramProfileUrl },
  { id: "ig-5", title: "Product Reveal", occasion: "Corporate", style: "Modern Luxe", href: contact.instagramProfileUrl },
  { id: "ig-6", title: "Baby Shower", occasion: "Godh Bharai", style: "Storybook", href: contact.instagramProfileUrl },
];

export const musicKinds: { title: string; blurb: string }[] = [
  { title: "Custom Invitation Songs", blurb: "An original song written around your names and your date." },
  { title: "Musical Voiceovers", blurb: "A narrated invitation, scored to match the mood." },
  { title: "Celebration Songs", blurb: "Up-tempo numbers for the sangeet and the after-party." },
  { title: "Theme Music", blurb: "A signature motif that threads the whole event." },
  { title: "Corporate & Event Music", blurb: "Brand-aligned scores for launches and awards." },
];

export const filmKinds: { title: string; blurb: string }[] = [
  { title: "Wedding Invitation Films", blurb: "Cinematic reveals that carry the whole story." },
  { title: "Celebration Films", blurb: "Birthdays, anniversaries and milestones, framed beautifully." },
  { title: "Corporate Films", blurb: "Polished invitation films for the room that matters." },
  { title: "Devotional Films", blurb: "Reverent, luminous films for sacred occasions." },
];

export const steps: { title: string; body: string }[] = [
  { title: "Discover", body: "Choose an invitation, occasion or creative direction." },
  { title: "Personalize", body: "Share your event details and preferences." },
  { title: "We Create", body: "Our team crafts the invitation, music and visual experience." },
  { title: "Delivered", body: "Receive the final experience digitally, ready to share." },
];
