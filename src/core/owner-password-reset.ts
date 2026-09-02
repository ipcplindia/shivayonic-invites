import "server-only";

import { Prisma } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

import { getServerConfig } from "@/config/env";
import { prisma } from "@/db/client";

const RESET_IDENTIFIER = "internal:shivayonic:production-owner-password-reset";
const RESET_LOCK = "shivayonic.production-owner-password-reset";
const RESET_EXPIRY_MS = 60 * 60 * 1_000;

type Runtime = { NODE_ENV?: string; VERCEL_ENV?: string; VERCEL_URL?: string };
type ResetStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

export type OwnerPasswordResetStore = {
  claim(): Promise<ResetStatus | "NOT_STARTED">;
  finish(status: Exclude<ResetStatus, "RUNNING">): Promise<void>;
};

export function isProductionOwnerPasswordResetRequest(request: Request, runtime: Runtime = process.env) {
  if (runtime.NODE_ENV !== "production" || runtime.VERCEL_ENV !== "production" || !runtime.VERCEL_URL) return false;
  try {
    return new URL(request.url).hostname.toLowerCase() === runtime.VERCEL_URL.toLowerCase();
  } catch {
    return false;
  }
}

function createResetStore(): OwnerPasswordResetStore {
  let verificationId: string | undefined;
  return {
    async claim() {
      return prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${RESET_LOCK}))`);
        const existing = await transaction.verification.findFirst({
          where: { identifier: RESET_IDENTIFIER }, orderBy: { createdAt: "desc" }, select: { id: true, value: true },
        });
        if (existing) return existing.value as ResetStatus;
        const created = await transaction.verification.create({
          data: { identifier: RESET_IDENTIFIER, value: "RUNNING", expiresAt: new Date(Date.now() + RESET_EXPIRY_MS) }, select: { id: true },
        });
        verificationId = created.id;
        return "NOT_STARTED" as const;
      });
    },
    async finish(status) {
      if (!verificationId) throw new Error("Owner password reset state unavailable.");
      await prisma.verification.update({ where: { id: verificationId }, data: { value: status } });
    },
  };
}

async function resetExistingOwnerPassword(password: string) {
  const email = getServerConfig().ADMIN_BOOTSTRAP_EMAIL;
  if (!email) throw new Error("Owner reset is unavailable.");
  const owner = await prisma.user.findFirst({
    where: { email, memberships: { some: { role: "OWNER" } } }, select: { id: true },
  });
  if (!owner) throw new Error("Owner reset is unavailable.");
  const credential = await prisma.account.findFirst({
    where: { userId: owner.id, providerId: "credential", accountId: owner.id }, select: { id: true },
  });
  if (!credential) throw new Error("Owner reset is unavailable.");
  const passwordHash = await hashPassword(password);
  await prisma.account.update({ where: { id: credential.id }, data: { password: passwordHash } });
}

export async function runOwnerPasswordReset(
  password: string,
  store: OwnerPasswordResetStore = createResetStore(),
  reset: (password: string) => Promise<void> = resetExistingOwnerPassword,
) {
  const claim = await store.claim();
  if (claim !== "NOT_STARTED") return { status: claim } as const;
  try {
    await reset(password);
    await store.finish("SUCCEEDED");
    return { status: "SUCCEEDED" } as const;
  } catch {
    await store.finish("FAILED").catch(() => undefined);
    return { status: "FAILED" } as const;
  }
}

export async function handleOwnerPasswordReset(
  request: Request,
  runtime: Runtime = process.env,
  run: (password: string) => ReturnType<typeof runOwnerPasswordReset> = (password) => runOwnerPasswordReset(password),
) {
  if (!isProductionOwnerPasswordResetRequest(request, runtime)) return Response.json({ ok: false }, { status: 404 });
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 12 || password.length > 128) return Response.json({ ok: false, error: "INVALID_PASSWORD" }, { status: 422 });
  const result = await run(password).catch(() => ({ status: "FAILED" as const }));
  if (result.status === "SUCCEEDED") return Response.json({ ok: true });
  if (result.status === "RUNNING") return Response.json({ ok: false, error: "RESET_RUNNING" }, { status: 409 });
  if (result.status === "FAILED") return Response.json({ ok: false, error: "RESET_FAILED" }, { status: 500 });
  return Response.json({ ok: false, error: "RESET_ALREADY_USED" }, { status: 409 });
}
