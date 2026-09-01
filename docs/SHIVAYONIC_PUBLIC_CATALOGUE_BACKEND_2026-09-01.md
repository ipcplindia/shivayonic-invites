# Shivayonic public catalogue backend — 2026-09-01

## Domain

The catalogue uses database-backed hierarchical `PublicCategory` records, reusable `VisualStyle` records, published `PublicProduct` records, product/media joins, and curated `PublicCollection` records. Public product media references existing `MediaAsset` IDs only; uploaded bytes and storage metadata are not duplicated or exposed.

Products have stable unique slugs, type, price in minor currency units, optional display label, featured flag, display order, and `DRAFT` / `PUBLISHED` / `ARCHIVED` state. Only `PUBLISHED` products are returned by public APIs.

## Public read APIs

- `GET /api/public/categories`
- `GET /api/public/categories/:slug`
- `GET /api/public/styles`
- `GET /api/public/products`
- `GET /api/public/products/:slug`
- `GET /api/public/collections`

Product lists support bounded cursor pagination (default 24, maximum 48), `category`, `style`, `productType`, `featured`, and bounded case-insensitive `q` search. Public detail slug misses return a safe 404.

## Shared contract and media safety

`src/shared/catalogue.ts` is the canonical frontend/backend public contract. It contains no Prisma, tenant, storage, credential, filesystem, or session types. Product responses contain only media IDs plus display role/alt text/order. Public binary media delivery remains intentionally deferred.

## Development content

No customer data is seeded. Development verification may create generic examples such as Royal Swayamvar Invitation, Floral Mehendi Invitation, and Watercolor Save the Date through a local-only seed or test fixture.

## Deferred

Checkout, payment, orders, accounts, customization, delivery integrations, social/video integrations, and all frontend UI are out of scope.
