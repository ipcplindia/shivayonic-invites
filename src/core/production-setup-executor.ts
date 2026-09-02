import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { executeProductionSetup, matchesBearerToken } from "@/core/production-setup";

const EXECUTOR_IDENTIFIER = "internal:shivayonic:production-setup-executor";
const EXECUTOR_LOCK = "shivayonic.production-setup-executor";
const EXECUTOR_EXPIRY_MS = 60 * 60 * 1_000;

type Runtime = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  PRODUCTION_SETUP_EXECUTOR_ENABLED?: string;
  PRODUCTION_SETUP_EXECUTOR_TOKEN?: string;
};
type SetupResult = Awaited<ReturnType<typeof executeProductionSetup>>;
type ExecutorStatus = "RUNNING" | "SUCCEEDED" | "FAILED";
export type ExecutorStore = {
  claim(): Promise<ExecutorStatus | "NOT_STARTED">;
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

export function executorRequestAllowed(request: Request, runtime: Runtime = process.env) {
  return isProductionExecutorRuntime(runtime)
    && runtime.PRODUCTION_SETUP_EXECUTOR_ENABLED === "true"
    && !!runtime.PRODUCTION_SETUP_EXECUTOR_TOKEN
    && matchesBearerToken(request, runtime.PRODUCTION_SETUP_EXECUTOR_TOKEN);
}

function createExecutorStore(): ExecutorStore {
  let verificationId: string | undefined;
  return {
    async claim() {
      return prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${EXECUTOR_LOCK}))`);
        const existing = await transaction.verification.findFirst({
          where: { identifier: EXECUTOR_IDENTIFIER },
          orderBy: { createdAt: "desc" },
          select: { id: true, value: true },
        });
        if (existing) return existing.value as ExecutorStatus;

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
): Promise<ProductionSetupExecutorResult> {
  const claimed = await store.claim();
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
  run: () => Promise<ProductionSetupExecutorResult> = runProductionSetupExecutor,
) {
  if (!isProductionExecutorRuntime(runtime) || runtime.PRODUCTION_SETUP_EXECUTOR_ENABLED !== "true") {
    return Response.json({ ok: false }, { status: 404 });
  }
  if (!runtime.PRODUCTION_SETUP_EXECUTOR_TOKEN || !executorRequestAllowed(request, runtime)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    const result = await run();
    return Response.json({ ok: result.status === "SUCCEEDED", ...result }, { status: result.status === "FAILED" ? 500 : 200 });
  } catch {
    return Response.json({ ok: false, status: "FAILED" }, { status: 500 });
  }
}
