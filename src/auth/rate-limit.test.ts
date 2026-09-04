import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { $queryRaw: queryRaw } }));

import { checkPublicWriteRateLimit, consumeDurableRateLimit } from "@/auth/rate-limit";

describe("durable rate limiting", () => {
  beforeEach(() => queryRaw.mockReset());

  it("allows a request inside the limit", async () => {
    queryRaw.mockResolvedValue([{ count: 1, expiresAt: new Date("2026-09-04T00:10:00Z") }]);
    await expect(consumeDurableRateLimit("login:test", { window: 600, max: 5 }, new Date("2026-09-04T00:00:00Z")))
      .resolves.toEqual({ allowed: true, retryAfter: null });
  });

  it("rejects over-limit requests with retry time", async () => {
    queryRaw.mockResolvedValue([{ count: 6, expiresAt: new Date("2026-09-04T00:10:00Z") }]);
    await expect(consumeDurableRateLimit("login:test", { window: 600, max: 5 }, new Date("2026-09-04T00:00:00Z")))
      .resolves.toEqual({ allowed: false, retryAfter: 600 });
  });

  it("never sends the raw identifier to storage", async () => {
    queryRaw.mockResolvedValue([{ count: 1, expiresAt: new Date("2026-09-04T00:10:00Z") }]);
    await consumeDurableRateLimit("login:email:owner@example.test", { window: 600, max: 5 });
    expect(JSON.stringify(queryRaw.mock.calls)).not.toContain("owner@example.test");
  });

  it("uses the trusted forwarded IP bucket for public writes", async () => {
    queryRaw.mockResolvedValue([{ count: 1, expiresAt: new Date("2026-09-04T00:10:00Z") }]);
    await expect(checkPublicWriteRateLimit("order", new Headers({ "x-forwarded-for": "203.0.113.9" })))
      .resolves.toEqual({ allowed: true, retryAfter: null });
    expect(JSON.stringify(queryRaw.mock.calls)).not.toContain("203.0.113.9");
  });
});
