# Shivayonic media contract bridge — 2026-09-01

## Shared contract

`src/shared/media.ts` is the application-facing contract for frontend and backend. It defines media kind/status, summary/detail assets, list request/response and pagination, access, create, complete, and archive responses. It contains no Prisma, storage SDK, path, credential, or auth types.

`MediaAssetSummary` is used by list/create/update responses. `MediaAssetDetail` adds only safe persisted relationship summaries: `project` (`id`, `name`) and `creator` (`id`, `name`). Storage keys, local paths, credentials, sessions, and database-only relationships are never serialized.

## List contract

`GET /api/media` returns:

```json
{ "media": [], "pageInfo": { "nextCursor": "opaque-or-null", "hasMore": false } }
```

Ordering is `createdAt desc, id desc`. `limit` defaults to 50 and is capped at 100. `cursor` is opaque and supplies deterministic continuation. Supported filters, applied before paging: allowlisted `kind` (`VIDEO`, `IMAGE`, `AUDIO`, `DOCUMENT`), existing `status`, `projectId`, and case-insensitive `q` filename contains search. `q` is trimmed and limited to 120 characters. A project filter is validated inside the authenticated organization; inaccessible projects return the existing safe not-found response.

## Detail and access

`GET /api/media/:id` returns `MediaAssetDetail`. It requires `MEDIA_READ` and resolves the asset through the caller's organization, so foreign IDs receive a safe 404.

Use `GET /api/media/:id/download?disposition=inline` as the media-element preview URL. Local storage streams without buffering whole files and supports one valid `Range` request with `206`, `Accept-Ranges`, `Content-Range`, and exact content length. Invalid or out-of-bounds ranges return `416` with `Content-Range: bytes */size`. Omit `disposition=inline` for attachment download.

For S3-compatible storage, the route first authorizes then redirects to a 15-minute signed object URL. Browser-native Range requests are handled by the provider. No signed URL is stored in the database.

## Security

All list, detail, preview, and download requests require server-enforced `MEDIA_READ`. Every media and project lookup is organization scoped. The request accepts a media ID only; never a storage key. Responses never disclose provider credentials or raw local paths.

## Frontend guidance

Import types from `@/shared/media`. Read `pageInfo.nextCursor` to load another page; send active kind/status/project/query filters with each request. Fetch a detail record when opening the inspector. Use the inline download URL for an opted-in image/audio/video preview and let the browser issue Range requests.

## Deferred requests

- Scoped audit-read endpoint.
- Projects API / Project CRUD.

These are not required for the Media Library contract bridge.

## Fresh cross-tenant verification — 2026-09-01

Temporary Organization A/B fixtures were created against the development database. As an authenticated Organization A owner, base list, `kind`, `status`, filename search, project filter, cursor continuation, and a tampered opaque cursor returned only Organization A data. Organization B's distinctive filename and media ID never appeared.

Organization B detail, attachment download, inline preview, and Range requests all returned tenant-safe `404` responses. No metadata, signed URL, bytes, or `Content-Range` leaked. Temporary media, project, tenant, and user records were removed; audit evidence was preserved.
