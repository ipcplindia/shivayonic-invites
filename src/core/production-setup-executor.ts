import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { executeProductionSetup } from "@/core/production-setup";

const EXECUTOR_IDENTIFIER = "internal:shivayonic:production-setup-executor";
const EXECUTOR_LOCK = "shivayonic.production-setup-executor";
const EXECUTOR_EXPIRY_MS = 60 * 60 * 1_000;

type Runtime = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
  PRODUCTION_SETUP_EXECUTOR_ENABLED?: string;
};
type SetupResult = Awaited<ReturnType<typeof executeProductionSetup>>;
type ExecutorStatus = "RUNNING" | "SUCCEEDED" | "FAILED";
export type ExecutorStore = {
  claim(retryFailed: boolean): Promise<ExecutorStatus | "NOT_STARTED">;
  finish(status: Exclude<ExecutorStatus, "RUNNING">): Promise<void>;
};

export type ProductionSetupExecutorResult = {
  status: ExecutorStatus | "DISABLED";
  first?: SetupResult;
  second?: SetupResult;
  idempotent?: boolean;
};

export function isProductionExecutorRuntime(runtime: Runtime) {
  return runtime.NODE_ENV === "production" && runtime.VERCEL_ENV === "production";
}

export function isCurrentVercelDeploymentRequest(request: Request, runtime: Runtime = process.env) {
  if (!runtime.VERCEL_URL) return false;
  try {
    return new URL(request.url).hostname.toLowerCase() === runtime.VERCEL_URL.toLowerCase();
  } catch {
    return false;
  }
}

export function executorRequestAllowed(request: Request, runtime: Runtime = process.env) {
  return isProductionExecutorRuntime(runtime)
    && runtime.PRODUCTION_SETUP_EXECUTOR_ENABLED === "true"
    && isCurrentVercelDeploymentRequest(request, runtime);
}

export function requestAllowsFailedRetry(request: Request) {
  try {
    return new URL(request.url).searchParams.get("retry") === "failed";
  } catch {
    return false;
  }
}

function createExecutorStore(): ExecutorStore {
  let verificationId: string | undefined;
  return {
    async claim(retryFailed) {
      return prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${EXECUTOR_LOCK}))`);
        const existing = await transaction.verification.findFirst({
          where: { identifier: EXECUTOR_IDENTIFIER },
          orderBy: { createdAt: "desc" },
          select: { id: true, value: true },
        });
        if (existing) {
          if (existing.value !== "FAILED" || !retryFailed) return existing.value as ExecutorStatus;
          verificationId = existing.id;
          await transaction.verification.update({
            where: { id: existing.id },
            data: { value: "RUNNING", expiresAt: new Date(Date.now() + EXECUTOR_EXPIRY_MS) },
          });
          console.info(JSON.stringify({ event: "production_setup_executor_failed_retry_claimed" }));
          return "NOT_STARTED" as const;
        }

        const created = await transaction.verification.create({
          data: {
            identifier: EXECUTOR_IDENTIFIER,
            value: "RUNNING",
            expiresAt: new Date(Date.now() + EXECUTOR_EXPIRY_MS),
          },
          select: { id: true },
        });
        verificationId = created.id;
        return "NOT_STARTED" as const;
      });
    },
    async finish(status) {
      if (!verificationId) throw new Error("Production setup executor state unavailable.");
      await prisma.verification.update({ where: { id: verificationId }, data: { value: status } });
    },
  };
}

export async function runProductionSetupExecutor(
  store: ExecutorStore = createExecutorStore(),
  execute: () => Promise<SetupResult> = executeProductionSetup,
  retryFailed = false,
): Promise<ProductionSetupExecutorResult> {
  const claimed = await store.claim(retryFailed);
  if (claimed !== "NOT_STARTED") return { status: claimed };

  try {
    const first = await execute();
    const second = await execute();
    const idempotent = !second.changed;
    if (!idempotent) {
      await store.finish("FAILED");
      return { status: "FAILED", first, second, idempotent };
    }
    await store.finish("SUCCEEDED");
    return { status: "SUCCEEDED", first, second, idempotent };
  } catch {
    await store.finish("FAILED").catch(() => undefined);
    return { status: "FAILED" };
  }
}

export async function handleProductionSetupExecutor(
  request: Request,
  runtime: Runtime = process.env,
  run: (retryFailed: boolean) => Promise<ProductionSetupExecutorResult> = (retryFailed) =>
    runProductionSetupExecutor(undefined, undefined, retryFailed),
) {
  if (!isProductionExecutorRuntime(runtime) || runtime.PRODUCTION_SETUP_EXECUTOR_ENABLED !== "true") {
    return Response.json({ ok: false }, { status: 404 });
  }
  if (!executorRequestAllowed(request, runtime)) {
    return Response.json({ ok: false }, { status: 404 });
  }

  try {
    const result = await run(requestAllowsFailedRetry(request));
    return Response.json({ ok: result.status === "SUCCEEDED", ...result }, { status: result.status === "FAILED" ? 500 : 200 });
  } catch {
    return Response.json({ ok: false, status: "FAILED" }, { status: 500 });
  }
}
