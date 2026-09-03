/**
 * Stub for the `server-only` package under Vitest.
 *
 * `server-only` deliberately throws the moment it is imported outside a React
 * Server Component, which is exactly what protects modules like
 * `features/public/notify.ts` from ever reaching the browser. Vitest is neither
 * a server nor a client bundle, so the real package fails the import and the
 * module becomes untestable.
 *
 * `vitest.config.ts` aliases the package to this empty module for tests only.
 * The application build is untouched, so the real guard still applies in
 * development and production.
 */
export {};
