# ADR-006: Better Auth for Private Admin Authentication

## Decision

Use Better Auth for Shivayonic private administrator authentication.

## Why it fits

Better Auth supports Next.js route handlers, server-side sessions, secure cookie handling, Prisma/PostgreSQL adapters, email/password authentication, disabled public sign-up, built-in rate limiting, and future MFA/passkey extension paths.

## Alternatives considered

Auth.js was considered, but email/password credentials would require more application-owned password hashing and verification decisions. A custom auth implementation was rejected because Task 02 explicitly forbids custom password hashing, token generation, and cookie signing. Hosted identity providers were deferred because Shivayonic first needs a private internal foundation without enterprise SSO complexity.

## Session model

Sessions are stored server-side in PostgreSQL through Prisma. Better Auth manages session tokens and HttpOnly cookies. Application code consumes sanitized identity context rather than raw session records.

## Password handling

Passwords are submitted only to Better Auth endpoints or server-side bootstrap logic. The application does not store plaintext passwords and does not implement hashing or verification.

## Future path

MFA/passkeys and enterprise SSO can be added through Better Auth-compatible plugins or provider configuration in later milestones.

## Tradeoffs

Better Auth introduced an npm optional peer-resolution conflict related to SvelteKit/Vite in this Next-only application. It was installed with npm legacy peer resolution, while keeping the application on Next.js and Vitest.
