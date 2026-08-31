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
- The current permissions are ORGANIZATION_MANAGE, MEMBERS_MANAGE, PROJECT_READ, PROJECT_WRITE, MEDIA_READ, MEDIA_WRITE, and AUDIT_READ.
- The owner bootstrap command provisions the first OWNER without a public registration route and records `ADMIN_BOOTSTRAPPED`.
- Login abuse protection exists at two current layers: Better Auth rate limiting and a small in-memory application throttle on `/api/auth/login`.

## Planned, not implemented

MFA/passkeys, enterprise SSO, customer authentication, account recovery workflows, upload content inspection, signed cloud URLs, social OAuth, encrypted social-token storage, security headers, HSTS, WAF/CDN controls, secret rotation, backups, production edge WAF/CDN rate limits, and production monitoring are future milestones.

`npm audit` currently reports transitive advisories in Next/Prisma dependency paths with no safe fix available from npm. Do not use `npm audit fix --force` without a deliberate dependency review.

## Trust boundaries

The browser is untrusted. API handlers validate input and authorize against server-side identity and organization membership. PostgreSQL and object storage are server-side dependencies. External platforms are untrusted integration boundaries; their SDK responses will be mapped into internal contracts.

## Upload threat model

Future upload endpoints must enforce authenticated authorization, size/type limits, content inspection, non-executable object keys, and short-lived signed operations. Client MIME claims alone are insufficient.

## Logging policy

Never log passwords, access/refresh tokens, private keys, authorization headers, payment credentials, or avoidable sensitive media URLs.
