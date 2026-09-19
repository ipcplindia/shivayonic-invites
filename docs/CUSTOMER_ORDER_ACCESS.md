# Customer order access

Checkout returns `/order/<enquiryId>#access=<random capability>`. The fragment
survives bookmarks and email forwarding between devices but is not sent in HTTP
request URLs. The client sends it to the rate-limited order API in a POST body.
Never log those request bodies or enable analytics/session replay on these pages.

Only SHA-256 hashes are persisted. PaymentIntent remains the payment authority.
Custom enquiries without an intent use the existing Verification table for an
order-only capability. Approval replaces it with a PaymentIntent capability.
`PAYMENT_LINK_EXPIRY_DAYS` defaults to 30 (allowed 7–90). Every approval and OWNER
resend issues a new capability. Old links stop working. PAID links can display
the receipt state, but the existing server payment gate rejects repeat payment.

Submission and approval send customer email through the existing Resend sender
(`RESEND_API_KEY`, `MAIL_FROM`). Delivery failure does not undo persistence.
OWNER can resend from a READY order. Preview additionally exposes a private test
link to OWNER only. Idempotent checkout replays do not reveal or regenerate tokens;
the customer recovers through email sign-in or the studio's resend action.

Preview mail links use VERCEL_BRANCH_URL, falling back to VERCEL_URL; production
uses NEXT_PUBLIC_APP_URL. No request Host value determines the emailed origin.

`/account` verifies email with a random, single-use 15-minute link. The separate
customer session expires after 30 days and uses an HttpOnly, SameSite=Strict,
Secure-on-HTTPS cookie. Existing Verification rows store hashed tokens and scoped
email identity. No User, Session or OrganizationMember is created. This separation
prevents a customer email link from becoming an admin Better Auth session.
My Orders filters by verified email and canonical organization, never typed email.

No schema migration or production environment change is required. Customer links
and account routes disable analytics and use no-referrer/no-store/noindex headers.
Preview payment remains TEST-only; captured, verified provider events alone mark PAID.

## Preview check

As OWNER, open the existing READY order and choose Resend payment link, then
TEST MODE — Open payment link. Refresh, reopen in another browser, complete a
Razorpay test checkout, and verify the webhook advances PAID. Reopen the link to
confirm Payment received with no pay action. Check real email delivery separately;
the Preview test link does not prove Resend delivery.
