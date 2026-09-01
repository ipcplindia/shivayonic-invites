# Shivayonic Claude Task 03 — Full Media Library UX & Live Verification

Date: 2026-09-01
Branch: `claude/frontend`
Implementation commit: `6f060f8` (`feat(frontend): build full Media Library workflow`)
Result: **PASS** — built, statically verified, and proven against a real running
backend on live PostgreSQL.

No application code changed during live verification; every route behaved as
built. This document records the runtime proof.

---

## 1. Upload UX

- **Entry point.** A brass "Upload master" action on `/admin/media`, rendered
  only for holders of `MEDIA_WRITE`. It opens a dialog, not a separate page.
- **File picking.** A real `<input type="file" multiple>` plus a drag-and-drop
  area; the input is the primary, keyboard-operable path. `accept` is built from
  the server's own MIME allowlist.
- **Prevalidation (UX only).** Empty file, unsupported type, and over-limit size
  are caught before any request; the server re-checks all three.
- **Queue.** One row per file, each with an independent lifecycle, two uploads
  running at a time. One rejection never disturbs the others.
- **Progress.** Byte-accurate (`loaded / total`, %) from `XMLHttpRequest` — the
  only browser transport that reports upload bytes. `preparing` and `validating`
  render as an honest indeterminate bar.
- **Cancellation.** `AbortController`; the row states plainly that a
  part-uploaded record remains in the library as **Failed** until an owner
  removes it (no invented cleanup API).
- **Feedback placement.** Dialog feedback stays inside the dialog. A native
  `<dialog>` sits in the browser top layer, where no toast can follow it; the
  library toasts a single summary once the dialog closes. This resolves the
  top-layer/toast limitation recorded in Task 02.

## 2. Live API routes exercised

All against the real app on `http://localhost:3000`, real OWNER session cookie,
live PostgreSQL `shivayonic_dev` at `127.0.0.1:55432`, local storage driver.

| Route | Method | Result |
|---|---|---|
| `/api/auth/login` | POST | 200, session established |
| `/api/me` | GET | 200 — OWNER, org `shivayonic`, 7 permissions, no secret in payload |
| `/api/media` | POST | 201, `PENDING_UPLOAD`, upload target returned |
| `/api/media/:id/upload` | PUT | 200 → `UPLOADED` |
| `/api/media/:id/confirm` | POST | 200 → `READY` (server-set) |
| `/api/media?limit=50` | GET | list + `pageInfo` |
| `/api/media?kind=AUDIO` | GET | server kind filter |
| `/api/media?status=READY` | GET | server status filter |
| `/api/media?q=proof-tone` | GET | server filename search |
| `/api/media/:id` | GET | `MediaAssetDetail` |
| `/api/media/:id/download?disposition=inline` | GET | 200 + 206 Range |
| `/api/media/:id/download` | GET | 200, attachment |
| `/api/media/:id?mode=archive` | DELETE | 200 → `ARCHIVED` |
| `/api/media/:id?mode=delete` | DELETE | 204 |

## 3. Valid upload result

Two proof assets created, uploaded, and confirmed through the real create →
PUT → confirm sequence:

- `proof-tone.wav` (audio, 844 bytes) — chosen so Range/preview could be
  exercised.
- `proof-pixel.png` (1×1 image).

For each: create returned `201 PENDING_UPLOAD`; the binary PUT returned `200`
and advanced the record to `UPLOADED`; confirm returned `200` and the server —
not the frontend — set `READY`. Both then appeared in the list
(`contains wav? true`). Real progress is emitted by the transport during the
PUT; the queue advances phases from the server's answers only.

## 4. Search / filter / pagination

- **Search** `q=proof-tone` → 1 row, `proof-tone.wav`.
- **Kind** `AUDIO` → every returned row `kind === "AUDIO"`.
- **Status** `READY` → every returned row `status === "READY"`.
- **Pagination.** The live library held fewer than one page, so `hasMore` was
  `false`; the cursor append/dedup path is covered by the automated
  `mergeMediaPages` tests. No assets were manufactured merely to force a page.

## 5. Detail

`GET /api/media/:id` returned the `MediaAssetDetail` shape: id, projectId, kind,
status, originalFilename, mimeType, sizeBytes, width, height, durationMs,
createdAt, updatedAt, archivedAt, `project`, `creator`. Creator name resolved
("Owner"); project was null for the proof asset. A scan of the payload for
`storageKey`, the local storage path, `secret`, `token`, or `password` found
**nothing** — sensitive fields exposed: **NO**.

