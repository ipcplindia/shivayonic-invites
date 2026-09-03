import { NextResponse } from "next/server";

import { runWebsitePublicationsMigration, WEBSITE_PUBLICATIONS_MIGRATION } from "@/core/website-publications-migration-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PUBLIC_HOSTS = new Set(["shivayonic.com", "www.shivayonic.com"]);

function requestHost(request: Request) {
  return request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
}

function allowedDeploymentHost(host: string) {
  const vercelUrl = process.env.VERCEL_URL?.toLowerCase();
  return Boolean(host && vercelUrl && host === vercelUrl && host.endsWith(".vercel.app") && !PUBLIC_HOSTS.has(host));
}

function notFound() {
  return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
}

function sanitizedFailure(error: unknown) {
  const code = error instanceof Error && error.message === "FAILED_MIGRATION_BLOCKS_DEPLOY"
    ? "FAILED_MIGRATION_BLOCKS_DEPLOY"
    : error instanceof Error && error.message === "MIGRATION_SQL_EMPTY"
      ? "MIGRATION_SQL_EMPTY"
      : "MIGRATION_FAILED";
  return NextResponse.json({ migration: WEBSITE_PUBLICATIONS_MIGRATION, ok: false, error: { code } }, { status: 500 });
}

async function run(request: Request) {
  if (process.env.VERCEL_ENV !== "production") return notFound();
  if (!allowedDeploymentHost(requestHost(request))) return notFound();

  try {
    return NextResponse.json(await runWebsitePublicationsMigration());
  } catch (error) {
    return sanitizedFailure(error);
  }
}

export async function POST(request: Request) {
  return run(request);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("confirm") !== WEBSITE_PUBLICATIONS_MIGRATION) return notFound();
  return run(request);
}
