import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { prisma } from "@/db/client";

export const CATALOGUE_MIGRATION = "20260905000000_catalogue_management";
const MIGRATION_PATH = join(process.cwd(), "prisma", "migrations", CATALOGUE_MIGRATION, "migration.sql");
const MIGRATION_LOCK_KEY = 20260905000000;

type MigrationRow = { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null };
type MigrationTransaction = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
};
type MigrationDb = { $transaction<T>(fn: (tx: MigrationTransaction) => Promise<T>): Promise<T> };

export type CatalogueMigrationResult = {
  migration: typeof CATALOGUE_MIGRATION;
  status: "already_applied" | "applied";
  ok: true;
};

export function splitMigrationStatements(sql: string) {
  return sql.split(";").map((statement) => statement.trim()).filter(Boolean);
}

async function loadMigrationSql() {
  return readFile(MIGRATION_PATH, "utf8");
}

export async function runCatalogueMigration(db: MigrationDb = prisma): Promise<CatalogueMigrationResult> {
  const sql = await loadMigrationSql();
  const statements = splitMigrationStatements(sql);
  if (statements.length === 0) throw new Error("MIGRATION_SQL_EMPTY");

  return db.$transaction(async (tx) => {
    await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock($1)", MIGRATION_LOCK_KEY);
    const failed = await tx.$queryRawUnsafe<MigrationRow[]>(
      'SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL',
    );
    if (failed.length > 0) throw new Error("FAILED_MIGRATION_BLOCKS_DEPLOY");

    const existing = await tx.$queryRawUnsafe<MigrationRow[]>(
      'SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" WHERE migration_name = $1',
      CATALOGUE_MIGRATION,
    );
    if (existing.some((row) => row.finished_at && !row.rolled_back_at)) {
      return { migration: CATALOGUE_MIGRATION, status: "already_applied", ok: true };
    }

    const id = randomUUID();
    const checksum = createHash("sha256").update(sql).digest("hex");
    await tx.$executeRawUnsafe(
      'INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ($1, $2, NULL, $3, NULL, NULL, NOW(), 0)',
      id,
      checksum,
      CATALOGUE_MIGRATION,
    );
    for (const statement of statements) await tx.$executeRawUnsafe(statement);
    await tx.$executeRawUnsafe(
      'UPDATE "_prisma_migrations" SET finished_at = NOW(), applied_steps_count = $1 WHERE id = $2',
      statements.length,
      id,
    );
    return { migration: CATALOGUE_MIGRATION, status: "applied", ok: true };
  });
}