## 6. Preview + Range

Inline preview through `/api/media/:id/download?disposition=inline`:

- `content-type: audio/wav`, `content-disposition: inline`,
  `accept-ranges: bytes` — status 200.
- A `Range: bytes=0-99` request returned **206**,
  `content-range: bytes 0-99/844`, exactly 100 bytes.

The player streams natively; the whole file is never pulled into JavaScript, and
no URL is persisted. Autoplay: **off** (preview is opt-in behind "Load
preview"). Image preview path is the same authorised route; video path is
identical and Range-capable. Video kind was not separately streamed in this run
— audio exercised the identical inline+Range code path (VIDEO: N/A this run).

## 7. Download

`GET /api/media/:id/download` for the READY asset returned `200` with
`content-disposition: attachment`. The frontend links to this route; it
constructs no storage-provider URL.

## 8. Archive

Archiving the PNG returned `200`, lifecycle `ARCHIVED`, `archivedAt` set. In the
UI this is behind a `ConfirmDialog` naming the file, followed by a success toast
and a list reload; the live call confirmed the underlying transition.

## 9. Delete (owner)

Owner delete of the archived PNG returned `204`; a subsequent
`GET /api/media/:id` returned `404`. In the UI this is behind a destructive
`ConfirmDialog` naming the file. Deletion is offered only to `OWNER` (server
re-checks), and a failed delete leaves the asset in place with an in-panel
error.

## 10. Invalid upload

Two real invalid paths:

1. **Unsupported type** (`application/x-msdownload`) → create rejected `400
   INVALID_MEDIA_INPUT`. No record reached `READY`.
2. **Declared/actual size mismatch** → create `201`, but the PUT was rejected
   `413 MEDIA_SIZE_INVALID` and the server moved the record to `FAILED` — never
   `READY`. The error payload carried no storage key, no path, no stack trace.

Frontend prevalidation catches the obvious cases before a request; the server
remained authoritative in both. READY incorrectly reached: **NO**.

## 11. Cleanup

All engineering assets removed through the supported owner-delete route
(`proof-tone.wav`, `proof-pixel.png`, and the failed size-mismatch record).
A post-cleanup sweep across every status found **0** rows matching the proof
names, and the library returned to its pre-existing legitimate assets only
(`bridge-*.mp4`, `landing page.png`). Audit rows were left intact per backend
design. No legitimate asset was touched.

## 12. Accessibility

Native `<dialog>` for upload, inspector, and confirmations — focus trap,
Escape, and focus return handled by the platform. Upload has a real
keyboard-operable file button, not drop-only. Progress lives in a
`role="status" aria-live="polite"` region, updated at phase level rather than on
every percent. Filters are labelled selects; media cards and rows are real
buttons with `aria-haspopup="dialog"`.

## 13. Responsive verification

Reviewed at 1440 / 1024 / 375. At 375 the upload dialog fits, the drop area
recomposes, the format guidance stacks, and there is no horizontal overflow
(captured during implementation). The live `/login` renders correctly and
`/admin/media` redirects unauthenticated requests to `/login` ("Please sign in
to continue") — the real auth gate.

## 14. Test / build status

Unchanged since `6f060f8` and re-confirmed: typecheck PASS, lint PASS, **107
tests** pass across 15 files, production build PASS. `/admin/media` First Load JS
**118 kB**, no new dependency.

## 15. Backend contract gaps

- Existing deferred: audit-read endpoint; Projects API (so no project filter is
  surfaced).
- New this task: the upload MIME/size table is mirrored in
  `src/features/media/upload.ts` because the server's copy in `src/core/media.ts`
  pulls in `next/server`. Recommend promoting it to `src/shared`. Recorded in
  `docs/SHIVAYONIC_BACKEND_CONTRACT_REQUESTS_2026-09-01.md`.

## 16. Genuine limitations

1. Live UI-with-data was verified through the real application's authenticated
   endpoints rather than a browser-driven form login: the OWNER password is held
   privately and the environment blocks surfacing it, so a browser session could
   not be scripted. The login page render and the auth redirect were confirmed
   in the browser; every data operation was confirmed against the live routes.
2. Video streaming used the audio proof to exercise the identical inline+Range
   path; a video master was not separately uploaded.
3. Cursor "Load more" was not triggered live (library under one page); it is
   covered by unit tests.
