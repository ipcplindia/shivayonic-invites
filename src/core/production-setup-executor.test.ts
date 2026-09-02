import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  executorRequestAllowed,
  handleProductionSetupExecutor,
  isProductionExecutorRuntime,
  runProductionSetupExecutor,
  type ExecutorStore,
} from "@/core/production-setup-executor";

const runtime = {
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  PRODUCTION_SETUP_EXECUTOR_ENABLED: "true",
  PRODUCTION_SETUP_EXECUTOR_TOKEN: "temporary-executor-token",
};

function request(token = runtime.PRODUCTION_SETUP_EXECUTOR_TOKEN) {
  return new Request("https://example.test/api/internal/production-setup-executor", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
}

function store(claimed: Awaited<ReturnType<ExecutorStore["claim"]>> = "NOT_STARTED") {
  const finish = vi.fn<ExecutorStore["finish"]>().mockResolvedValue(undefined);
  return { claim: vi.fn<ExecutorStore["claim"]>().mockResolvedValue(claimed), finish };
}

const cleanSetup = { owner: true, organization: true, cors: true, changed: false };

describe("production setup executor", () => {
  it("has no import-time setup side effect and recognizes only Vercel production", () => {
    expect(isProductionExecutorRuntime({ NODE_ENV: "test", VERCEL_ENV: "production" })).toBe(false);
    expect(isProductionExecutorRuntime(runtime)).toBe(true);
  });

  it("rejects non-production and disabled executor requests", async () => {
    const nonProduction = await handleProductionSetupExecutor(request(), { ...runtime, NODE_ENV: "test" });
    const disabled = await handleProductionSetupExecutor(request(), { ...runtime, PRODUCTION_SETUP_EXECUTOR_ENABLED: "false" });
    expect(nonProduction.status).toBe(404);
    expect(disabled.status).toBe(404);
  });

  it("requires a distinct executor token", async () => {
    expect(executorRequestAllowed(request("wrong"), runtime)).toBe(false);
    const missing = await handleProductionSetupExecutor(request(), { ...runtime, PRODUCTION_SETUP_EXECUTOR_TOKEN: undefined });
    const invalid = await handleProductionSetupExecutor(request("wrong"), runtime);
    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
  });

  it("runs shared setup exactly twice in sequence and persists success", async () => {
    const state = store();
    let releaseFirst!: () => void;
    let secondStarted = false;
    const execute = vi.fn()
      .mockImplementationOnce(() => new Promise<typeof cleanSetup>((resolve) => {
        releaseFirst = () => resolve({ ...cleanSetup, changed: true });
      }))
      .mockImplementationOnce(async () => {
        secondStarted = true;
        return cleanSetup;
      });
    const execution = runProductionSetupExecutor(state, execute);
    await Promise.resolve();
    expect(secondStarted).toBe(false);
    releaseFirst();
    const result = await execution;
    expect(execute).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ status: "SUCCEEDED", idempotent: true });
    expect(state.finish).toHaveBeenCalledWith("SUCCEEDED");
  });

  it("does not repeat a claimed or successful execution", async () => {
    const execute = vi.fn(async () => cleanSetup);
    const result = await runProductionSetupExecutor(store("SUCCEEDED"), execute);
    expect(result).toEqual({ status: "SUCCEEDED" });
    expect(execute).not.toHaveBeenCalled();
  });

  it("allows concurrent callers to claim only one execution", async () => {
    let state: "NOT_STARTED" | "RUNNING" = "NOT_STARTED";
    const atomicStore = (): ExecutorStore => ({
      claim: async () => {
        if (state === "NOT_STARTED") {
          state = "RUNNING";
          return "NOT_STARTED";
        }
        return "RUNNING";
      },
      finish: async () => undefined,
    });
    const execute = vi.fn()
      .mockResolvedValueOnce({ ...cleanSetup, changed: true })
      .mockResolvedValueOnce(cleanSetup);
    const [first, second] = await Promise.all([
      runProductionSetupExecutor(atomicStore(), execute),
      runProductionSetupExecutor(atomicStore(), execute),
    ]);
    expect(execute).toHaveBeenCalledTimes(2);
    expect([first.status, second.status].sort()).toEqual(["RUNNING", "SUCCEEDED"]);
  });

  it("sanitizes failures and never includes the executor token", async () => {
    const result = await runProductionSetupExecutor(store(), async () => { throw new Error("temporary-executor-token"); });
    expect(result).toEqual({ status: "FAILED" });
    const response = await handleProductionSetupExecutor(request(), runtime, async () => result);
    const body = await response.text();
    expect(response.status).toBe(500);
    expect(body).not.toContain(runtime.PRODUCTION_SETUP_EXECUTOR_TOKEN);
  });
});
