# Shivayonic Core Architecture

## Scope

Task 01 establishes a modular monolith foundation for the private Command Center. It does not implement authentication, social integrations, publication workflows, or the public website.

## Stack decisions

- **TypeScript + Next.js** — one production application boundary for the admin/API layer, with strict types and a clean path to a worker. Alternatives considered: separate API framework and microservices; those add operational cost before asynchronous workloads exist.
- **PostgreSQL + Prisma** — relational integrity, migrations, typed queries, and a mature TypeScript ORM. Alternatives considered: document storage and a custom query layer; the domain has relational membership, ownership, and audit requirements.
- **Zod** — runtime validation for configuration and later API contracts. Alternatives considered: compile-time types alone; they cannot validate untrusted runtime input.
- **Object-storage interface** — media is represented by storage metadata and keys, never database bytes. The provider can later be S3-compatible without changing domain code.

## Repository shape

`src/app` contains the Next.js application and route handlers. `src/core` contains domain-facing services and abstractions. `src/db` owns Prisma access. `src/config` owns environment validation. `src/shared` contains stable cross-layer types. `prisma` contains the database schema. `docs` contains contracts and decisions. A future `apps/worker` or worker entry point can consume core services without turning the platform into microservices.

## Request boundaries

Browser code receives safe application contracts only. Server-only configuration, database access, storage credentials, and future social tokens remain behind server boundaries.
