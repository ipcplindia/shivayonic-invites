# Shivayonic Public Homepage — Launch Gate

Date: 2026-09-01
Branch: `claude/frontend`
Result: **PASS** — publishable. One design decision, no redesign.

---

## Hero asset installed

- Source: the approved `landing page.png` (1672×941) supplied by the user.
- Optimised derivatives generated with `sharp` into `public/hero/`:
  `hero-desktop.webp` (242 KB, from 2.4 MB) and `og.jpg` (1200×630, pavilion-biased).
- The homepage now renders the photo with `next/image` (`fill priority`,
  `sizes="100vw"`, blur placeholder), so each viewport is served a resized
  width. The warm sunset gradient stays behind it as a decode/failure backdrop.
- Verified served and correct by loading the optimised asset directly (golden
  pavilion, florals, marble floor, left space open for the headline). The
  in-app preview pane does not composite a `next/image` layer into its own
  screenshot, so the hero was verified via that direct asset load plus DOM
  checks (image complete, `naturalWidth` 1254, covering, on top); real browsers
  render it.

## Responsive treatment

Hero `100svh`; `object-position: 72% center` (64% under 760px) keeps the pavilion
the anchor and the left open for the headline. No full overlay — only the
approved left-side scrim. Nav transparent initially, warm solid cream once
scrolled. Grids step 3→2→1 at 1024/760; rails and marquees swipe on mobile; no
horizontal overflow.

## Real media installed vs placeholders

Only the hero photograph was supplied, so only it was installed. Category,
product, film and delivered-work art remain **branded gradient concept
placeholders** (not fabricated client work). They swap for real media without
layout change.

## Social links configured

Central config: `src/features/public/data.ts` → `contact`.

- WhatsApp: **+91 99900 99990**, `https://wa.me/919990099990` with a safely
  URL-encoded prefilled message ("Hello Shivayonic Invites, I would like to
  discuss a cinematic invitation."). Verified in the CTAs and contact card.
- Instagram: handle `@shivayonic.invites`; profile URL is a **placeholder**
  pending the verified link.
- YouTube: channel "Shivayonic Invites"; channel URL is a **placeholder**
  (search link) pending the verified channel URL.
- Social ribbon cards link to the profile/channel, never to fabricated
  per-post/per-video URLs.

### Missing verified social URLs

- Exact Instagram profile URL.
- Exact YouTube channel URL.
- Per-post / per-video URLs for the ribbon cards.

## Unverified claims

None present, and none added. The page carries no client counts, ratings,
years, countries, or invite totals. Trust is stated non-numerically
(bespoke direction, original music, cinematic production, personalised
delivery). No testimonials, venues, awards, or delivery counts.

## SEO / social share

Absolute title (overrides the admin template), description, canonical `/`,
`robots: index`, Open Graph + Twitter cards, and an OG image (`/hero/og.jpg`,
1200×630). No admin metadata leaks to the public route.

## Purchase language

Product CTAs are "View Details" / "Customize" / "Explore", routing to Contact.
No Buy Now, cart, checkout, or payment is shown — commerce is a later milestone.

## Verification

- Typecheck: PASS
- Lint: PASS
- Tests: 112 pass (16 files)
- Build: PASS — `/` prerenders **static**, First Load JS **111 kB** (was ~105 kB;
  +6 kB is the `next/image` runtime). Admin routes intact, `/admin/media` 118 kB.

## Admin / backend integrity

Auth, Prisma, RBAC, media lifecycle, storage, and API business logic: all
**unchanged**. The only shared edit remains the additive Fraunces font variable.

## Remaining deployment blockers

None that block publishing the homepage. Before go-live the business should
supply the **verified Instagram and YouTube URLs** (and ideally per-post links),
and, when ready, real category/product/delivered-work imagery to replace the
gradient placeholders. Neither blocks the homepage from being the public face of
Shivayonic today.
