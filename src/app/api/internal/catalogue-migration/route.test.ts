import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const runCatalogueMigration = vi.fn();
vi.mock("@/core/catalogue-migration-runner", () => ({ CATALOGUE_MIGRATION: "20260905000000_catalogue_management", runCatalogueMigration: () => runCatalogueMigration() }));

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

function request(host: string, confirm = "20260905000000_catalogue_management") {
  return new Request(`https://${host}/api/internal/catalogue-migration?confirm=${confirm}`, { headers: { host } });
}

describe("protected catalogue migration route", () => {
  it("rejects preview and public hosts", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "shivayonic-invites-preview.vercel.app");
    expect((await GET(request("shivayonic-invites-preview.vercel.app"))).status).toBe(404);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "www.shivayonic.com");
    expect((await GET(request("www.shivayonic.com"))).status).toBe(404);
    expect(runCatalogueMigration).not.toHaveBeenCalled();
  });

  it("runs only on the exact protected deployment host", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "shivayonic-invites-migration.vercel.app");
    runCatalogueMigration.mockResolvedValueOnce({ migration: "20260905000000_catalogue_management", status: "applied", ok: true });
    await expect((await GET(request("shivayonic-invites-migration.vercel.app"))).json()).resolves.toEqual({ migration: "20260905000000_catalogue_management", status: "applied", ok: true });
    expect(runCatalogueMigration).toHaveBeenCalledOnce();
  });

  it("sanitizes failures", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "shivayonic-invites-migration.vercel.app");
    runCatalogueMigration.mockRejectedValueOnce(new Error("postgres://secret"));
    const response = await GET(request("shivayonic-invites-migration.vercel.app"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ migration: "20260905000000_catalogue_management", ok: false, error: { code: "MIGRATION_FAILED" } });
  });
});
