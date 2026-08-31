import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { recordSecurityAudit } from "@/auth/audit";
import { checkLoginRateLimit } from "@/auth/rate-limit";
import { prisma } from "@/db/client";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password || !checkLoginRateLimit(email)) {
    return NextResponse.json({ error: { code: "INVALID_CREDENTIALS" } }, { status: 401 });
  }

  try {
    const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true, headers: request.headers });
    const user = await prisma.user.findUnique({ where: { email }, include: { memberships: { take: 1 } } });
    await recordSecurityAudit({
      action: "LOGIN_SUCCEEDED",
      organizationId: user?.memberships[0]?.organizationId,
      actorUserId: user?.id,
      entityType: "Session",
      metadata: { email },
    });
    const sanitizedResponse = NextResponse.json({ ok: true });
    response.headers.getSetCookie().forEach((cookie) => sanitizedResponse.headers.append("set-cookie", cookie));
    return sanitizedResponse;
  } catch {
    const user = await prisma.user.findUnique({ where: { email }, include: { memberships: { take: 1 } } }).catch(() => null);
    await recordSecurityAudit({
      action: "LOGIN_FAILED",
      organizationId: user?.memberships[0]?.organizationId,
      actorUserId: user?.id,
      entityType: "User",
      entityId: user?.id,
      metadata: { email },
    });
    return NextResponse.json({ error: { code: "INVALID_CREDENTIALS" } }, { status: 401 });
  }
}
