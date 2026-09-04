/**
 * Where the subject sits in each photograph, as an `object-position` value.
 *
 * Every image on this site is cropped by the browser, not by the build: a hero
 * is `62svh` at full width, so its aspect runs from about 3.2:1 on a desktop
 * to taller than square on a phone, and no single baked-in crop survives both.
 * The files therefore keep their whole frame, and each one records the point
 * the crop should hold on to, so faces stay in shot at every width.
 *
 * Generated from the source artwork; safe to hand-tune when a photograph wants
 * a different emphasis.
 */
const IMAGE_FOCUS: Record<string, string> = {
  "/wedding/save-the-date.webp": "50% 26%",
  "/wedding/mehendi.webp": "50% 64%",
  "/wedding/haldi.webp": "50% 42%",
  "/wedding/sangeet.webp": "34% 42%",
  "/wedding/pheras.webp": "44% 42%",
  "/wedding/reception.webp": "50% 42%",
  "/wedding/cocktail.webp": "47% 42%",
  "/wedding/roka.webp": "50% 42%",
  "/wedding/engagement.webp": "28% 42%",
  "/pages/about.webp": "50% 42%",
  "/pages/invitations.webp": "50% 51%",
  "/pages/our-work.webp": "72% 42%",
  "/pages/plans.webp": "50% 42%",
  "/pages/customise.webp": "50% 20%",
  // Hand-tuned: the generated point landed on the dress, cropping both heads off.
  "/pages/styles.webp": "50% 38%",
  "/pages/partners.webp": "50% 42%",
  "/pages/catalogue.webp": "50% 20%",
  "/forms/weddings-celebrations.webp": "50% 20%",
  "/forms/corporate-events.webp": "63% 42%",
  "/forms/hospitality-nightlife.webp": "50% 36%",
  "/forms/bespoke-projects.webp": "50% 26%",
  "/about/craft.webp": "50% 42%",
  "/about/values.webp": "50% 42%",
  "/gallery/janmashtami.webp": "50% 64%",
  "/gallery/bhaat-mayra.webp": "50% 55%",
  "/gallery/baby-shower.webp": "50% 42%",
  "/gallery/corporate-conference.webp": "72% 42%",
  "/gallery/mata-ki-chowki.webp": "38% 42%",
  "/gallery/gurpurab.webp": "50% 20%",
  "/pages/plans-detail.webp": "50% 42%",
  // Hand-set from the artwork: each of these keeps the people in shot when the
  // panel crops, rather than holding on the crew or the empty upper third.
  "/films/wedding-invitation-films.webp": "56% 56%",
  "/films/celebration-films.webp": "60% 42%",
  "/films/devotional-films.webp": "55% 48%",
  "/films/corporate-films.webp": "58% 32%",
};

/** The focal point for an image, or the centre when none is recorded. */
export function focusFor(src?: string): string {
  if (!src) return "center";
  return IMAGE_FOCUS[src.split("?")[0]] ?? "center";
}
