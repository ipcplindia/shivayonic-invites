import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  audit: vi.fn(),
  limit: vi.fn(),
  findUser: vi.fn(),
}));

vi.mock("@/auth/auth", () => ({ auth: { api: { signInEmail: mocks.signInEmail } } }));
vi.mock("@/auth/audit", () => ({ recordSecurityAudit: mocks.audit }));
vi.mock("@/auth/rate-limit", () => ({ checkLoginRateLimit: mocks.limit }));
vi.mock("@/db/client", () => ({ prisma: { user: { findUnique: mocks.findUser } } }));

import { POST } from "@/app/api/auth/login/route";

function request(password = "incorrect-password") {
  return new Request("https://www.shivayonic.com/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.10" },
    body: JSON.stringify({ email: "owner@example.test", password }),
  });
}

describe("admin login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue({ allowed: true, retryAfter: null });
    mocks.findUser.mockResolvedValue({ id: "user-1", memberships: [{ organizationId: "org-1" }] });
  });

  it("turns a non-OK Better Auth response into one generic failure", async () => {
    mocks.signInEmail.mockResolvedValue(new Response(null, { status: 401 }));
    const response = await POST(request());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: { code: "INVALID_CREDENTIALS" } });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "LOGIN_FAILED" }));
    expect(mocks.audit).not.toHaveBeenCalledWith(expect.objectContaining({ action: "LOGIN_SUCCEEDED" }));
  });

  it("returns 429 with Retry-After after the durable limiter rejects", async () => {
    mocks.limit.mockResolvedValue({ allowed: false, retryAfter: 321 });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("321");
    expect(mocks.signInEmail).not.toHaveBeenCalled();
  });
});
