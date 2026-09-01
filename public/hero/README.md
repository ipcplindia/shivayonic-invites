# Hero image slot

The approved cinematic hero is installed as `hero-desktop.webp` (generated from
the supplied `landing page.png`) and rendered via `next/image` in
`src/app/page.tsx`. `og.jpg` is the 1200x630 Open Graph derivative.

To replace: drop a new source, regenerate the webp + og with sharp at the same
sizes, and keep the filenames. `.heroBg` in
`src/features/public/public-sections.css` is the warm sunset backdrop shown
behind the photo while it decodes and if it ever fails to load.

Composition brief (approved): ivory-and-gold Indian royal wedding pavilion,
golden-hour sunset with open sky/space on the LEFT (headline safe area),
pavilion dominant and biased right, peach/coral/ivory/rose florals, reflective
marble floor, no baked-in text.
