import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  executorRequestAllowed,
  handleProductionSetupExecutor,
  isCurrentVercelDeploymentRequest,
  isProductionExecutorRuntime,
  requestAllowsFailedRetry,
  runProductionSetupExecutor,
  type ExecutorStore,
} from "@/core/production-setup-executor";

const runtime = {
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  VERCEL_URL: "shivayonic-invites-example-shivayonic.vercel.app",
  PRODUCTION_SETUP_EXECUTOR_ENABLED: "true",
};

function request(host = runtime.VERCEL_URL, retryFailed = false) {
  return new Request(`https://${host}/api/internal/production-setup-executor${retryFailed ? "?retry=failed" : ""}`, {
    method: "POST",
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

  it("rejects non-production, disabled, and public-domain requests", async () => {
    const nonProduction = await handleProductionSetupExecutor(request(), { ...runtime, NODE_ENV: "test" });
    const disabled = await handleProductionSetupExecutor(request(), { ...runtime, PRODUCTION_SETUP_EXECUTOR_ENABLED: "false" });
    const publicDomain = await handleProductionSetupExecutor(request("www.shivayonic.com"), runtime);
    expect(nonProduction.status).toBe(404);
    expect(disabled.status).toBe(404);
    expect(publicDomain.status).toBe(404);
  });

  it("accepts only the server-provided current deployment hostname", async () => {
    expect(isCurrentVercelDeploymentRequest(request(), runtime)).toBe(true);
    expect(executorRequestAllowed(request(), runtime)).toBe(true);
    expect(isCurrentVercelDeploymentRequest(request("shivayonic.com"), runtime)).toBe(false);
    expect(isCurrentVercelDeploymentRequest(request(), { ...runtime, VERCEL_URL: undefined })).toBe(false);
    const response = await handleProductionSetupExecutor(request(), runtime, async () => ({ status: "SUCCEEDED" }));
    expect(response.status).toBe(200);
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

  it("retries only an explicitly requested failed state", async () => {
    expect(requestAllowsFailedRetry(request())).toBe(false);
    expect(requestAllowsFailedRetry(request(runtime.VERCEL_URL, true))).toBe(true);
    const failed = store("FAILED");
    const execute = vi.fn(async () => cleanSetup);
    const blocked = await runProductionSetupExecutor(failed, execute);
    expect(blocked).toEqual({ status: "FAILED" });
    expect(execute).not.toHaveBeenCalled();

    const retryStore: ExecutorStore = {
      claim: vi.fn().mockResolvedValue("NOT_STARTED"),
      finish: vi.fn().mockResolvedValue(undefined),
    };
    await runProductionSetupExecutor(retryStore, execute, true);
    expect(retryStore.claim).toHaveBeenCalledWith(true);
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

  it("sanitizes failures without setup-secret material", async () => {
    const result = await runProductionSetupExecutor(store(), async () => { throw new Error("PRODUCTION_SETUP_TOKEN"); });
    expect(result).toEqual({ status: "FAILED" });
    const response = await handleProductionSetupExecutor(request(), runtime, async () => result);
    const body = await response.text();
    expect(response.status).toBe(500);
    expect(body).not.toContain("PRODUCTION_SETUP_TOKEN");
  });
});
