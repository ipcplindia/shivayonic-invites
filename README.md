# Shivayonic Core

Foundation for the private Shivayonic Command Center.

## Local setup

1. Copy `.env.example` to `.env` and provide a PostgreSQL connection string.
2. Run `npm install`.
3. Run `npm run db:generate`, `npm run db:validate`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

The current milestone contains private admin authentication and organization RBAC only. It intentionally contains no social-platform integrations, media-upload implementation, publication tables, public marketing site, customer authentication, or elaborate admin UI.

See `docs/ADMIN_AUTH.md` for `/login`, `/admin`, `/api/me`, and `npm run admin:bootstrap`.
