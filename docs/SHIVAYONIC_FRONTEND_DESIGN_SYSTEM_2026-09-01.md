# Shivayonic Command Center — Frontend Design System

Date: 2026-09-01
Branch: `claude/frontend`
Scope: admin interface (`/admin/*`) and the sign-in surface (`/login`).

---

## 1. Design principles

1. **The tool disappears into the task.** The Command Center is an operating platform, not a
   showcase. Familiar affordances, standard controls, dense where density helps.
2. **Restraint carries the luxury.** Premium reads as material quality and precision, not as
   ornament. One accent, used rarely, is more expensive-looking than five.
3. **Say what is true.** Nothing in the interface pretends to work. Unbuilt capabilities are
   labelled, disabled, and explained; no metric is invented.
4. **The interface never leaks the machine.** No storage keys, paths, tokens, traces or internal
   identifiers reach the browser.
5. **Permission-aware, not permission-enforcing.** The UI hides what the operator cannot use so
   they are never offered a dead control; the server remains the only authority.

## 2. Visual direction — "Lacquer & Brass"

The surface is a warm near-black lacquer: the inside of a film can, the lid of a polished
instrument, not the neutral grey of a generic dashboard. Two accents do two separate jobs and are
never swapped:

- **Brass (champagne gold)** — brand and commitment. The wordmark, the single primary action on a
  view, the active section's hairline, the one brand rule. Nowhere else.
- **Signal (a desaturated periwinkle)** — system and interaction. Focus rings, links, in-flight
  state. Cool against the warm ground, which is what gives the palette its tension.

Explicitly rejected: navy-and-gold, purple-royal, terminal-neon, metallic gradients,
glassmorphism, and any decorative use of either accent.

## 3. Color tokens

Authored in OKLCH so the ramps stay perceptually even. All tokens live in
[`src/styles/tokens.css`](../src/styles/tokens.css); components never hard-code a color.

| Role | Token | Value |
|---|---|---|
| App background | `--surface-canvas` | `oklch(0.145 0.008 35)` |
| Navigation rail | `--surface-rail` | `oklch(0.125 0.008 30)` |
| Card / panel | `--surface-panel` | `oklch(0.185 0.008 40)` |
| Hover / raised | `--surface-raised` | `oklch(0.225 0.009 40)` |
| Input well | `--surface-sunken` | `oklch(0.165 0.008 35)` |
| Menu / overlay | `--surface-overlay` | `oklch(0.205 0.009 40)` |
| Hairline (soft / base / strong) | `--line-soft` `--line` `--line-strong` | `L 0.26 / 0.31 / 0.40` |
| Text primary | `--text-primary` | `oklch(0.95 0.008 80)` |
| Text secondary | `--text-secondary` | `oklch(0.78 0.008 72)` |
| Text muted | `--text-muted` | `oklch(0.66 0.008 64)` |
| Text faint | `--text-faint` | `oklch(0.56 0.008 60)` |
| Brass | `--brass` / `--brass-bright` / `--brass-deep` | `L 0.78 / 0.87 / 0.62, C ~0.09, H ~85` |
| Signal | `--signal` / `--signal-bright` / `--signal-deep` | `L 0.70 / 0.81 / 0.50, C ~0.09, H ~272` |
| Success / Warning / Danger | `--success` `--warning` `--danger` | `H 155 / 62 / 27` |

Tints (`--brass-tint`, `--signal-tint`, `--success-tint`, …) are `color-mix` derivations, so a
change to a base color propagates.

**Contrast.** Against `--surface-canvas`: primary ≈ 18:1, secondary ≈ 9.9:1, muted ≈ 6.4:1 — all
above 4.5:1 for body text. `--text-faint` (≈ 4.2:1) is reserved for decorative labels, disabled
controls and non-essential metadata, never for body copy. Brass as a button fill against
`--text-on-brass` is ≈ 9.9:1.

**Color is never the only channel.** `StatusBadge` changes *dot shape* as well as tone —
solid (settled), hollow (in progress), square (terminal / inert) — so state survives a
colour-blind operator or a projector.

## 4. Typography

Two families on a genuine contrast axis, loaded through `next/font` (self-hosted, no runtime
request, no layout shift).

| Family | Token | Used for |
|---|---|---|
| Instrument Serif 400 | `--font-display` | Wordmark, page titles (`h1`). Nothing else. |
| Geist | `--font-ui` | All UI: headings below `h1`, body, labels, buttons, tables. |
| Geist Mono | `--font-mono` | Identifiers, sizes, durations, slugs, timestamps. |

