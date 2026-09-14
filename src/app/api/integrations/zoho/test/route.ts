import { NextResponse } from "next/server";
import { requirePermission } from "@/auth/context";
import { AppAuthError } from "@/auth/errors";
import { verifyZohoOrganization, ZohoError } from "@/lib/zoho";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const context = await requirePermission("INTEGRATIONS_MANAGE", { headers: request.headers });
    if (context.organization.slug !== (process.env.PUBLIC_ORGANIZATION_SLUG ?? "shivayonic")) {
      throw new AppAuthError("PERMISSION_DENIED", 403);
    }
    await verifyZohoOrganization();
    return NextResponse.json({ ok: true, organizationVerified: true }, { headers });
  } catch (error) {
    if (error instanceof AppAuthError) return NextResponse.json({ error: { code: error.code } }, { status: error.status, headers });
    const code = error instanceof ZohoError ? error.code : "ZOHO_UNAVAILABLE";
    return NextResponse.json({ error: { code } }, { status: 503, headers });
  }
}
