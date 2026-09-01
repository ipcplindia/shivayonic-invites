# Hero image slot

Drop the approved cinematic hero here as `hero.jpg` (or `hero.webp` and update
`.heroBg` in `src/features/public/public-sections.css`).

Composition brief (approved): a magnificent ivory-and-gold Indian royal wedding
pavilion, warm golden sunset with open sky on the LEFT (text safe area), the
principal pavilion shifted RIGHT, peach/coral/ivory/rose florals, reflective
marble floor, no baked-in text, no people required.

Until the file exists, `.heroBg` shows a warm sunset gradient fallback so the
page never looks broken. `background-position: 78% center` keeps the pavilion
right and the left open for the headline.

A dedicated mobile crop may be added later as `hero-mobile.jpg` with a
`@media (max-width: 760px)` override on `.heroBg`.
