# Shivayonic Mobile Launch QA — 2026-09-01

## Source and isolation

- Claude source: `77195c131ba62d3a2483c895c68f1fd9c578fa99`
- Branch: `codex/mobile-launch-qa`
- Worktree: `C:\vivaan all work 31st aug\SHIVAYONIC INVITES\mobile-launch-worktree`
- `claude/frontend` was clean before the worktree was created and was not edited.

## Viewport matrix

| Width | Coverage | Result |
| --- | --- | --- |
| 320 | Complete public-route sweep; touch targets and filters | Pass |
| 360 | Complete public-route sweep | Pass |
| 375 | Complete structural and final sweeps; conversion/product focus | Pass |
| 390 | Navigation, search, drawer, FAQ, and conversion journeys | Pass |
| 414 | Complete public-route sweep | Pass |
| 430 | Conversion routes and complete final sweep | Pass |
| 768 | Complete public-route accessibility/edge sweep | Pass |
| 820 | Complete public-route sweep | Pass |
| 1024 | Complete final regression | Pass |
| 1440 | Complete final desktop regression | Pass |

All sweeps compared document `scrollWidth` with `clientWidth`. No persistent horizontal document overflow remained.

## Route matrix

Checked `/`, `/invitations`, `/invitations/wedding`, all nine wedding event routes, `/celebrations`, `/devotional`, `/corporate`, `/styles`, `/music`, `/films`, `/our-work`, `/how-it-works`, `/about`, `/contact`, `/faq`, `/catalogue`, a valid featured product, an invalid product, `/privacy`, `/terms`, `/refund`, `/content-ip`, and an unknown public route.

## Pass 1 — structural mobile audit

- Swept every public route at 375px and reviewed key compositions at nearby mobile widths.
- Found mobile search hidden by the breakpoint, incomplete drawer modal behavior, product conversion details below the first viewport, missing primary-page H1s, and an unbranded 404.
- Exposed mobile search as a compact 44px control and responsive scrollable panel.
- Added drawer Escape handling, initial close-button focus, body scroll lock/restoration, safe-area padding, and contained scrolling.
- Re-composed the mobile product gallery so artwork remains prominent while name, price, and CTAs appear in the first 844px viewport.
- Added branded general and invalid-product not-found boundaries.

## Pass 2 — interaction and conversion audit

- Walked Home → Invitations → Wedding → Save the Date → Catalogue → Product → Contact/WhatsApp.
- Checked Music, Films, Our Work, Devotional, and Corporate destinations.
- Verified search open/filter/close, drawer open/Escape/scroll restoration, FAQ expansion, internal navigation, and CTA hrefs.
- Verified product and general WhatsApp links use `https://wa.me/919990099990` with encoded context.
- Added native catalogue search, category, and style filters with a clear action and actionable empty state. The form is server-driven and adds no client bundle.

## Pass 3 — performance, accessibility, and edge widths

- Complete sweeps at 320, 360, and 768px found no broken local images or unnamed interactive controls.
- Ensured mobile nav, footer, breadcrumbs, filter controls, and primary actions have practical touch height.
- Restored one H1 per public document for contact, FAQ, how-it-works, and legal pages.
- Verified input text remains 16px on mobile, image aspect ratios reserve space, duplicate social tracks remain hidden from accessibility APIs, and no iframe/autoplay is present.
- Reduced-motion CSS disables reveal/marquee motion and leaves social rails swipeable.

## Pass 4 — final release regression

- Complete post-fix sweeps at 375, 430, 1024, and 1440px, followed by transition sweeps at 414 and 820px.
- No broken local images, persistent overflow, missing H1, malformed WhatsApp links, or unbranded not-found output remained.
- Verified transparent-to-cream nav transition, sticky hero cover behavior, and hero release before the footer during long scrolling.
- Verified a 760×390 representative phone-landscape viewport: no overflow, viewport-height hero, usable menu control, and a contained scrollable drawer.
- Verified the catalogue filter form at 320 and 1024px, including search submission, query persistence, clear filters, and empty-state messaging.

## Performance observations

- Production build: homepage and major public routes report 109 kB first-load JS; shared JS is 103 kB.
- Hero artwork is 242 kB WebP and eagerly loaded; category art is 36–66 kB, product art 130–170 kB, and film art 39–137 kB WebP.
- Social posters are lazy-loaded; cards reserve 9:16 geometry and use no initial iframes or autoplay.
- Local build requires `NODE_OPTIONS=--use-system-ca` on this Windows host so `next/font` can validate Google Fonts through the system certificate store.

## Accessibility observations

- Search and menu controls have explicit accessible names and 44px targets.
- Drawer is modal, Escape-closeable, focus-initialized, safely scrollable, and restores body scrolling.
- Page-level heading structure, FAQ native details/summary behavior, visible focus treatment, reduced motion, alt text, and duplicate social-track hiding were checked.

## Remaining limitations

- Local QA has no published database catalogue rows, so filter geometry, submission, query state, clear behavior, and empty state were verified; populated production results still depend on existing public API data.
- Remote YouTube poster availability depends on the network/CDN. Canonical URLs, shared poster sources, 9:16 reservation, lazy loading, and absence of embeds were verified.
- The build emits the repository’s pre-existing warning that the Next.js ESLint plugin is not detected; standalone lint passes.

## Verification

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm test`: pass — 17 files, 116 tests
- `NODE_OPTIONS=--use-system-ca npm run build`: pass — 39 static pages generated

## Backend integrity

No Prisma, migrations, auth, RBAC, catalogue backend semantics, media backend, storage, admin, payment, or order code was changed.

## Integration instructions

From a clean `claude/frontend` checkout, cherry-pick the commit(s) listed in the final handoff. Do not merge the QA branch wholesale and do not move `shivayonic-task03-verified`.
