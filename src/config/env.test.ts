import { afterEach, describe, expect, it, vi } from "vitest";
import { getDatabaseUrl, getServerConfig } from "./env";
describe("database environment selection", () => { it("uses Preview DB only", () => expect(getDatabaseUrl({ VERCEL_ENV: "preview", PREVIEWDB_DATABASE_URL: "postgresql://preview/db", DATABASE_URL: "postgresql://prod/db" })).toBe("postgresql://preview/db")); it("fails closed", () => expect(() => getDatabaseUrl({ VERCEL_ENV: "preview", DATABASE_URL: "postgresql://prod/db" })).toThrow("PREVIEW_DATABASE_URL_REQUIRED")); it("keeps production behavior", () => expect(getDatabaseUrl({ DATABASE_URL: "postgresql://prod/db" })).toBe("postgresql://prod/db")); });

describe("disabled production payment configuration", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("boots without Razorpay mode or keys while payments are disabled, fails closed when enabled", () => {
    for (const [key, value] of Object.entries({ VERCEL_ENV: "production", NODE_ENV: "production", DATABASE_URL: "postgresql://fixture:fixture@localhost:5432/fixture", TOKEN_ENCRYPTION_KEY: "x".repeat(32), BETTER_AUTH_SECRET: "y".repeat(32), BETTER_AUTH_URL: "https://app.example.test", NEXT_PUBLIC_APP_URL: "https://app.example.test", OBJECT_STORAGE_DRIVER: "s3", OBJECT_STORAGE_ENDPOINT: "https://storage.example.test", OBJECT_STORAGE_BUCKET: "fixture", OBJECT_STORAGE_ACCESS_KEY_ID: "fixture", OBJECT_STORAGE_SECRET_ACCESS_KEY: "fixture", PAYMENTS_ENABLED: "false" })) vi.stubEnv(key, value);
    for (const key of ["RAZORPAY_MODE", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]) vi.stubEnv(key, undefined);
    expect(getServerConfig().PAYMENTS_ENABLED).toBe("false");
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    expect(getServerConfig).toThrow("Payment mode, deployment environment and credentials must agree.");
  });
});
