# Environment

Copy `.env.example` to `.env` for local development. Never commit `.env` or real credentials.

## Server-only

`DATABASE_URL`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY`, `TOKEN_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and all `ADMIN_BOOTSTRAP_*` values are server-only. They are validated by `getServerConfig()` and must never be passed to client components.

## Safe client value

`NEXT_PUBLIC_APP_URL` is the only client-safe value currently defined.

Task 01 does not require a live database or cloud-storage credential to build the application. Database commands require a valid PostgreSQL URL.

## Initial owner bootstrap

Set `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_NAME`, and `ADMIN_BOOTSTRAP_PASSWORD` in the process environment or an uncommitted `.env` file. Optionally set `ADMIN_BOOTSTRAP_ORG_NAME` and `ADMIN_BOOTSTRAP_ORG_SLUG`.

Then run:

```powershell
$env:NODE_OPTIONS="--use-system-ca"
npm run admin:bootstrap
```

The command is operations-only, has no public browser route, uses Better Auth for password handling, creates or reuses the Shivayonic organization, grants OWNER membership, and records `ADMIN_BOOTSTRAPPED`.
