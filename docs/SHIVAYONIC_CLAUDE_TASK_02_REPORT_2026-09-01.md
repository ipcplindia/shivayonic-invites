# Shivayonic Claude Task 02 — Report

Date: 2026-09-01
Result: **PASS**
Branch: `claude/frontend` (started at `7aec04b`)

---

## 1. Interaction architecture

Task 01's shell was visually complete and inert. Task 02 makes it operable without
adding a single backend endpoint or fabricating a single record.

The organising decision: **every modal surface is a native `<dialog>` opened with
`showModal()`**. Focus trapping, Escape, inertness of the page behind, top-layer
stacking, and focus return to the trigger are then the platform's responsibility
rather than hand-rolled code that would get some of them subtly wrong. One hook,
`useModalDialog`, wires open/close and locks page scroll; `Dialog`, `ConfirmDialog`,
`Inspector` and `CommandPalette` are all built on it.

Two rules govern the rest:

- **Nothing reports success for work the backend has not done.** Toasts fire on real
  outcomes only — a refresh that completed, a copy that worked, a sign-out that
  failed.
- **A capability that is not connected is labelled once, quietly, in prose** — not
  with a tooltip on every dead control.

## 2. Command palette

`Ctrl/Cmd + K`, the search field in the command bar, or the compact search button on
mobile. Implemented in `src/features/admin/command-palette.tsx`.

- Searches **this client's destinations only**, permission-filtered through the same
  `visibleNavGroups` the sidebar uses. Placeholder reads "Search commands and
  destinations…"; the footer says searching media and projects arrives with their
  APIs. It never claims to search the database.
- Sections whose backend is not connected carry the same "Soon" marker as the rail.
- `ArrowUp` / `ArrowDown` move the active item and wrap; `Enter` activates; `Escape`
  closes (natively); the backdrop closes on click. Query and selection reset on each
  opening.
- Navigation is injected as an `onNavigate` prop rather than calling the router
  inside the component, which keeps `commandsFor` and `filterCommands` pure and
  directly testable.
- No command-palette dependency was added.

## 3. Dialog, confirm and inspector

`src/components/overlay.tsx`, styled in `overlay.module.css`.

| Primitive | Purpose | Notes |
|---|---|---|
| `Dialog` | General modal | Labelled by its title, dismissible close button, optional footer; `dismissible={false}` blocks Escape for a future in-flight operation |
| `ConfirmDialog` | Destructive confirmation | Cancel + committed action, `pending` state. **Foundation only — no destructive operation is wired to it.** |
| `Inspector` | Right-side detail panel | 460px panel on desktop; below 640px a full-screen sheet via `inset: 0` |

A closed dialog keeps the user agent's `display: none`; layout is applied under
`[open]` only. (This was a real defect found in the visual review — see §9.)

## 4. Feedback

`src/components/toast.tsx`. Four tones (success / info / warning / error), a
`role="status" aria-live="polite"` region, at most three at once, auto-dismiss after
5 s except errors, which wait to be dismissed. About 70 lines; no dependency.

Currently raised by: a manual media refresh (with the real count loaded, or the real
failure), the organization-identifier copy action, and a failed sign-out.

## 5. Media Library browsing

`/admin/media`, reading `GET /api/media` and `GET /api/media/[mediaId]/download`.
Nothing else.

| Control | Where it is applied | How it is described on screen |
|---|---|---|
| Status | **Server** (`?status=`) | — |
| Format | Client, loaded page | "format and filename narrow only the masters loaded here" |
| Filename | Client, loaded page | same line |
| Clear filters | Client | Appears only when a filter is set |
| Refresh | Re-issues the request | Reports the real result as a toast |
| Grid / list | Client | `aria-pressed` toggle |

The page also states plainly that it shows the 100 most recent masters, because that
is the server's fixed limit.

**Inspector.** Opening a card (or a list row) opens the read-only inspector with
status, MIME type, size, dimensions, duration, added, last updated, archived, and
whether a project is linked — all fields the list response already carries, so no
second request is made. Storage keys, paths, buckets and credentials are not in the
payload and are never reconstructed.

**Download.** A real link to `/api/media/{id}/download`, the authorised route. It is
offered only when the master is `READY`, because the route rejects anything else with
409; otherwise the inspector says so instead of showing a button that would fail.

**Preview.** Opt-in. Nothing loads until "Load preview" is pressed; then an `<img>`,
`<video controls>` or `<audio controls>` is pointed at the same authorised route.
No autoplay, explicit loading and failure states, and no URL is persisted anywhere.

**URL state.** `?view=`, `?kind=`, `?status=`, `?q=` — shareable, and back/forward
behave (writes use `router.replace(..., { scroll: false })`). Every value is narrowed
through `parseOption` against a known list; anything unrecognised is discarded.

**Local preference.** Exactly one key, `shivayonic.media.view`, holding `grid` or
`list`. Reads and writes are wrapped in try/catch and fall back to `grid` when
storage is blocked. No identity, role, permission, token or media URL is stored.

## 6. Permission behaviour

