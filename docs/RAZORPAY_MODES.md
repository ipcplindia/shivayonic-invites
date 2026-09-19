# Razorpay payment environments

LIVE support does not enable payments. `PAYMENTS_ENABLED` defaults to `false`.
This release targets `razorpay/test-integration` and Preview only. Production
configuration, keys, database and deployments remain unchanged.

## Configuration

`src/config/razorpay.ts` is the server-only authority. `RAZORPAY_MODE` must be
explicitly `TEST` or `LIVE`; credentials never choose the mode. TEST requires
an `rzp_test_` key; LIVE requires an `rzp_live_` key. Both require a nonempty
API secret and a distinct webhook secret. Preview rejects LIVE; Production
rejects TEST payment execution. Disabled deployments need no Razorpay keys.

## Isolation and authority

- New standard READY intents and OWNER-approved Custom intents store their
  environment before any provider request. Browser fields cannot choose it.
- Payment initiation, verification, status, customer access/recovery,
  webhooks, durable PAID application, and invoice retries require the stored
  environment to match the configured one. Missing/legacy environments fail
  closed; they are never silently promoted to LIVE. Create a fresh checkout
  for an old unbound Preview intent. No automatic backfill is performed.
- Order claims use `RAZORPAY_TEST_ORDER` / `RAZORPAY_LIVE_ORDER`. Webhook IDs
  use `TEST:<event>` / `LIVE:<event>` and provider reconciliation uses
  `TEST:api:<payment>` / `LIVE:api:<payment>`. Existing TEST names are preserved.
- A signed browser callback alone cannot mark PAID. A server-side provider
  fetch must prove matching payment/order IDs, organization, amount, INR,
  active environment and captured status. The result becomes a durable
  verified event, consumed by the existing transactional PAID authority.
- Webhooks verify the raw request body with the active webhook secret, then
  independently fetch the payment with the active environment's API keys.
  Authorized-only payments never reach PAID. Duplicate events cannot cause
  another PAID transition.
- Email and Zoho claims use the unique PaymentIntent ID plus its environment.
  Their saved invoice/payment references and retry behavior are retained.
  Invoice TEST labels derive from persisted mode. Accounting/email failures
  cannot reverse PAID. `ZOHO_INVOICING_ENABLED` remains the accounting switch.

The existing schema and database CHECK constraints already support both modes;
no migration or applied-migration edit is required. Capture configuration is
unchanged; only independently confirmed captured payments can be fulfilled.

Before a separately authorized production launch: review the production merge,
apply any existing pending migrations through the approved production flow,
configure LIVE-only secrets and webhook, verify with payments disabled, then
perform a controlled activation and real-payment validation. Preview must retain
TEST keys and its isolated database.
