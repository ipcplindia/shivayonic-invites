import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { prisma } from "@/db/client";

export const WEBSITE_PUBLICATIONS_MIGRATION = "20260903000000_website_publications";
const MIGRATION_PATH = join(process.cwd(), "prisma", "migrations", WEBSITE_PUBLICATIONS_MIGRATION, "migration.sql");

type MigrationRow = {
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

type MigrationInspectionRow = MigrationRow & {
  status_enum: boolean;
  placement_enum: boolean;
  publication_table: boolean;
  media_columns: boolean;
};

type MigrationDb = {
  $transaction<T>(fn: (tx: MigrationTransaction) => Promise<T>): Promise<T>;
};

type MigrationTransaction = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
};

export type WebsitePublicationsMigrationResult = {
  migration: typeof WEBSITE_PUBLICATIONS_MIGRATION;
  status: "already_applied" | "applied";
  ok: true;
};

export type WebsitePublicationsMigrationInspection = {
  migration: typeof WEBSITE_PUBLICATIONS_MIGRATION;
  state: "not_started" | "failed" | "partially_applied" | "successfully_applied";
  schema: {
    statusEnum: boolean;
    placementEnum: boolean;
    publicationTable: boolean;
    mediaColumns: boolean;
  };
  ok: true;
};

export type WebsitePublicationsMigrationStage =
  | "load_sql"
  | "check_failed_migrations"
  | "check_existing_migration"
  | "record_migration_start"
  | "apply_sql"
  | "record_migration_success";

export class WebsitePublicationsMigrationError extends Error {
  constructor(readonly stage: WebsitePublicationsMigrationStage, cause: unknown) {
    super("WEBSITE_PUBLICATIONS_MIGRATION_FAILED", { cause });
    this.name = "WebsitePublicationsMigrationError";
  }
}

export function splitMigrationStatements(sql: string) {
  return sql.split(";").map((statement) => statement.trim()).filter(Boolean);
}

export async function loadWebsitePublicationsMigrationSql() {
  return readFile(MIGRATION_PATH, "utf8");
}

async function migrationRows(db: MigrationTransaction, name: string) {
  return db.$queryRawUnsafe<MigrationRow[]>(
    'SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" WHERE migration_name = $1',
    name,
  );
}

async function failedMigrationRows(db: MigrationTransaction) {
  return db.$queryRawUnsafe<MigrationRow[]>(
    'SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL',
  );
}

export async function runWebsitePublicationsMigration(db: MigrationDb = prisma) {
  let stage: WebsitePublicationsMigrationStage = "load_sql";
  let sql: string;
  try {
    sql = await loadWebsitePublicationsMigrationSql();
  } catch (error) {
    throw new WebsitePublicationsMigrationError(stage, error);
  }
  const statements = splitMigrationStatements(sql);
  if (statements.length === 0) throw new Error("MIGRATION_SQL_EMPTY");

  try {
    return await db.$transaction<WebsitePublicationsMigrationResult>(async (tx) => {
      stage = "check_failed_migrations";
      const blockingFailures = await failedMigrationRows(tx);
      if (blockingFailures.length > 0) throw new Error("FAILED_MIGRATION_BLOCKS_DEPLOY");

      stage = "check_existing_migration";
      const existing = await migrationRows(tx, WEBSITE_PUBLICATIONS_MIGRATION);
      if (existing.some((row) => row.finished_at && !row.rolled_back_at)) {
        return { migration: WEBSITE_PUBLICATIONS_MIGRATION, status: "already_applied", ok: true };
      }

      stage = "record_migration_start";
      const checksum = createHash("sha256").update(sql).digest("hex");
      const migrationId = randomUUID();
      await tx.$executeRawUnsafe(
        'INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ($1, $2, NULL, $3, NULL, NULL, NOW(), 0)',
        migrationId,
        checksum,
        WEBSITE_PUBLICATIONS_MIGRATION,
      );

      stage = "apply_sql";
      for (const statement of statements) await tx.$executeRawUnsafe(statement);

      stage = "record_migration_success";
      await tx.$executeRawUnsafe(
        'UPDATE "_prisma_migrations" SET finished_at = NOW(), applied_steps_count = $1 WHERE id = $2',
        statements.length,
        migrationId,
      );

      return { migration: WEBSITE_PUBLICATIONS_MIGRATION, status: "applied", ok: true };
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FAILED_MIGRATION_BLOCKS_DEPLOY") throw error;
    throw new WebsitePublicationsMigrationError(stage, error);
  }
}

export async function inspectWebsitePublicationsMigration(db: MigrationDb = prisma) {
  return db.$transaction<WebsitePublicationsMigrationInspection>(async (tx) => {
    const rows = await tx.$queryRawUnsafe<MigrationInspectionRow[]>(`
      SELECT m.migration_name, m.finished_at, m.rolled_back_at,
        EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WebsitePublicationStatus') AS status_enum,
        EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WebsitePlacement') AS placement_enum,
        to_regclass('public."WebsitePublication"') IS NOT NULL AS publication_table,
        (SELECT COUNT(*) = 3 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'MediaAsset'
            AND column_name IN ('displayTitle', 'altText', 'description')) AS media_columns
      FROM (SELECT 1) AS probe
      LEFT JOIN LATERAL (
        SELECT migration_name, finished_at, rolled_back_at
        FROM "_prisma_migrations"
        WHERE migration_name = $1
        ORDER BY started_at DESC
        LIMIT 1
      ) AS m ON true
    `, WEBSITE_PUBLICATIONS_MIGRATION);
    const row = rows[0];
    const schema = {
      statusEnum: Boolean(row?.status_enum),
      placementEnum: Boolean(row?.placement_enum),
      publicationTable: Boolean(row?.publication_table),
      mediaColumns: Boolean(row?.media_columns),
    };
    const hasSchemaArtifacts = Object.values(schema).some(Boolean);
    const hasMigrationRow = Boolean(row?.migration_name);
    const state = hasMigrationRow && row?.finished_at && !row.rolled_back_at
      ? "successfully_applied"
      : hasMigrationRow && !row?.rolled_back_at
        ? "failed"
        : hasSchemaArtifacts
          ? "partially_applied"
          : "not_started";

    return { migration: WEBSITE_PUBLICATIONS_MIGRATION, state, schema, ok: true };
  });
}
