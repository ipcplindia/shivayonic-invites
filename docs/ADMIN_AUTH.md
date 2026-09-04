# Admin Authentication

The Shivayonic Command Center is private. Public self-registration is disabled.

## Implemented now

- Better Auth email/password authentication.
- Better Auth PostgreSQL sessions through Prisma.
- Server-side session checks for `/admin` and `/api/me`.
- `OWNER`, `ADMIN`, and `STAFF` roles through `OrganizationMember`.
- Centralized permissions in `src/auth/permissions.ts`.
- Server authorization helpers in `src/auth/context.ts`.
- Tenant checks in `src/auth/organization-access.ts`.
- Canonical login at `/admin/login`; `/login` redirects there.
- Internal-only post-login redirects, generic credential errors, database-backed throttling, and explicit public-signup denial.
- Sanitized current identity at `GET /api/me`.
- Operations-only owner bootstrap through `npm run admin:bootstrap`.

## Owner bootstrap

Set the required server-only environment values:

```text
ADMIN_BOOTSTRAP_EMAIL=<owner-email>
ADMIN_BOOTSTRAP_NAME=<owner-name>
ADMIN_BOOTSTRAP_PASSWORD=<owner-password>
ADMIN_BOOTSTRAP_ORG_NAME=Shivayonic
ADMIN_BOOTSTRAP_ORG_SLUG=shivayonic
```

Then run:

```powershell
npm run admin:bootstrap
```

The command does not print credentials. It creates or finds the User, creates or updates the Organization, grants OWNER membership, and writes an `ADMIN_BOOTSTRAPPED` audit event.

## Frontend contract

Frontend code should consume `GET /api/me` and shared types from `src/shared/auth.ts`. It should not depend on Better Auth table names, cookie names, session tokens, password fields, or Prisma internals.

## Not implemented yet

MFA/passkeys, enterprise SSO, customer login, social OAuth, and account recovery remain future work. Do not show a recovery link until expiring single-use delivery is configured.
