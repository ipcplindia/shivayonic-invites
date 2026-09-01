# Shivayonic Public — Multi-Page Site Expansion

Date: 2026-09-01
Branch: `claude/frontend`
Result: PASS. The homepage is preserved; a premium multi-page public site is
built around it from one reusable, config-driven architecture.

No backend was touched. (Codex's separate public-catalogue backend work, which
had leaked into the working tree as untracked files during a branch switch, was
removed from this branch — it remains intact on `codex/backend`.)

---

## Routes

| Route | Source |
|---|---|
| `/invitations` | landing (bento of the four categories) |
| `/invitations/wedding` | `CategoryPage` (wedding config) |
| `/invitations/wedding/[event]` | wedding subcategory template — SSG for save-the-date, roka, engagement, mehendi, haldi, sangeet, cocktail, wedding, reception |
| `/celebrations` `/devotional` `/corporate` | `CategoryPage` (their configs) |
| `/styles` | all visual styles |
| `/music` `/films` | craft pages (editorial splits / cards) |
| `/our-work` | YouTube + Instagram ribbons + delivered-work slot |
| `/how-it-works` | four steps |
| `/about` | editorial |
| `/contact` | contact cards |
| `/faq` | accordion |
| `/catalogue` | full concept collection grouped by category |
| `/product/[slug]` | product template — SSG per product |

All prerender static (or SSG for the two dynamic routes). Homepage First Load
JS ≈ 114 kB; inner pages ≈ 109 kB.

## One architecture, not cloned pages

- **`CategoryPage`** renders wedding / celebrations / devotional / corporate from
  `categoryConfigs` in `pages.ts` — different hero, accent, copy, chips and
  products, same premium structure.
- **`PageFrame`** wraps every inner page: ivory canvas + `SiteNav` + `SiteFooter`,
  and loads the public stylesheets. `solidNav` renders the warm header from the
  top for pages without an image hero (how-it-works, contact, faq, product).

## Reusable primitives (`sections.tsx`)

`CategoryHero`, `Breadcrumb`, `SectionHead`, `EditorialSplit`, `ChipRail`,
`ProductCard`, `CollectionGrid`, `StyleCard`, `CTASection`, `Band`. Product and
category media are branded gradient tiles (real imagery drops in without markup
changes). Nothing repeats as identical white boxes; composition varies per page.

## Navigation

`SiteNav` rewritten: an Invitations dropdown (Wedding / Celebrations /
Devotional / Corporate / View all), plus Catalogue, Styles, Music, Films, Our
Work, How It Works, the glass search, and a WhatsApp/Contact path. Desktop uses a
hover/focus dropdown; mobile uses an expandable drawer with nested sub-links.
Wedding events are not crowded into the first level.

## Homepage deep links

The homepage now routes into the site: category tiles → their pages, "View all
wedding invitations" → `/invitations/wedding`, style chips + "Explore all
styles" → `/styles`, "Watch Our Work" → `/films`, product cards → `/catalogue`,
"Customize an Invite" → `/invitations`, and the search shortcuts → real routes.
Internal literal links use `next/link`.

## Concept data

One fixtures module (`pages.ts`): products, category configs, wedding events,
visual styles, and FAQs. It is honest concept/demo content behind a single
adapter — real catalogue data or an API can replace it without touching pages.
No fabricated reviews, counts, ratings, awards, or client work; the Delivered
Work section stays an explicit empty slot.

## No fake commerce

Product pages show View / Customize / Contact and a plain note that ordering and
checkout open with the commerce launch. No cart, checkout, payment, or order is
simulated. Style choices are presentation only.

## SEO

Every page sets an absolute title, description, canonical, and `robots: index`,
with one `h1` and section `h2`s.

## Responsive

Reviewed at 1440 and 375 across category, product and catalogue pages: grids
step down, the product info column unsticks and stacks under 1024, chip rails
wrap, the nav collapses to a drawer, and there is no horizontal overflow.

## Verification

- Typecheck: PASS
- Lint: PASS
- Tests: 112 pass (16 files)
- Build: PASS — 16 public routes prerendered/SSG; homepage ≈ 114 kB, inner ≈ 109 kB
- Dependencies added: none

## Known limitations / next

Media is branded gradient placeholders until real assets and per-post social
URLs are supplied. The catalogue and product pages are the visual/architecture
shell; real catalogue data and search integration are the next milestone, and
the fixtures adapter is shaped for it.
