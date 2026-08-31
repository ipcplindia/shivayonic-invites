# Shivayonic Task 03 Verification Record

## Scope

Secure master-media upload, provider-neutral object storage, and protected media-library API foundation. No publishing integration or final UI is included.

## Contract

- `POST /api/media` creates an organization-scoped `MediaAsset` and returns a local protected upload route or an S3-compatible presigned PUT target.
- `PUT /api/media/:mediaId/upload` stores local-development media outside PostgreSQL, checks the declared and actual size, verifies the object, and moves the asset to `UPLOADED`.
- `POST /api/media/:mediaId/confirm` verifies the object and moves it to `READY`.
- `GET /api/media`, `GET /api/media/:mediaId`, and `GET /api/media/:mediaId/download` require server-side session, membership, permission, and tenant scope.
- `DELETE /api/media/:mediaId` archives media. `?mode=delete` removes the object and record and is limited to OWNER.

## Storage

- Local development: filesystem storage at `LOCAL_MEDIA_STORAGE_PATH`; media bytes never enter PostgreSQL.
- Production portability: S3-compatible endpoint, bucket, credentials, region, force-path-style setting, and 15-minute signed upload/download URLs.
- Server-generated keys include organization and media IDs. Browser-provided organization, role, key, and status values are never accepted.

## Verification completed

- PostgreSQL 17.11 recovered at `127.0.0.1:55432`; Task 01, Task 02, and Task 03 migrations are applied.
- Prisma schema validation, Prisma generation, TypeScript typecheck, ESLint, tests, and production build pass.
- Authenticated OWNER proof passed: create, local upload, object verification, `UPLOADED`, `READY`, protected list/detail/download, archive, OWNER deletion, object cleanup, and audit entries.
- Tenant access is enforced by membership-derived organization scope in every media query and covered by authorization tests.

## Deliberate boundary

The API records filename, media kind, allowlisted MIME type, verified byte size, and timestamps. Transcoding, generated variants, and deeper audio/video metadata extraction remain out of scope until a later media-processing milestone.
