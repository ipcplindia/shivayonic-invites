import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { AppAuthError } from "@/auth/errors";
const mocks = vi.hoisted(() => ({ permission: vi.fn(), verify: vi.fn() }));
vi.mock("@/auth/context", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/zoho", async (original) => ({ ...await original<typeof import("@/lib/zoho")>(), verifyZohoOrganization: mocks.verify }));
import { GET } from "./route";
const request = new Request("https://example.test/api/integrations/zoho/test");
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PUBLIC_ORGANIZATION_SLUG", "shivayonic");
  mocks.permission.mockResolvedValue({ organization: { slug: "shivayonic" } });
  mocks.verify.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());
it.each([401, 403] as const)("denies unauthorized requests before calling Zoho (%s)", async (status) => {
  mocks.permission.mockRejectedValue(new AppAuthError(status === 401 ? "AUTHENTICATION_REQUIRED" : "PERMISSION_DENIED", status));
  expect((await GET(request)).status).toBe(status);
  expect(mocks.verify).not.toHaveBeenCalled();
});
it("denies administrators of another app organization", async () => {
  mocks.permission.mockResolvedValue({ organization: { slug: "other" } });
  expect((await GET(request)).status).toBe(403);
  expect(mocks.verify).not.toHaveBeenCalled();
});
it("returns only a non-cacheable verification result", async () => {
  const response = await GET(request);
  expect(mocks.permission).toHaveBeenCalledWith("INTEGRATIONS_MANAGE", { headers: request.headers });
  expect(await response.json()).toEqual({ ok: true, organizationVerified: true });
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});
it("does not expose unexpected errors", async () => {
  mocks.verify.mockRejectedValue(new Error("private-token"));
  const response = await GET(request);
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: { code: "ZOHO_UNAVAILABLE" } });
});
