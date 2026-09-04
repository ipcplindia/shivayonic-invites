# Security Foundation

## Implemented now

- Server and client configuration are separated in `src/config/env.ts`; server values are not exposed through client configuration.
- Required server configuration is validated with Zod when `getServerConfig()` is called.
- Media records store object keys and metadata; media bytes are not stored in PostgreSQL.
- The health response contains only status, service, and timestamp.
- AuditLog has structured metadata, with a policy that secrets must not be placed there.
- No credentials or production secrets are committed; `.env.example` contains placeholders only.
- Private administrator authentication uses Better Auth with server-side PostgreSQL-backed sessions.
- Public sign-up is disabled in the application auth configuration.
- Internal access requires server-resolved OrganizationMember membership and centralized OWNER/ADMIN/STAFF permissions.
- OWNER/ADMIN/STAFF permissions are deny-by-default and enforced in server routes through `requirePermission`/`requireRole`.
- The owner bootstrap command provisions the first OWNER without a public registration route and records `ADMIN_BOOTSTRAPPED`.
- Better Auth, login, and privileged-mutation rate limits use atomic PostgreSQL counters; no process-local limiter is treated as a production control.
- Unsafe cross-origin API mutations and public sign-up paths are rejected before routing.
- Production responses include CSP, HSTS, framing, MIME-sniffing, referrer, permissions, and opener protections.
- S3 uploads use staging keys. Confirmation copies the verified B2 object version to a new final key before READY, so the original presigned capability cannot change READY bytes.

## Planned, not implemented

MFA/passkeys, enterprise SSO, customer authentication, account recovery workflows, byte-level upload inspection/malware scanning, backups, and production monitoring remain future milestones.

## PostgreSQL row-level security

RLS is not enabled. The application uses one pooled Prisma database role for Better Auth, public reads, tenant operations, bootstrap, and migrations. That role has no transaction-scoped tenant identity, and pooled/serverless connections make session-level tenant variables unsafe. Enabling policies now would either be bypassed by the table-owning role or risk cross-request tenant leakage/availability failures.

Current enforcement is server-side membership resolution plus organization predicates on every private resource query, backed by negative cross-organization tests. Safe RLS adoption requires separate migration/auth/public/application roles and transaction-scoped `SET LOCAL` tenant context on a dedicated transaction for each tenant operation; then `FORCE ROW LEVEL SECURITY` policies can be tested before production.

`npm audit` currently reports transitive advisories in Next/Prisma dependency paths with no safe fix available from npm. Do not use `npm audit fix --force` without a deliberate dependency review.

## Trust boundaries

The browser is untrusted. API handlers validate input and authorize against server-side identity and organization membership. PostgreSQL and object storage are server-side dependencies. External platforms are untrusted integration boundaries; their SDK responses will be mapped into internal contracts.

## Upload threat model

Future upload endpoints must enforce authenticated authorization, size/type limits, content inspection, non-executable object keys, and short-lived signed operations. Client MIME claims alone are insufficient.

## Logging policy

Never log passwords, access/refresh tokens, private keys, authorization headers, payment credentials, or avoidable sensitive media URLs.
