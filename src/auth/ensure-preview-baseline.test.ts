import { beforeEach, describe, expect, it, vi } from "vitest";

const bootstrap = vi.hoisted(() => vi.fn());
vi.mock("./bootstrap-owner", () => ({ bootstrapOwner: bootstrap }));

import { ensurePreviewBaseline } from "./ensure-preview-baseline";

describe("Preview baseline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete (globalThis as typeof globalThis & { previewBaseline?: Promise<void> }).previewBaseline;
    delete process.env.VERCEL_ENV;
  });

  it("does not bootstrap outside Preview", async () => {
    await ensurePreviewBaseline();
    expect(bootstrap).not.toHaveBeenCalled();
  });

  it("shares one idempotent bootstrap across concurrent Preview requests", async () => {
    process.env.VERCEL_ENV = "preview";
    bootstrap.mockResolvedValue({ owner: true });
    await Promise.all([ensurePreviewBaseline(), ensurePreviewBaseline()]);
    expect(bootstrap).toHaveBeenCalledTimes(1);
  });
});
