# Shivayonic — Media Contract Bridge, frontend integration

Date: 2026-09-01
Gate: Integration Gate 01 — no new features
Branch: `claude/frontend`

---

## Starting point

Frontend starting commit: `4abb9f4` (`docs(frontend): record Claude Task 02 interaction foundation`).
Baseline tag `shivayonic-task03-verified` at `d4c8ee5`, unmoved.

## Codex commits integrated

Cherry-picked onto `claude/frontend`, in order, without squashing or rewriting:

| Codex commit | Applied as | Message |
|---|---|---|
| `a3fbd01` | `346fe8d` | `feat(media): harden shared media contracts and preview access` |
| `d6ab277` | `ef3e3ab` | `docs(media): record fresh cross-tenant bridge verification` |

The `codex/backend` branch was **not** merged, and neither was `master`.

## Conflicts encountered

**None.** Both cherry-picks applied cleanly.

The expected collision did not occur as a Git conflict because the frontend's mirror
lived in `src/features/media/media.ts`, a file Codex never touched, while the new
contract arrived as a new file, `src/shared/media.ts`. The conflict was therefore
semantic rather than textual: two declarations of the same payload, and a frontend
carrying assumptions the server no longer holds.

Resolution was to make the shared contract the sole authority and delete the mirror,
then correct every assumption that the hardened routes invalidated.

## Shared contract now consumed

Canonical file: `src/shared/media.ts` (types only; no Prisma, no storage internals).

Removed from `src/features/media/media.ts`:

- the hand-written `MediaAssetSummary` mirror;
- the hand-written `MediaListResponse` (which had no `pageInfo`);
- `filterMedia`, the client-side kind and filename filter — both are now server work;
- the hard-coded status and kind filter lists.

What that file keeps is presentation only: status tone and dot shape, kind icons,
byte/duration/date formatting, error-code copy, the view-mode preference, and the
list-query builder. It re-exports `MediaAssetSummary`, `MediaAssetDetail`,
`MediaKind`, `MediaStatus`, `MediaListResponse` and `MediaPagination` from the shared
module so UI files have one import to reach for, and adds `MediaAsset` as the union of
summary and detail.

Filter option lists are now derived from `Record<MediaKind, string>` and
`Record<MediaStatus, string>` label maps, so adding a member to the shared contract
fails the build until the interface names it. `DOCUMENT` — new in the contract — was
picked up this way and given a label and an icon.

Imports updated in `media-client.tsx`, `media-inspector.tsx` and
`media-browsing.test.tsx`. The test file imports the contract from `@/shared/media`
directly, which is what proves the mirror is gone.

## Media list compatibility

**Paginated response.** `useMediaList` reads `{ media, pageInfo }` and keeps
`pageInfo` in state. It requests `limit=50` (the server's default; its cap is 100).
Per the gate, no paging UI was built — the first page is rendered, and the on-screen
note now reads *"Showing the first 50 matching masters, newest first. More remain —
paging through them arrives with the full Media Library"* when `pageInfo.hasMore` is
true. `nextCursor` is carried but not yet followed.

**Kind.** Now sent as `?kind=`. The client-side kind filter is deleted, and the copy
claiming format filtering was local is gone.

**Status.** Unchanged in behaviour, now validated against the shared `MediaStatus`.

**Filename query.** Now sent as `?q=` and matched by the server across the whole
organization. The old wording — "filename narrows only the masters loaded here" — was
removed because it is no longer true. Because each keystroke would otherwise be a
request, the field is typed into local state and settles into the URL after 250 ms.
The value is clamped to 120 characters, the length the route accepts.

**Project filter.** Supported by the route, not surfaced: there is still no projects
API to populate a picker. `projectId` is not sent.

## Detail and preview

**Detail contract.** `MediaAssetDetail` is consumed. The inspector accepts
`MediaAssetSummary | MediaAssetDetail` and renders the richer fields — the project's
name and the uploader — only when they are present, falling back to "Linked" /
"Not linked to a project" for a summary row. No type is widened or asserted to make
this work, so no type lie is introduced. Per the gate, the inspector still opens from
the row already loaded; fetching `GET /api/media/:id` on open is Task 03.

**Inline preview.** Now requests `/api/media/{id}/download?disposition=inline`, the
parameter the hardened route added, so the response streams inline with
`accept-ranges: bytes` instead of being offered as an attachment. Range support is the
server's; the frontend simply uses the authorised route. Preview remains opt-in — no
media element is created until "Load preview" is pressed — and nothing autoplays.

**Download.** Unchanged: a link to `/api/media/{id}/download`, offered only when the
master is `READY`, because the route still rejects anything else with 409.

**Range-capable route preserved.** No change was made to the route, the disposition
handling, the signed-URL path, the 416 behaviour or the storage layer.

No storage URL is constructed client-side, and no signed URL is written to
`localStorage`, `sessionStorage`, the query string or any other persistent state. The
only key stored remains `shivayonic.media.view`, holding `grid` or `list`.

## Tests

76 pass across 13 files (up from 70 after the cherry-picks, which brought Codex's own
`media-list` and `media` suites with them).

Rewritten or added in `media-browsing.test.tsx`:

- the contract is imported from `@/shared/media`, not mirrored;
- `buildMediaListQuery` sends kind, status, q and limit, omits blanks, and carries a
  cursor;
- the kind and status lists match the shared contract exactly, including `DOCUMENT`,
  and reject unknown values from the URL;
- a `MediaListResponse` literal with `pageInfo` type-checks and round-trips, in both
  the has-more and exhausted cases;
- the inspector prefers the detail contract's project name and uploader, and still
  renders no internal identifier;
- unchanged and still passing: download targets the authorised route and no absolute
  or storage URL; download and preview withheld until `READY`; no autoplay; storage
  internals never rendered; the view preference is a layout only and survives blocked
  storage.

`shell.test.tsx`, `interaction.test.tsx`, `navigation.test.ts` and `access.test.ts`
were not touched and still pass, which is the regression check on the command palette,
navigation, permissions and the responsive shell.

## Quality gates

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npx eslint .` | Pass, 0 problems |
| `npx vitest run` | 76/76, 13 files |
| `npx next build` | Pass; `/admin/media` First Load JS 113 kB |
| Visual check | Grid renders, list toggle intact, inspector shows the new project and uploader fields with no visual regression |

No migration was run. No schema change was made.

## One frontend file outside the media feature

`eslint.config.mjs` — the browser-globals block now covers
`src/features/**/*.{ts,tsx}` rather than `.tsx` only, and adds `clearTimeout`, because
the query builder and the debounce live in a `.ts` module. Backend lint rules are
unchanged.

## Readiness for Claude Task 03

Ready. The frontend compiles against the hardened contract, sends every filter the
server supports, and understands the cursor page.

What Task 03 inherits as its actual work: paging through `nextCursor`, a project
filter once a projects API exists, fetching `MediaAssetDetail` when the inspector
opens, and the upload workflow.
