import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { recordSecurityAudit } from "@/auth/audit";
import { prisma } from "@/db/client";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  const response = await auth.api.signOut({ headers: request.headers, asResponse: true });
  const membership = session?.user?.id
    ? await prisma.organizationMember.findFirst({ where: { userId: session.user.id }, select: { organizationId: true } })
    : null;

  await recordSecurityAudit({
    action: "LOGOUT",
    organizationId: membership?.organizationId,
    actorUserId: session?.user?.id,
    entityType: "Session",
    entityId: session?.session?.id,
  });

  const redirect = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.headers.getSetCookie().forEach((cookie) => redirect.headers.append("set-cookie", cookie));
  return redirect;
}
