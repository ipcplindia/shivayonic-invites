import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  handleOwnerPasswordReset,
  isProductionOwnerPasswordResetRequest,
  runOwnerPasswordReset,
  type OwnerPasswordResetStore,
} from "@/core/owner-password-reset";

const runtime = { NODE_ENV: "production", VERCEL_ENV: "production", VERCEL_URL: "shivayonic-invites-example-shivayonic.vercel.app" };
const request = (host = runtime.VERCEL_URL, password = "a-safe-new-password") => new Request(
  `https://${host}/api/internal/owner-password-reset`, { method: "POST", body: JSON.stringify({ password }), headers: { "content-type": "application/json" } },
);
const store = (claim: Awaited<ReturnType<OwnerPasswordResetStore["claim"]>> = "NOT_STARTED") => ({
  claim: vi.fn<OwnerPasswordResetStore["claim"]>().mockResolvedValue(claim),
  finish: vi.fn<OwnerPasswordResetStore["finish"]>().mockResolvedValue(undefined),
});

describe("one-time production owner password reset", () => {
  it("has no import-time effect and accepts only the current protected production deployment", () => {
    expect(isProductionOwnerPasswordResetRequest(request(), runtime)).toBe(true);
    expect(isProductionOwnerPasswordResetRequest(request("www.shivayonic.com"), runtime)).toBe(false);
    expect(isProductionOwnerPasswordResetRequest(request(), { ...runtime, NODE_ENV: "test" })).toBe(false);
  });

  it("rejects public, non-production, and invalid-password requests", async () => {
    expect((await handleOwnerPasswordReset(request("shivayonic.com"), runtime)).status).toBe(404);
    expect((await handleOwnerPasswordReset(request(), { ...runtime, VERCEL_ENV: "preview" })).status).toBe(404);
    expect((await handleOwnerPasswordReset(request(runtime.VERCEL_URL, "short"), runtime)).status).toBe(422);
  });

  it("resets exactly once and never includes the password in a response", async () => {
    const state = store();
    const reset = vi.fn(async () => undefined);
    const result = await runOwnerPasswordReset("a-safe-new-password", state, reset);
    expect(result).toEqual({ status: "SUCCEEDED" });
    expect(reset).toHaveBeenCalledTimes(1);
    expect(state.finish).toHaveBeenCalledWith("SUCCEEDED");
    const response = await handleOwnerPasswordReset(request(runtime.VERCEL_URL, "do-not-return-this-password"), runtime, async () => result);
    expect(await response.text()).not.toContain("do-not-return-this-password");
  });

  it("does not reset when claimed, used, or failed", async () => {
    for (const claim of ["RUNNING", "SUCCEEDED", "FAILED"] as const) {
      const reset = vi.fn(async () => undefined);
      await runOwnerPasswordReset("a-safe-new-password", store(claim), reset);
      expect(reset).not.toHaveBeenCalled();
    }
  });

  it("sanitizes reset failures", async () => {
    const response = await handleOwnerPasswordReset(request(runtime.VERCEL_URL, "a-safe-new-password"), runtime, async () => ({ status: "FAILED" }));
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('{"ok":false,"error":"RESET_FAILED"}');
  });
});
