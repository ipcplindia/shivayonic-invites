import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { handleProductionSetup } from "@/core/production-setup";

const production = { NODE_ENV: "production", VERCEL_ENV: "production", PRODUCTION_SETUP_TOKEN: "correct-token" };

describe("temporary production setup authorization", () => {
  it("does not execute without the setup token", async () => {
    const execute = vi.fn();
    const response = await handleProductionSetup(new Request("https://example.com/api/internal/production-setup", { method: "POST" }), production, execute);

    expect(response.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not execute with an invalid setup token", async () => {
    const execute = vi.fn();
    const response = await handleProductionSetup(new Request("https://example.com/api/internal/production-setup", {
      method: "POST",
      headers: { authorization: "Bearer wrong-token" },
    }), production, execute);

    expect(response.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("is unavailable outside Vercel production", async () => {
    const execute = vi.fn();
    const request = new Request("https://example.com/api/internal/production-setup", {
      method: "POST",
      headers: { authorization: "Bearer correct-token" },
    });
    const response = await handleProductionSetup(request, { ...production, VERCEL_ENV: "preview" }, execute);

    expect(response.status).toBe(404);
    expect(execute).not.toHaveBeenCalled();
  });

  it("returns status only after valid authorization", async () => {
    const execute = vi.fn().mockResolvedValue({ owner: true, organization: true, cors: true, changed: false });
    const request = new Request("https://example.com/api/internal/production-setup", {
      method: "POST",
      headers: { authorization: "Bearer correct-token" },
    });
    const response = await handleProductionSetup(request, production, execute);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, owner: true, organization: true, cors: true, changed: false });
    expect(execute).toHaveBeenCalledOnce();
  });
});
