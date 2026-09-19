import { beforeEach, describe, expect, it, vi } from "vitest";

import { CATALOGUE_MIGRATION, runCatalogueMigration, splitMigrationStatements } from "./catalogue-migration-runner";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async () => 'ALTER TABLE "PublicProduct" ADD COLUMN "organizationId" TEXT; CREATE TABLE "PublicPlan" ("id" TEXT);'),
}));

function dbStub(options: { applied?: boolean; failed?: boolean } = {}) {
  const calls: string[] = [];
  const tx = {
    $queryRawUnsafe: vi.fn(async (sql: string) => {
      calls.push(sql);
      if (sql.includes("finished_at IS NULL")) return options.failed ? [{ migration_name: "blocked", finished_at: null, rolled_back_at: null }] : [];
      if (sql.includes("migration_name = $1")) return options.applied ? [{ migration_name: CATALOGUE_MIGRATION, finished_at: new Date(), rolled_back_at: null }] : [];
      return [];
    }),
    $executeRawUnsafe: vi.fn(async (sql: string) => { calls.push(sql); return 1; }),
    $transaction: vi.fn(),
  };
  tx.$transaction.mockImplementation(async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx));
  return { tx, calls };
}

describe("catalogue migration runner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("splits checked-in SQL", () => expect(splitMigrationStatements("SELECT 1; SELECT 2;")).toEqual(["SELECT 1", "SELECT 2"]));

  it("applies exactly once with a transaction lock", async () => {
    const { tx, calls } = dbStub();
    await expect(runCatalogueMigration(tx)).resolves.toEqual({ migration: CATALOGUE_MIGRATION, status: "applied", ok: true });
    expect(calls[0]).toContain("pg_advisory_xact_lock");
    expect(calls.some((sql) => sql.includes('INSERT INTO "_prisma_migrations"'))).toBe(true);
    expect(calls.some((sql) => sql.includes("ALTER TABLE"))).toBe(true);
  });

  it("does not reapply an applied migration", async () => {
    const { tx, calls } = dbStub({ applied: true });
    await expect(runCatalogueMigration(tx)).resolves.toMatchObject({ status: "already_applied" });
    expect(calls.some((sql) => sql.includes("INSERT INTO"))).toBe(false);
  });

  it("stops when Prisma has a failed migration", async () => {
    const { tx, calls } = dbStub({ failed: true });
    await expect(runCatalogueMigration(tx)).rejects.toThrow("FAILED_MIGRATION_BLOCKS_DEPLOY");
    expect(calls.some((sql) => sql.includes("INSERT INTO"))).toBe(false);
  });
});
