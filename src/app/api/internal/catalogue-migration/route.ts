import { NextResponse } from "next/server";

import { CATALOGUE_MIGRATION, runCatalogueMigration } from "@/core/catalogue-migration-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PUBLIC_HOSTS = new Set(["shivayonic.com", "www.shivayonic.com"]);

function notFound() {
  return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
}

function allowedHost(request: Request) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
  const deploymentHost = process.env.VERCEL_URL?.toLowerCase();
  return process.env.VERCEL_ENV === "production" && Boolean(deploymentHost && host === deploymentHost && host.endsWith(".vercel.app") && !PUBLIC_HOSTS.has(host));
}

function failure(error: unknown) {
  const code = error instanceof Error && ["FAILED_MIGRATION_BLOCKS_DEPLOY", "MIGRATION_SQL_EMPTY"].includes(error.message)
    ? error.message
    : "MIGRATION_FAILED";
  console.error("Catalogue migration failed", { code });
  return NextResponse.json({ migration: CATALOGUE_MIGRATION, ok: false, error: { code } }, { status: 500 });
}

export async function GET(request: Request) {
  if (!allowedHost(request)) return notFound();
  if (new URL(request.url).searchParams.get("confirm") !== CATALOGUE_MIGRATION) return notFound();
  try {
    return NextResponse.json(await runCatalogueMigration());
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  return GET(request);
}
