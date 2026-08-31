import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { recordSecurityAudit } from "@/auth/audit";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  const response = await auth.api.signOut({ headers: request.headers, asResponse: true });

  await recordSecurityAudit({
    action: "LOGOUT",
    organizationId: undefined,
    actorUserId: session?.user?.id,
    entityType: "Session",
    entityId: session?.session?.id,
  });

  const redirect = NextResponse.redirect(new URL("/login", request.url), 303);
  response.headers.getSetCookie().forEach((cookie) => redirect.headers.append("set-cookie", cookie));
  return redirect;
}
