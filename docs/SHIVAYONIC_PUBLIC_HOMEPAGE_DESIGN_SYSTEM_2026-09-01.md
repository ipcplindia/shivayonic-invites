# Shivayonic Public Homepage — Design System

Date: 2026-09-01
Name: **Celebration Ivory**
Scope: the public site (`/`). Deliberately separate from the admin's dark
"Lacquer & Brass"; the two never share visual language.

---

## 1. Palette

All tokens are scoped under `.site` in `src/features/public/public.css`, and
`.site` paints its own ivory ground over the admin's dark `body` background so
the two designs never collide.

| Role | Token | Value |
|---|---|---|
| Canvas | `--ivory` | `#fff9f1` |
| Warm surface | `--cream` | `#f7e8d4` |
| Ink (primary) | `--cocoa` | `#44241d` |
| Ink (secondary) | `--umber` | `#765b50` |
| Festive accent | `--saffron` | `#e98a32` |
| Emotional accent | `--rose` | `#c94d68` |
| Luxury accent | `--gold` | `#c89a49` |
| Selective | `--teal` `--sage` | `#357c79` · `#a7b99a` |

Accents are used sparingly and by role — saffron for eyebrows and the primary
festive CTA, gold for the ornament and fine rules, rose/teal/sage only as tile
tints. No fake metallic gradients, no black-and-gold, no neon, no glass except
the one search control.

## 2. Typography

- **Display:** Fraunces (variable, SOFT + optical axes) — warm high-contrast
  serif for the hero, section titles and product/tile names. Loaded via
  `next/font`, added as `--font-serif-festive` in the root layout.
- **Body:** Geist (already in the app) — everything read as running text.

Admin fonts (Instrument Serif, Geist Mono) are untouched.

## 3. Hero rules

- Full `100svh` cinematic scene. Left text safe area preserved by a left-only
  scrim and `background-position: 78% center`.
- Media slot: `public/hero/hero.jpg` (documented in `public/hero/README.md`).
  Until present, `.heroBg` shows a warm sunset gradient fallback layered under
  the same `image-set()`, so the page is never broken and swaps to the real
  photo with no code change.
- Copy is fixed: eyebrow "Crafting Invitations", headline "That Celebrate /
  Life's Finest Moments", the approved supporting line, CTAs "Explore
  Invitations" + "Watch Our Work". No paragraph, no statistics, no ratings.

## 4. Navbar behaviour

- **Hard lock:** transparent over the hero — no bar, strip, or full-width blur.
  Only the search control carries treatment.
- **Search** is the single glass element: translucent, restrained blur, edge
  highlight. Its **results panel is solid ivory**, cocoa text, for readability.
  It searches known destinations only and says so — there is no public search
  API to fake.
- Once scrolled past the hero (`scrollY > 70svh`) the nav becomes a warm solid
  cream header with cocoa type and a hairline divider — no black, no heavy
  shadow.
- Mobile: links collapse to a drawer; the search + menu are icon buttons.

## 5. Homepage sections (implemented order)

1. Fullscreen hero
2. Explore Our World (editorial bento)
3. The Wedding Journey (horizontal chapter rail)
4. Featured Wedding Invitations (editorial product tiles)
5. Life & Family Celebrations
6. Festivals & Devotional (cocoa section)
7. Corporate (structured grid)
8. Choose Your Visual World (style chips)
9. YouTube Showcase — marquee **left → right**
10. Instagram Showcase — marquee **right → left**
11. Original Music (cocoa split)
12. Cinematic Films
13. Delivered Work (honest empty slot)
14. How Shivayonic Works (4 steps)
15. Bespoke CTA
16. Contact
17. Footer

Compositions are varied — bento, rail, tint cards, pills, structured grid,
chips, ribbons, split cards — so the long page never reads as repeated grids.
Occasion taxonomy and visual-style taxonomy are kept as separate data lists.

## 6. Social ribbon architecture

- Data-driven from `src/features/public/data.ts` (`youtubeItems`,
  `instagramItems`); the same underlying work appears on both, presented
  differently (16:9 vs 9:16).
- Pure-CSS marquee: the track is duplicated once and translated `-50%`, so the
  loop is seamless with no JS and no snap. Reverse direction = the `ltr` prop.
- Hover and keyboard focus pause it (`animation-play-state`, CSS only).
  `prefers-reduced-motion` and touch fall back to a normal scrollable/swipeable
  row. No iframe or video loads — poster cards link to the real post, opened on
  click. No dependency added.

## 7. Responsive behaviour

- Grids step 3→2→1 columns at 1024 / 760.
- Horizontal rails and marquees become swipe rows on mobile.
- Nav collapses to a drawer; hero headline and safe area preserved.
- No horizontal page overflow (`overflow-x: clip` on `.site`).

## 8. Media configuration

One place each: `contact` (Instagram handle, YouTube channel, WhatsApp, profile
URLs — placeholders until verified), the category/product/social/festival/style
lists. Swapping real media or product data needs no layout change.

## 9. SEO

Page-level metadata overrides the admin defaults: absolute title, description,
canonical `/`, `robots: index`, Open Graph and Twitter cards. Semantic landmarks
(`header`/`main`/`footer`/`section` with labels), one `h1`, section `h2`s.

## 10. Performance

- Homepage First Load JS ≈ 105 kB; `/` prerenders static. Only the nav is a
  client component; every section and both marquees are server-rendered.
- No YouTube/Instagram embeds, no videos, no image originals at load — poster
  tiles and CSS gradients only. Real images will use `next/image` when added.
- Motion is CSS-first (marquee, hover, reveal); `prefers-reduced-motion`
  honoured globally.

## 11. Known placeholders (awaiting user media)

- `public/hero/hero.jpg` — the approved hero photograph.
- Category / product / film tile art — currently branded gradient placeholders.
- Delivered Work gallery — an honest empty slot; no fake client work.
- Verified `instagramProfileUrl`, `youtubeChannelUrl`, and per-item post URLs.

## 12. Next public-site milestone

Public catalogue + product experience: category pages, product detail with
visual-style selection, and the customisation → WhatsApp flow. This homepage is
architected for it (config-driven data, staged CTAs) but builds none of it.
