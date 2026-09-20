import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { requireRole } from "@/auth/context";

const run = promisify(execFile);
const MIGRATION = "20260906000000_payment_security_foundation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const confirmed = new URL(request.url).searchParams.get("confirm");
  if (process.env.VERCEL_ENV !== "production" || !host.endsWith(".vercel.app") || confirmed !== MIGRATION) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }
  try {
    await requireRole("OWNER", { headers: request.headers });
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    await run(command, ["prisma", "migrate", "deploy"], { env: process.env, timeout: 120_000 });
    return NextResponse.json({ migration: MIGRATION, ok: true });
  } catch (error) {
    console.error("Production migration failed", { code: error && typeof error === "object" && "code" in error ? (error as { code?: unknown }).code : "UNKNOWN" });
    return NextResponse.json({ migration: MIGRATION, ok: false, error: { code: "MIGRATION_FAILED" } }, { status: 500 });
  }
}
