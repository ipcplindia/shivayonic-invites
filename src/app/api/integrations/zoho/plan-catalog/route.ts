import { NextResponse } from "next/server";

import { AppAuthError } from "@/auth/errors";
import { requirePermission } from "@/auth/context";
import { configureZohoPlanCatalog } from "@/core/zoho-plan-catalog";
import { ZohoError } from "@/lib/zoho";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function previewDeployment(request: Request) {
  const host = new URL(request.url).hostname;
  return process.env.VERCEL_ENV === "preview" && host.endsWith(".vercel.app");
}

/** Preview-only OWNER action. Vercel Deployment Protection is the outer boundary. */
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!previewDeployment(request)) return new NextResponse(null, { status: 404, headers });
  try {
    const context = await requirePermission("INTEGRATIONS_MANAGE", { headers: new Headers({ ...Object.fromEntries(request.headers), "x-shivayonic-method": "POST", "x-shivayonic-route": "zoho-plan-catalog" }) });
    if (context.role !== "OWNER") return NextResponse.json({ error: { code: "OWNER_REQUIRED" } }, { status: 403, headers });
    return NextResponse.json({ ok: true, ...(await configureZohoPlanCatalog()) }, { headers });
  } catch (error) {
    if (error instanceof AppAuthError) return NextResponse.json({ error: { code: error.code } }, { status: error.status, headers });
    return NextResponse.json({ error: { code: error instanceof ZohoError ? error.code : "ZOHO_UNAVAILABLE" } }, { status: 503, headers });
  }
}
