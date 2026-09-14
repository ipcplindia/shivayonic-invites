import { beforeEach, afterEach, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  for (const [key, value] of Object.entries({ ZOHO_CLIENT_ID: "test-client", ZOHO_CLIENT_SECRET: "test-secret", ZOHO_REFRESH_TOKEN: "test-refresh", ZOHO_ORGANIZATION_ID: "123", ZOHO_API_DOMAIN: "https://www.zohoapis.in" })) vi.stubEnv(key, value);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const token = () => json({ access_token: "test-access", expires_in: 3600 });

it("shares refreshes and sends credentials only in the India token POST body", async () => {
  fetchMock.mockResolvedValue(token());
  const { getZohoAccessToken } = await import("./zoho");
  expect(await Promise.all([getZohoAccessToken(), getZohoAccessToken()])).toEqual(["test-access", "test-access"]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://accounts.zoho.in/oauth/v2/token");
  expect(init.body.get("client_secret")).toBe("test-secret");
  expect(init.body.has("redirect_uri")).toBe(false);
  expect(init.redirect).toBe("error");
});
it("verifies the configured organization and enforces authorization and organization headers", async () => {
  fetchMock.mockResolvedValueOnce(token()).mockResolvedValueOnce(json({ code: 0, organization: { organization_id: "123" } }));
  const { verifyZohoOrganization } = await import("./zoho");
  await verifyZohoOrganization();
  const [url, init] = fetchMock.mock.calls[1];
  expect(url.toString()).toBe("https://www.zohoapis.in/books/v3/organizations/123?organization_id=123");
  expect(init.headers.get("Authorization")).toBe("Zoho-oauthtoken test-access");
  expect(init.cache).toBe("no-store");
});
it("rejects missing configuration and foreign domains before network access", async () => {
  vi.stubEnv("ZOHO_API_DOMAIN", "https://example.com");
  const { getZohoAccessToken } = await import("./zoho");
  await expect(getZohoAccessToken()).rejects.toThrow("ZOHO_CONFIGURATION_INVALID");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("redacts upstream errors and allows a subsequent refresh", async () => {
  fetchMock.mockRejectedValueOnce(new Error("test-secret test-refresh")).mockResolvedValueOnce(token());
  const { getZohoAccessToken } = await import("./zoho");
  await expect(getZohoAccessToken()).rejects.toThrow(/^ZOHO_UNAVAILABLE$/);
  await expect(getZohoAccessToken()).resolves.toBe("test-access");
});
it("rejects a different organization", async () => {
  fetchMock.mockResolvedValueOnce(token()).mockResolvedValueOnce(json({ code: 0, organization: { organization_id: "456" } }));
  const { verifyZohoOrganization } = await import("./zoho");
  await expect(verifyZohoOrganization()).rejects.toThrow("ZOHO_ORGANIZATION_MISMATCH");
});
it("rejects HTTP-200 OAuth errors", async () => {
  fetchMock.mockResolvedValueOnce(json({ error: "invalid_client", message: "test-secret" }));
  const { getZohoAccessToken } = await import("./zoho");
  await expect(getZohoAccessToken()).rejects.toThrow(/^ZOHO_UNAVAILABLE$/);
});
it("invalidates a rejected token without retrying a write", async () => {
  fetchMock.mockResolvedValueOnce(token()).mockResolvedValueOnce(json({ code: 57 }, 401)).mockResolvedValueOnce(token());
  const { zohoBooksFetch, getZohoAccessToken } = await import("./zoho");
  await expect(zohoBooksFetch("/contacts", { method: "POST", body: "{}" })).rejects.toThrow("ZOHO_UNAVAILABLE");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await getZohoAccessToken();
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
it("blocks path traversal outside Books", async () => {
  const { zohoBooksFetch } = await import("./zoho");
  await expect(zohoBooksFetch("/../../../other")).rejects.toThrow("ZOHO_CONFIGURATION_INVALID");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("refreshes before expiry", async () => {
  const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  try {
    fetchMock.mockImplementation(async () => token());
    const { getZohoAccessToken } = await import("./zoho");
    await getZohoAccessToken();
    now.mockReturnValue(1_000_000 + 3540_000);
    await getZohoAccessToken();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally { now.mockRestore(); }
});
it("rejects Books application errors even with HTTP 200", async () => {
  fetchMock.mockResolvedValueOnce(token()).mockResolvedValueOnce(json({ code: 57, message: "test-secret" }));
  const { zohoBooksFetch } = await import("./zoho");
  await expect(zohoBooksFetch("/contacts")).rejects.toThrow(/^ZOHO_UNAVAILABLE$/);
});
