# Environment

Copy `.env.example` to `.env` for local development. Never commit `.env` or real credentials.

## Server-only

`DATABASE_URL`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY`, `TOKEN_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and all `ADMIN_BOOTSTRAP_*` values are server-only. They are validated by `getServerConfig()` and must never be passed to client components.

## Form and order delivery

These are read directly from `process.env` by `src/features/public/notify.ts`. They are
**deliberately not part of `getServerConfig()`**: that schema strips unknown keys rather than
rejecting them, and declaring these as required would break the three existing callers of
`getServerConfig()` whenever they are unset.

All of them are optional. When a channel's variables are absent the site does not pretend the
message was sent — `/api/public/form-submissions` and `/api/public/orders` return `502` with a
fallback that points the customer at WhatsApp, and the reason is logged server-side.

| Variable | Channel | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | Email | Resend API key. |
| `MAIL_FROM` | Email | Must be on a domain verified in Resend, e.g. `Shivayonic Invites <orders@shivayonic.com>`. |
| `WHATSAPP_TOKEN` | WhatsApp | Meta WhatsApp Cloud API token (System User, permanent). |
| `WHATSAPP_PHONE_ID` | WhatsApp | Phone Number ID of the registered **sender** number. |
| `WHATSAPP_TEMPLATE` | WhatsApp | Name of the approved template. Without it no WhatsApp send is attempted. |
| `WHATSAPP_LANG` | WhatsApp | Template language code. Defaults to `en`. |

Email is the system of record — it carries the complete form — so a submission counts as
delivered only when the **email** succeeds. WhatsApp is a best-effort one-line alert.

WhatsApp messages here are always business-initiated, so Meta permits them only through an
approved template, and template parameters may not contain newlines. That is why the WhatsApp
payload is a flattened summary while the full form goes by email. The sender number is
consumed by the API: it can no longer be used in the normal WhatsApp app, and it cannot also
be one of the recipients in `formRecipients` (`src/features/public/data.ts`).

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
