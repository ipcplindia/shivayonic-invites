# Shivayonic Admin + Media Production Foundation — 2026-09-02

## Source

- Source commit: `9aa15c3e57854e2783021d14afc8fc5d5440e0b5`
- Branch: `codex/admin-media-production`
- Worktree: `C:\vivaan all work 31st aug\SHIVAYONIC INVITES\admin-media-production-worktree`

## Production architecture

- Better Auth persists users and sessions in Prisma/Postgres. Public email/password signup remains disabled in the runtime auth instance.
- Admin pages redirect unauthenticated callers. Media routes re-authorize every request and scope lookups to the caller's organization.
- Production media uses the existing S3-compatible adapter and browser-to-storage presigned PUT uploads. Vercel never receives large production media bodies.
- Confirmation now accepts a `PENDING_UPLOAD` S3 record only after `HeadObject` finds an object with the exact declared byte count, then moves it directly to `READY`. Local uploads retain the existing `PENDING_UPLOAD → UPLOADED → READY` flow.
- Token encryption now uses AES-256-GCM with a versioned authenticated envelope. The key must be exactly 32 raw UTF-8 bytes or encode exactly 32 bytes as base64/base64url.

## Environment matrix

| Variable | Production | Preview | Development | Secret | Client-safe | Purpose / format |
| --- | --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | Required | Required for DB-backed preview | Required | Yes | No | `postgresql://…` |
| `BETTER_AUTH_SECRET` | Required | Required | Required | Yes | No | At least 32 characters |
| `BETTER_AUTH_URL` | Required, HTTPS | Preview HTTPS URL | `http://localhost:3000` | No | No | Canonical auth origin |
| `NEXT_PUBLIC_APP_URL` | Required, HTTPS | Preview HTTPS URL | `http://localhost:3000` | No | Yes | Browser app origin |
| `TOKEN_ENCRYPTION_KEY` | Required | Required | Required | Yes | No | 32 raw bytes or encoded 32-byte key |
| `OBJECT_STORAGE_DRIVER` | Required: `s3` | `s3` when testing media | `local` | No | No | Storage adapter selector |
| `OBJECT_STORAGE_ENDPOINT` | Required for `s3`, HTTPS | Required for `s3` | Optional | No | No | S3-compatible HTTPS endpoint |
| `OBJECT_STORAGE_BUCKET` | Required for `s3` | Required for `s3` | Optional | No | No | Private bucket name |
| `OBJECT_STORAGE_ACCESS_KEY_ID` | Required for `s3` | Required for `s3` | Optional | Yes | No | Storage credential |
| `OBJECT_STORAGE_SECRET_ACCESS_KEY` | Required for `s3` | Required for `s3` | Optional | Yes | No | Storage credential |
| `OBJECT_STORAGE_REGION` | Required/default `us-east-1` | Same | Optional | No | No | S3 region/provider value |
| `OBJECT_STORAGE_FORCE_PATH_STYLE` | Required/default `true` | Same | Optional | No | No | `true` or `false` |
| `LOCAL_MEDIA_STORAGE_PATH` | Not used | Not used with `s3` | Optional/default `.shivayonic-media` | No | No | Local development storage root |
| `ADMIN_BOOTSTRAP_EMAIL` | One-time bootstrap only | Optional | Optional | Sensitive | No | Owner email |
| `ADMIN_BOOTSTRAP_NAME` | One-time bootstrap only | Optional | Optional | Sensitive | No | Owner name |
| `ADMIN_BOOTSTRAP_PASSWORD` | One-time bootstrap only | Optional | Optional | Yes | No | 12–128 characters; never log |
| `ADMIN_BOOTSTRAP_ORG_NAME` | One-time bootstrap only | Optional | Optional | No | No | Organization name |
| `ADMIN_BOOTSTRAP_ORG_SLUG` | One-time bootstrap only | Optional | Optional | No | No | Organization slug |

Production config now rejects local storage, non-HTTPS auth/app URLs, non-HTTPS S3 endpoints, incomplete S3 credentials, and invalid token-encryption keys. Preview must use the same S3 configuration before performing media tests.

## Auth and bootstrap findings

