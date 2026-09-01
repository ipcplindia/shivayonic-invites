# Shivayonic — Backend contract requests from the frontend

Date: 2026-09-01
Raised by: Claude Task 02 (frontend interaction foundation)
Status: requests only. No backend file was changed.

Each item states what the interface needs, what exists today, what is missing, the
smallest server change that would close the gap, and why the frontend cannot solve
it safely on its own.

---

## 1. Promote the MediaAsset summary into a shared contract

**Frontend need.** One type for the JSON the media routes return, imported by both
sides so a field rename cannot silently break the UI.

**Existing contract.** `serializeMedia` in `src/core/media-api.ts` defines the shape.
The frontend mirrors it by hand in `src/features/media/media.ts` as
`MediaAssetSummary`.

**Missing.** A shared declaration.

**Minimum change.** Move the return type of `serializeMedia` into
`src/shared/media.ts` (types only, no Prisma imports) and have `media-api.ts`
annotate its return with it. The frontend then imports that type and deletes its
mirror.

**Why not frontend-side.** Importing `src/core/media-api.ts` from a client component
would pull Prisma and the storage provider into the browser bundle. Copying the
shape is the only safe alternative, and copies drift.

---

## 2. A scoped read endpoint for the audit record

**Frontend need.** `/admin/activity` should list who did what, with filtering by
actor, action and date.

**Existing contract.** `recordSecurityAudit` writes events. There is no read route.

**Missing.** `GET /api/audit` requiring `AUDIT_READ`, scoped to the caller's
organization, returning a presentation-safe projection: actor display name, action,
entity type, a non-identifying entity label, and a timestamp.

**Minimum change.** One read route plus a serializer, in the same shape as the media
routes. No schema change is needed.

**Why not frontend-side.** The only alternative is querying the database from a
server component, which would bypass the route-level authorisation the platform
treats as authoritative and would leak internal audit columns into the UI.

**Interface state today.** Honest empty state; no rows are fabricated.

---

## 3. A projects read/write API

**Frontend need.** `/admin/projects` lists commissions, and media can be attributed
to one.

**Existing contract.** `Project` exists in the schema and `GET /api/media?projectId=`
already validates project ownership, but no project route is exposed.

**Missing.** `GET /api/projects` (requires `PROJECT_READ`) and `POST /api/projects`
(requires `PROJECT_WRITE`).

**Minimum change.** A list route returning id, name, and a stage or status. Even the
list route alone would let the Media Library replace its "Linked / Not linked"
project field with a real project name and offer a project filter, which the media
list API already supports.

**Why not frontend-side.** There is nothing to call.

**Interface state today.** Toolbar rendered and disabled, empty state explains why.

---

## 4. Pagination and sort for the media list

**Frontend need.** Browse a library larger than one page, and filter by format
server-side rather than in the browser.

**Existing contract.** `GET /api/media` returns at most 100 rows,
`orderBy: createdAt desc`, filtered by `status` and `projectId` only.

**Missing.** A cursor or offset with a total, and a `kind` filter.

**Minimum change.** Accept `cursor` and `limit` (capped server-side) and return the
next cursor; accept `kind` alongside the existing `status` filter.

**Why not frontend-side.** The frontend cannot page past a fixed server limit. Format
filtering is currently applied to the loaded page only, and the interface says so on
screen rather than implying it searched the library.

---

## 5. Media detail returns the same payload as the list

**Frontend need.** The inspector should show what the list cannot carry — a checksum,
a ready timestamp, the project's name, the uploader.

**Existing contract.** `GET /api/media/[mediaId]` returns exactly `serializeMedia`,
identical to a list row.

**Missing.** Any additional detail on the detail route.

**Minimum change.** Extend the detail route's serializer with the safe extras above.
The list serializer can stay as it is.

**Why not frontend-side.** Those fields are not in any response.

**Interface state today.** The inspector renders the row it already has, and makes no
second request, because a second request would return nothing new.

---

## 6. An inline access route for previews

**Frontend need.** Show an image, or play a video or audio master, inside the
inspector.

**Existing contract.** `GET /api/media/[mediaId]/download` authorises the caller,
requires `READY`, and either 307s to a signed URL or streams the object with
`content-disposition: attachment`.

**Missing.** Nothing blocking — media elements ignore `content-disposition`, so the
frontend uses this route directly as the preview source, and no URL is stored
anywhere.

**Minimum change (optional).** An `?disposition=inline` parameter, or a sibling
`/access` route, would make the intent explicit and allow `Range` responses so long
video can seek without downloading the whole master.

**Why it matters.** Today a video preview of a 2 GB master streams without range
support. The preview is therefore opt-in: nothing loads until the operator presses
"Load preview", and nothing autoplays.
