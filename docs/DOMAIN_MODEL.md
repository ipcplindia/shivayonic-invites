# Domain Model

## Implemented in Task 01

- **User**: canonical internal person identity and Better Auth user record.
- **Organization**: tenant boundary.
- **OrganizationMember**: user-to-organization membership with OWNER, ADMIN, or STAFF role.
- **Project**: organization-scoped business container with ACTIVE or ARCHIVED status.
- **MediaAsset**: uploaded source metadata and object-storage reference; optionally belongs to a project.
- **AuditLog**: organization-scoped actor/action/entity record with structured metadata.

Task 02 adds Better Auth persistence around the canonical User:

- **Session**: server-side session token, expiry, user agent, and IP metadata.
- **Account**: provider/account credential record; email-password accounts store library-managed password material, never plaintext passwords.
- **Verification**: library-managed verification token store for future flows.

MediaAsset is deliberately distinct from a future Publication. An asset is source media; a publication is an instruction to send selected media and metadata to a destination.

## Future entities — NOT YET IMPLEMENTED

Client, Event, MediaVariant, SocialAccount, Publication, PublicationTarget, PublicationAttempt, Schedule, Consent, Product, Order, and Payment.

Future publication states include DRAFT, UPLOADING, PROCESSING, READY, QUEUED, PUBLISHING, PUBLISHED, PARTIALLY_PUBLISHED, FAILED, and CANCELLED. These are shared domain vocabulary only at this milestone; no publication tables exist.