Unchanged and still centralised: `can()` over the `permissions` array issued by
`/api/me`, with navigation requirements declared once in `navigation.ts`. The command
palette reuses `visibleNavGroups`, so a STAFF member cannot navigate to Activity from
the palette any more than from the rail. No role matrix was re-created.

Server authorisation remains the only boundary: each page still redirects on a typed
URL, and each API route still re-authorises.

## 7. Live vs coming soon

One pattern, `CapabilityNote` — a single quiet line with a lock glyph, placed under
the page header — plus a neutral "Coming soon" badge in the header's action slot.
Applied to Projects, Publish, Schedule and Activity. Per-control tooltips were
removed except where the reason is permission-specific rather than
capability-specific. No banners.

Live today: navigation, command palette, the account menu and sign-out, media
browsing, media inspection, media download and preview, the settings identity and
permission views, and the copy action.

Not connected, and labelled: publishing, scheduling, project CRUD, audit reads,
notifications, media upload, organization editing, team management.

## 8. Accessibility

- Palette, dialogs and the inspector are native `<dialog>` elements: focus trap,
  Escape, inert background and focus return come from the browser.
- Page scroll is locked while any modal or the mobile drawer is open, and restored on
  close.
- `aria-haspopup="dialog"` on every control that opens one; `aria-expanded` /
  `aria-controls` on the drawer trigger; `aria-pressed` on the layout toggle;
  `aria-current="page"` on the active section.
- Toast region is a polite live region; error states keep `role="alert"`; loading
  regions keep `aria-busy`.
- The media card is a real `<button>` when it opens something, and a plain `<article>`
  when it does not — so nothing is focusable that cannot be activated.
- No keyboard trap: Escape closes the topmost surface and nothing else, and the drawer
  closes on navigation.
- Motion additions (dialog, drawer, toast entrances) are 120–240 ms and are collapsed
  by the existing global `prefers-reduced-motion` rule.

## 9. Responsive review and defects

Reviewed once at 1440, 1024 and 375 through a temporary preview route, since no
PostgreSQL instance is available to sign in against. The route was deleted afterwards.

| Width | Result |
|---|---|
| 1440 | Persistent rail, wide search trigger with `Ctrl K` hint, 460px inspector, centred dialog |
| 1024 | Compact icon rail, search trigger still present, layout intact |
| 375 | Drawer navigation, compact search icon button, palette at 336px, inspector as a full-screen sheet |

Four defects found and fixed:

1. **Closed dialogs were rendering.** `display: flex` on `.palette` and `.drawer`
   overrode the user agent's `dialog:not([open]) { display: none }`, so the palette
   and inspector were visible on page load. Layout moved under `[open]`.
2. **The inspector overflowed the right edge at 375px.** `width: 100vw` against the
   dialog's automatic margins. Replaced with `inset: 0`.
3. **The download link was underlined.** `LinkButton` renders an `<a>`; the shared
   button class now sets `text-decoration: none`.
4. **The drawer toggle appeared on tablet.** Fixed in the same pass by scoping the
   rule to `.topbar .menuButton`.

## 10. Backend contract gaps

Six, recorded in `docs/SHIVAYONIC_BACKEND_CONTRACT_REQUESTS_2026-09-01.md`: a shared
media type, an audit read endpoint, a projects API, media pagination and a `kind`
filter, a richer media detail payload, and an optional inline access route with range
support for previews. No backend file was modified.

## 11. Tests

22 new assertions across two files, plus three updated in the shell suite. 67 tests
pass in total (12 files, including the five untouched backend suites).

- `src/features/admin/interaction.test.tsx` — palette command set is permission
  filtered; "Soon" marking; query filtering; renders as a native dialog and is not
  open until `showModal()`; states honestly what it searches; dialog/confirm/inspector
  semantics and close controls; toast live region.
- `src/features/media/media-browsing.test.tsx` — URL values narrowed against a known
  list; the stored preference is a layout only, rejects junk, and survives blocked
  storage; format and filename filtering and clearing; card becomes a dialog trigger;
  inspector metadata; download uses the authorised route and no absolute or storage
  URL; download and preview withheld until `READY`; no autoplay and no media loaded
  until asked; storage internals never rendered.
- `src/components/shell/shell.test.tsx` — search is now a real palette trigger,
  notifications remain inert, the account menu links to Settings, sign-out still posts
  to `/api/auth/logout`.

## 12. Verification

Typecheck pass · Lint pass (0 problems) · Tests 67/67 · Production build pass, 20
routes, `/admin/media` First Load JS 112 kB.

## 13. Known limitations

1. A toast raised while a modal is open renders behind the dialog's backdrop, because
   the toast region is not in the top layer. No current interaction does this.
2. Media pagination does not exist; the library shows the newest 100 masters.
3. Format and filename filtering are client-side over that page.
4. The inspector shows only fields the list response already carries.
5. Video previews stream without range support, so seeking a large master re-reads
   from the start. Preview is opt-in for that reason.
6. Reviewed through a temporary preview route; the live `/admin/media` interactions
   were not exercised against real rows, as no database was available.
7. `ConfirmDialog` is foundation only — nothing destructive is wired to it.