- Session TTL is 8 hours; refresh age is 30 minutes. Production cookies use Better Auth secure-cookie mode. Better Auth defaults remain responsible for its `SameSite` policy.
- Trusted origins are the configured Better Auth URL and public app URL. Both must be HTTPS in production.
- No application signup page or application signup endpoint exists. Better Auth email/password signup is disabled outside the bootstrap script.
- Bootstrap creates the user only if absent, never resets an existing password, preserves an existing organization name, upserts exactly one owner membership, writes the bootstrap audit only when it changed state, and logs no email or password.
- Login success/failure and logout, plus create/upload/ready/archive/delete media operations, are audit-recorded without storage credentials, token keys, or signed URLs.

## Media security and upload strategy

- Storage keys are server-generated and tenant-scoped: `organizations/<org>/media/<id>/<uuid>.<extension>`.
- API callers cannot supply storage keys, organizations, lifecycle state, or uploader identity.
- Server validates MIME allowlist and declared byte limits: images 25 MiB, audio 250 MiB, video 2 GiB.
- Local uploads additionally check request content type and exact content length. S3 uploads bind the signed PUT content type and confirmation checks the stored object byte size.
- Download/preview requires `MEDIA_READ`, uses a 15-minute signed URL for S3, and local streaming supports validated single byte ranges.
- Hard delete remains OWNER-only; archive requires `MEDIA_WRITE`. Private object listing is never exposed.
- Production video upload is direct-to-object-storage. This avoids Vercel request-body limits and local disk persistence.

## Database and live proof status

- Vercel project `shivayonic/shivayonic-invites` was linked from the dedicated worktree. Production URL: `https://www.shivayonic.com`.
- Vercel production environment supplied a usable Prisma Postgres connection. `prisma migrate deploy` initially failed because the repository had no baseline migration before `20260831100000_task02_auth`.
- Added `20260830000000_initial_admin_media_foundation`, marked the failed `20260831100000_task02_auth` attempt rolled back, and redeployed the full chain.
- Production database is now up to date with 4 migrations applied.
- Vercel production environment is still missing production S3 variables and OWNER bootstrap variables, so OWNER login/logout and live media lifecycle proofs remain blocked.
- No test asset was uploaded because no production S3-compatible bucket/provider credentials are configured.

## Final live proof

| Area | Result | Notes |
| --- | --- | --- |
| Production DB migration | PASS | Applied `20260830000000_initial_admin_media_foundation`, `20260831100000_task02_auth`, `20260901000000_task03_media_library`, `20260901150000_public_catalogue`. |
| OWNER bootstrap | BLOCKED | Missing `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_BOOTSTRAP_ORG_NAME`, `ADMIN_BOOTSTRAP_ORG_SLUG`. |
| Production storage | BLOCKED | Missing `OBJECT_STORAGE_DRIVER`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY`, `OBJECT_STORAGE_REGION`, `OBJECT_STORAGE_FORCE_PATH_STYLE`. |
| Direct upload proof | BLOCKED | Requires production S3 variables and CORS. |
| Media lifecycle | BLOCKED | Requires OWNER bootstrap/login and production S3 variables. |
| Cleanup | NOT REQUIRED | No media test object or row was created. |
| Public regression | PARTIAL PASS | `/`, `/catalogue`, `/login`, `/api/health` return 200; `/admin` redirects; `/api/media` returns 401 without auth; public products API currently returns an empty product list, so no product detail page can be verified. |
| Environment status matrix | PARTIAL | Required auth/database/token names are present in Vercel; S3 and bootstrap names are missing. Vercel CLI masks `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `TOKEN_ENCRYPTION_KEY` as `[SENSITIVE]` when pulled locally. |

## Verification

- `prisma format`: pass
- `prisma validate`: pass
- `prisma generate`: pass
- `prisma migrate status`: pass — production schema up to date
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm test`: pass — 18 files, 119 tests
- Production build with pulled Vercel env: blocked locally because Vercel secret placeholders are loaded as `[SENSITIVE]`.
- Production build with safe placeholder production configuration: pass — 39 routes generated

## Task 2 blockers

1. Configure and verify production S3-compatible provider variables in Vercel.
2. Configure one-time OWNER bootstrap variables in Vercel, without pasting secrets into chat.
3. Run the bootstrap script once from a secure environment, then verify live OWNER login/logout and media lifecycle with a disposable engineering asset.
