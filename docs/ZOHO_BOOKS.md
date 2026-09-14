# Zoho Books connection

The server-only client lives in `src/lib/zoho.ts`. It uses the India DC token endpoint and Books API. Credentials are sent in the POST body and access tokens are cached in process until 60 seconds before expiry. Concurrent refreshes share one request. API requests time out after 15 seconds, do not follow redirects, and always include the configured organization ID. Failed writes are never automatically retried. A 401 invalidates the cached token for the next request.

Configure server environment variables in local `.env.local` or Vercel:

- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_API_DOMAIN=https://www.zohoapis.in` (default if omitted)
- `ZOHO_ORGANIZATION_ID`
- `ZOHO_REDIRECT_URI` (retain the existing OAuth callback value; only the initial authorization-code flow needs it, not token refresh)

The refresh token must permit reading organizations (`ZohoBooks.settings.READ`). Never use `NEXT_PUBLIC_` names for credentials.

After deploying the branch to Vercel with the existing environment variables, sign in to the app with `INTEGRATIONS_MANAGE` permission and visit `/api/integrations/zoho/test`. The app organization must match `PUBLIC_ORGANIZATION_SLUG` (defaults to `shivayonic`). Success returns only `{ "ok": true, "organizationVerified": true }`. This read-only check neither creates records nor returns organization details or tokens.

401 means sign-in is required; 403 means permission or app-organization access was denied. 503 with `ZOHO_CONFIGURATION_INVALID` means server configuration is missing or not India DC; `ZOHO_ORGANIZATION_MISMATCH` means the returned organization did not match; `ZOHO_UNAVAILABLE` means the upstream request failed (check credentials, scopes, and service availability without logging secrets).

References: [Zoho OAuth](https://www.zoho.com/books/api/v3/oauth/), [organization lookup and scope](https://www.zoho.com/books/api/v3/organizations/), [India API domain](https://www.zoho.com/books/api/v3/introduction/).