The serif is deliberately kept out of labels, buttons and data — a display face in a control is a
product-UI failure, not a flourish.

Fixed rem scale (not fluid — an admin is viewed at consistent DPI), ratio ≈ 1.15–1.2:

| Token | Size | Role |
|---|---|---|
| `--text-display` | 34px | Reserved for future full-bleed surfaces |
| `--text-title` | 26px | Page title (serif) |
| `--text-section` | 17px | Section heading |
| `--text-card` | 15px | Card heading |
| `--text-body` | 14px | Body, page lede |
| `--text-body-sm` | 13px | Dense body, controls, table cells |
| `--text-label` | 12px | Form labels, table headers |
| `--text-meta` | 11px | Metadata, badges |

Line heights: `--leading-tight` 1.15 (headings), `--leading-snug` 1.35, `--leading-normal` 1.55.
Prose is capped: page lede at 68ch, empty-state body at 46ch.

## 5. Spacing, radius, elevation, motion

- **Spacing** — 4px base: `--space-1` … `--space-16` (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
  Rhythm is varied deliberately: 20px inside cards, 24px between cards, 32px between page regions.
- **Radius** — `--radius-sm` 4px (dots, badges), `--radius-md` 6px (controls, buttons),
  `--radius-lg` 10px (cards, panels), `--radius-pill` (avatar). Engineered, never toy-round.
- **Elevation** — depth comes from hairlines first, shadow second. `--shadow-sm/md/lg`; only
  genuinely floating surfaces (user menu, mobile drawer, sign-in panel) carry `--shadow-lg`.
- **Z-index** — a named scale, no arbitrary values: dropdown 100, sticky 200, backdrop 300,
  modal 400, toast 500, tooltip 600.
- **Motion** — `--duration-fast` 120ms (hover/colour), `--duration-base` 180ms,
  `--duration-slow` 240ms (drawer), all on `--ease-out` (`cubic-bezier(.22,1,.36,1)`). Motion only
  conveys state: hover, focus, drawer, skeleton. No page-load choreography, no bounce.
  `prefers-reduced-motion: reduce` collapses every transition and replaces the skeleton shimmer
  with a flat fill.

## 6. Component conventions

Primitives live in [`src/components/ui.tsx`](../src/components/ui.tsx) with one shared stylesheet,
[`ui.module.css`](../src/components/ui.module.css) — one file so the vocabulary is literally in one
place. Shell components are in `src/components/shell/`.

| Component | Notes |
|---|---|
| `Button` | `primary` (brass — **one per view**), `secondary`, `ghost`, `danger`; sizes sm/md/lg. Defaults to `type="button"`. |
| `IconButton` | Requires a `label`; renders both `aria-label` and `title`. |
| `Card` / `CardHeader` / `CardBody` | Never nested. |
| `Badge` / `StatusBadge` | Tone + dot shape. |
| `Input` / `SearchInput` / `Select` | Always labelled; label may be visually hidden, never absent. |
| `EmptyState` | Teaches the section — what will appear here and when. |
| `ErrorState` | `role="alert"`, operator-facing copy, and a retry action. |
| `Skeleton` | Loading is skeletons, not spinners. |
| `DataTable` | Generic, `scope="col"` headers, hidden `<caption>`, horizontal scroll container. |
| `PageHeader` / `SectionHeader` / `BrassRule` | Page furniture. |
| `MediaCard` | Operator-facing metadata only. |
| `PermissionGate` | Declarative wrapper over `can()`. |

Every interactive component ships default, hover, focus-visible, active and disabled states.
Icons are one system: [`src/components/icon.tsx`](../src/components/icon.tsx), a 24px grid at
1.5px stroke, inline so the bundle carries only the glyphs used. No icon dependency, no emoji.

## 7. Responsive behaviour

One component system, three structural states — no duplicated mobile pages, no fluid type.

| Width | Rail | Top bar |
|---|---|---|
| ≥ 1181px | Persistent 260px rail with labels and group headings | Full: breadcrumb, search, tools, identity |
| 861–1180px | Compact 72px rail, icons only, `title` tooltips | Full |
| ≤ 860px | Off-canvas drawer with scrim, opened from the bar, closed by Escape, backdrop, or navigating | Current page only; search hidden, identity reduced to the avatar |

The drawer is driven by `data-open` on the rail rather than a second class, so the open state
always outranks the closed default regardless of stylesheet order. Content grids collapse at
1100px; media uses `repeat(auto-fill, minmax(232px, 1fr))` and needs no breakpoint at all.

## 8. Accessibility

- Skip link to `#command-center-main`, visible on focus.
- Landmarks: `header`, `nav aria-label`, `main`, `section aria-label`/`aria-labelledby`.
- `aria-current="page"` on the active section; `aria-expanded` + `aria-controls` on the drawer
  trigger; `aria-pressed` on the layout toggle.
- Visible focus ring everywhere (`2px` signal, `2px` offset) — never removed.
- Touch targets: 36px minimum for controls, 44px for drawer navigation rows.
- Loading regions carry `aria-busy`; error states carry `role="alert"`.
- Meaning is never colour-only (see `StatusBadge`).
- Every input has a label; hidden labels use `hidden`, not `display:none` on a `span`.
- `prefers-reduced-motion` honoured globally.

## 9. Permission-aware UI

One helper, [`src/features/access.tsx`](../src/features/access.tsx):

```ts
can(context, "MEDIA_WRITE")
canAny(context, ["ORGANIZATION_MANAGE", "MEMBERS_MANAGE"])
<PermissionGate context={context} permission="AUDIT_READ">…</PermissionGate>
```

`context` is the `CurrentUserContext` from `src/shared/auth.ts`, resolved server-side once in
`src/app/admin/layout.tsx`. **No role matrix is duplicated on the client** — the helper only reads
the `permissions` array the server issued. Navigation requirements are declared once, in
[`src/features/admin/navigation.ts`](../src/features/admin/navigation.ts).

This is a convenience layer. Every API route re-authorises independently, and a user who types a
URL directly is redirected by the page and rejected by the API regardless.

## 10. Ownership boundary

| Claude (frontend) | Codex (backend) |
|---|---|
| `src/styles/`, `src/components/`, `src/features/`, `src/app/admin/`, `src/app/login/` | `prisma/`, `src/auth/`, `src/core/`, `src/db/`, `src/config/`, `src/app/api/` |
| Design tokens, shell, primitives, states, UX copy | Schema, sessions, RBAC, permissions, tenant isolation, storage, upload lifecycle, audit |

The frontend consumes `src/shared/*` types and the existing HTTP routes. It does not import Prisma
models, touch cookies, or re-implement authorisation.

### Documented backend requirements

These are requests, not changes — nothing in the backend was modified.

1. **Promote the media serialisation shape into `src/shared/media.ts`.** The frontend currently
   mirrors `serializeMedia` in `src/features/media/media.ts` to avoid importing a backend module.
   A shared type would remove the duplication.
2. **A scoped audit read endpoint** (actor, action, entity type, timestamp — no raw rows) so
   `/admin/activity` can show real data.
3. **A projects read/write API** so `/admin/projects` can leave its empty state.
4. **A cheap counts endpoint** if the overview should ever show totals; the interface will not
   display a number it cannot source.

## 11. Interaction conventions (added in Task 02)

Every modal surface is a native `<dialog>` opened with `showModal()`: focus trap,
Escape, background inertness, top-layer stacking and focus return come from the
platform. Layout for these surfaces is declared under `[open]` only, so a closed
dialog keeps the user agent’s `display: none`. Page scroll is locked while any modal
or the mobile drawer is open.

| Primitive | File | Role |
|---|---|---|
| `Dialog` / `ConfirmDialog` | `src/components/overlay.tsx` | Modal work and destructive confirmation |
| `Inspector` | same | Right-side detail panel; full-screen sheet below 640px |
| `CommandPalette` | `src/features/admin/command-palette.tsx` | Ctrl/Cmd + K; searches this client’s destinations only |
| `ToastProvider` / `useToast` | `src/components/toast.tsx` | Four tones, polite live region, errors persist |
| `CapabilityNote` | `src/components/ui.tsx` | The single way to say “not connected yet” |
| `LinkButton` | `src/components/ui.tsx` | Button shape for real navigations and downloads |

No new colour tokens were needed; interaction states reuse `--surface-raised`
(hover), `--surface-panel` (pressed), `--brass-hairline` (selected) and
`--surface-scrim` (overlay backdrop).

**Coming-soon pattern.** One `CapabilityNote` under the page header plus a neutral
“Coming soon” badge in the header action slot. Not a tooltip on every dead control,
and never a banner.

**URL and storage discipline.** Shareable view state lives in the query string
(`view`, `kind`, `status`, `q`) and every value is narrowed against a known list
before use. `localStorage` holds exactly one key, `shivayonic.media.view`, containing
a layout preference; reads and writes are wrapped in try/catch. No identity, role,
permission, token or media URL is ever stored.

**Motion.** Dialog and toast entrances 180 ms, drawer 240 ms, all `--ease-out`, all
collapsed by the global reduced-motion rule.
