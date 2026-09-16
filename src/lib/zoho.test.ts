import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each([5, "5"])("logs safe upstream diagnostics for code %s without secrets or query data", async code => {
  vi.resetModules();
  for (const [name, value] of Object.entries({ ZOHO_CLIENT_ID: "private-client", ZOHO_CLIENT_SECRET: "private-secret", ZOHO_REFRESH_TOKEN: "private-refresh", ZOHO_ORGANIZATION_ID: "123", ZOHO_ACCOUNTS_BASE_URL: "https://accounts.zoho.in", ZOHO_BOOKS_BASE_URL: "https://www.zohoapis.in/books/v3" })) vi.stubEnv(name, value);
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "private-access", expires_in: 3600 })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ code, message: "private-secret private-access customer@example.com" }), { status: 404 })));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const { zohoBooksFetch } = await import("./zoho");
  await expect(zohoBooksFetch("/reportingtags/options?tag_id=123&private=private-query")).rejects.toThrow("ZOHO_UNAVAILABLE");
  expect(log).toHaveBeenCalledExactlyOnceWith("Zoho Books request failed", { path: "/reportingtags/options", status: 404, zohoCode: code, message: "Provider message withheld" });
  expect(JSON.stringify(log.mock.calls)).not.toMatch(/private-|customer@/);
});
