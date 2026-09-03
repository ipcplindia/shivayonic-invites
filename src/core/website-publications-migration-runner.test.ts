import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  inspectWebsitePublicationsMigration,
  runWebsitePublicationsMigration,
  splitMigrationStatements,
  WEBSITE_PUBLICATIONS_MIGRATION,
} from "./website-publications-migration-runner";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async () => 'CREATE TYPE "WebsitePublicationStatus" AS ENUM (\'DRAFT\');\nALTER TABLE "MediaAsset" ADD COLUMN "displayTitle" TEXT;\n'),
}));

type Query = { kind: "query" | "execute"; sql: string; values: unknown[] };

function dbStub(options: { applied?: boolean; failed?: boolean } = {}) {
  const calls: Query[] = [];
  const tx = {
    $queryRawUnsafe: vi.fn(async (sql: string, ...values: unknown[]) => {
      calls.push({ kind: "query", sql, values });
      if (sql.includes("pg_advisory_xact_lock")) return [{ pg_advisory_xact_lock: "" }];
      if (sql.includes("finished_at IS NULL")) return options.failed ? [{ migration_name: "bad", finished_at: null, rolled_back_at: null }] : [];
      if (sql.includes("migration_name = $1")) return options.applied ? [{ migration_name: WEBSITE_PUBLICATIONS_MIGRATION, finished_at: new Date(), rolled_back_at: null }] : [];
      return [];
    }),
    $executeRawUnsafe: vi.fn(async (sql: string, ...values: unknown[]) => {
      calls.push({ kind: "execute", sql, values });
      return 1;
    }),
    $transaction: vi.fn(),
  };
  tx.$transaction.mockImplementation(async (fn: (db: typeof tx) => Promise<unknown>) => fn(tx));
  return { tx, calls };
}

describe("website publication migration runner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("splits the checked-in SQL into executable statements", () => {
    expect(splitMigrationStatements("SELECT 1;\nSELECT 2;\n")).toEqual(["SELECT 1", "SELECT 2"]);
  });

  it("uses the Prisma migration table and applies the exact migration once", async () => {
    const { tx, calls } = dbStub();

    await expect(runWebsitePublicationsMigration(tx)).resolves.toEqual({
      migration: WEBSITE_PUBLICATIONS_MIGRATION,
      status: "applied",
      ok: true,
    });

    expect(calls[0]).toMatchObject({
      sql: "SELECT pg_advisory_xact_lock(20260903::int, 0::int)",
      values: [],
    });
    expect(calls.some((call) => call.sql.includes('INSERT INTO "_prisma_migrations"'))).toBe(true);
    expect(calls.some((call) => call.sql.includes('UPDATE "_prisma_migrations" SET finished_at'))).toBe(true);
    expect(calls.some((call) => call.sql.includes("CREATE TYPE"))).toBe(true);
    expect(calls.some((call) => call.sql.includes("ALTER TABLE"))).toBe(true);
  });

  it("does not reapply an already recorded migration", async () => {
    const { tx, calls } = dbStub({ applied: true });

    await expect(runWebsitePublicationsMigration(tx)).resolves.toMatchObject({ status: "already_applied" });

    expect(calls.some((call) => call.kind === "execute")).toBe(false);
  });

  it("stops when any failed Prisma migration is blocking deploy", async () => {
    const { tx, calls } = dbStub({ failed: true });

    await expect(runWebsitePublicationsMigration(tx)).rejects.toThrow("FAILED_MIGRATION_BLOCKS_DEPLOY");

    expect(calls.some((call) => call.kind === "execute")).toBe(false);
  });

  it("inspects schema state without executing migration SQL", async () => {
    const { tx, calls } = dbStub();
    tx.$queryRawUnsafe.mockResolvedValueOnce([{
      migration_name: null,
      finished_at: null,
      rolled_back_at: null,
      status_enum: false,
      placement_enum: false,
      publication_table: false,
      media_columns: false,
    }] as never);

    await expect(inspectWebsitePublicationsMigration(tx)).resolves.toMatchObject({
      state: "not_started",
      schema: {
        statusEnum: false,
        placementEnum: false,
        publicationTable: false,
        mediaColumns: false,
      },
    });
    expect(calls.some((call) => call.kind === "execute")).toBe(false);
  });
});
