import { describe, expect, it } from "vitest";

import { previewMigrationEnvironment } from "./vercel-build-env";

describe("Vercel Preview migration environment", () => {
  it("maps only the Preview database URL", () => {
    const env = previewMigrationEnvironment({
      VERCEL_ENV: "preview",
      PREVIEWDB_PRISMA_DATABASE_URL: "postgresql://preview-prisma/db",
      PREVIEWDB_DATABASE_URL: "postgresql://preview/db",
      DATABASE_URL: "postgresql://production/db",
    });
    expect(env.DATABASE_URL).toBe("postgresql://preview-prisma/db");
  });

  it("falls back to the Preview database alias, never Production", () => {
    const env = previewMigrationEnvironment({
      VERCEL_ENV: "preview",
      PREVIEWDB_DATABASE_URL: "postgresql://preview/db",
      DATABASE_URL: "postgresql://production/db",
    });
    expect(env.DATABASE_URL).toBe("postgresql://preview/db");
  });

  it("does not alter non-Preview build environments", () => {
    const env = previewMigrationEnvironment({
      VERCEL_ENV: "production",
      DATABASE_URL: "postgresql://production/db",
    });
    expect(env.DATABASE_URL).toBe("postgresql://production/db");
  });

  it("fails closed when Preview URLs are missing", () => {
    expect(() => previewMigrationEnvironment({ VERCEL_ENV: "preview", DATABASE_URL: "postgresql://production/db" })).toThrow("PREVIEW_DATABASE_URL_REQUIRED");
  });
});
