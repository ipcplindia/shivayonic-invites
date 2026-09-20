import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { requireRole } from "@/auth/context";

const run = promisify(execFile);
const MIGRATION = "20260906000000_payment_security_foundation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function migrate(request: Request) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const confirmed = new URL(request.url).searchParams.get("confirm");
  const protectedHost = host.endsWith(".vercel.app") || host === "www.shivayonic.com";
  if (process.env.VERCEL_ENV !== "production" || !protectedHost || confirmed !== MIGRATION) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }
  try {
    await requireRole("OWNER", { headers: request.headers });
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    await run(command, ["prisma", "migrate", "deploy"], { env: process.env, timeout: 120_000 });
    return NextResponse.json({ migration: MIGRATION, ok: true });
  } catch (error) {
    const record = error && typeof error === "object" ? error as { code?: unknown; stderr?: unknown; stdout?: unknown } : {};
    const detail = typeof record.stderr === "string"
      ? record.stderr.split(/\r?\n/).map((line) => line.trim()).find((line) => /error|P\d{4}|migration/i.test(line))?.slice(0, 180)
      : undefined;
    console.error("Production migration failed", {
      code: typeof record.code === "string" || typeof record.code === "number" ? record.code : "UNKNOWN",
      detail,
    });
    return NextResponse.json({ migration: MIGRATION, ok: false, error: { code: "MIGRATION_FAILED" } }, { status: 500 });
  }
}

export const GET = migrate;
export const POST = migrate;
