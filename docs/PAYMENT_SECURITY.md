# Payment security foundation

Payments are disabled by default (`PAYMENTS_ENABLED=false`). This repository has no Razorpay API calls, checkout widget, provider keys in client code, card fields, payment-success UI, or production payment deployment.

## Checkout trust model

`POST /api/public/orders` accepts an anonymous commission enquiry, not money. The browser supplies only validated customer/detail fields, a design snapshot, a plan identifier, and an `Idempotency-Key`. It cannot submit a price, amount, currency, discount, balance, status, provider, or provider identifier. The server resolves Silver (5,000,000 paise), Gold (7,500,000 paise), and Platinum (10,000,000 paise) from `src/core/checkout.ts`; Custom has no automatic amount.

The server resolves the public organization, then atomically creates an organization-scoped `CheckoutEnquiry`, audit rows, and—only for a fixed standard plan—a `PaymentIntent` in `PENDING_APPROVAL`. Email/WhatsApp delivery happens afterwards and is never the system of record. Reusing an idempotency key with changed payload is rejected; a concurrent duplicate returns the original persisted anchor.

`enquiryId` and optional `paymentIntentId` are opaque references, never authorization. A future public payment flow must bind them to a separate customer authorization proof; possession of an ID alone is insufficient.

## Payment lifecycle and authority

Standard payment intents progress `DRAFT → PENDING_APPROVAL → READY → PROCESSING`, then may be verified as `PAID`, fail, or be cancelled. Generic transitions always reject `PAID`; no caller-supplied provider string, status, browser callback, or admin update can reach it. The sole paid path, `applyVerifiedProviderEvent`, reads a durable `PaymentProviderEvent` whose signature has already been verified and whose organization, provider, provider order, amount, and currency match the intent, in the same database transaction.

Amounts are integer paise, INR-only, bounded, and database-checked: non-negative totals, approved amount no greater than total, paid amount no greater than approved, correct balance calculation, and current amount no greater than balance. `CUSTOM` remains an enquiry until an OWNER supplies a positive bounded approved amount through the internal approval route. ADMIN can approve a standard server-priced intent; STAFF has no payment mutation permission.

Provider capture mode is deliberately nullable until explicitly configured as `AUTO` or `MANUAL` per organization/provider. No code assumes capture behavior. Task 6 must establish the Razorpay account capture mode before payment initiation or fulfilment exists.

## Provider and idempotency controls

The database enforces unique provider/order and provider/payment combinations, plus unique provider event IDs, payment-operation idempotency keys, checkout idempotency keys, and refund idempotency keys. A processed provider event must be signature-verified. Order/enquiry plus intent and their audit records are created in one transaction; approval plus audit is also transactional.

No payment credentials, signatures, raw provider payloads, card data, CVV, or payment secrets are stored in audit metadata or returned from public checkout.

## Task 6 preconditions

Before Razorpay Test Mode work:

1. Apply the reviewed payment-foundation migration in an approved non-production environment.
2. Configure `PAYMENTS_ENABLED=true` only for that test environment.
3. Set server-only test `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and, before enabling webhook processing, `RAZORPAY_WEBHOOK_SECRET`.
4. Explicitly configure capture mode from the Razorpay account setting.
5. Add the provider adapter, server-side HMAC verification, raw-body webhook verification, provider API idempotency, and a customer authorization binding for public payment initiation.

Until every precondition is met, payment initiation must remain blocked.
