import { afterEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

const runWebsitePublicationsMigration = vi.fn();

vi.mock("@/core/website-publications-migration-runner", () => ({
  WEBSITE_PUBLICATIONS_MIGRATION: "20260903000000_website_publications",
  runWebsitePublicationsMigration: () => runWebsitePublicationsMigration(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

function request(host: string) {
  return new Request("https://" + host + "/api/internal/website-publications-migration", {
    method: "POST",
    headers: { host },
  });
}

function getRequest(host: string, confirm = "20260903000000_website_publications") {
  return new Request("https://" + host + "/api/internal/website-publications-migration?confirm=" + confirm, {
    method: "GET",
    headers: { host },
  });
}

describe("temporary website publications migration route", () => {
  it("does not execute outside Vercel production", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "shivayonic-invites-temp-shivayonic.vercel.app");

    const response = await POST(request("shivayonic-invites-temp-shivayonic.vercel.app"));

    expect(response.status).toBe(404);
    expect(runWebsitePublicationsMigration).not.toHaveBeenCalled();
  });

  it("rejects public production domains", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "www.shivayonic.com");

    const response = await POST(request("www.shivayonic.com"));

    expect(response.status).toBe(404);
    expect(runWebsitePublicationsMigration).not.toHaveBeenCalled();
  });

  it("executes only on the exact Vercel deployment host", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "shivayonic-invites-temp-shivayonic.vercel.app");
    runWebsitePublicationsMigration.mockResolvedValueOnce({
      migration: "20260903000000_website_publications",
      status: "applied",
      ok: true,
    });

    const response = await POST(request("shivayonic-invites-temp-shivayonic.vercel.app"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      migration: "20260903000000_website_publications",
      status: "applied",
      ok: true,
    });
    expect(runWebsitePublicationsMigration).toHaveBeenCalledTimes(1);
  });

  it("allows a protected GET only with the exact migration confirmation", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "shivayonic-invites-temp-shivayonic.vercel.app");
    runWebsitePublicationsMigration.mockResolvedValueOnce({
      migration: "20260903000000_website_publications",
      status: "applied",
      ok: true,
    });

    expect((await GET(getRequest("shivayonic-invites-temp-shivayonic.vercel.app", "wrong"))).status).toBe(404);
    const response = await GET(getRequest("shivayonic-invites-temp-shivayonic.vercel.app"));

    expect(response.status).toBe(200);
    expect(runWebsitePublicationsMigration).toHaveBeenCalledTimes(1);
  });

  it("sanitizes failures", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "shivayonic-invites-temp-shivayonic.vercel.app");
    runWebsitePublicationsMigration.mockRejectedValueOnce(new Error("postgres://secret@example"));

    const response = await POST(request("shivayonic-invites-temp-shivayonic.vercel.app"));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain("postgres://secret");
    expect(body).toEqual({
      migration: "20260903000000_website_publications",
      ok: false,
      error: { code: "MIGRATION_FAILED" },
    });
  });
});
