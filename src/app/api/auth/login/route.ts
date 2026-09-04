import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth/auth";
import { recordSecurityAudit } from "@/auth/audit";
import { checkLoginRateLimit } from "@/auth/rate-limit";
import { prisma } from "@/db/client";

const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
}).strict();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginInputSchema.safeParse(body);
  const email = parsed.success ? parsed.data.email : "invalid";

  const limit = await checkLoginRateLimit(email, request.headers).catch(() => ({ allowed: false, retryAfter: 60 }));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: "TOO_MANY_REQUESTS" } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_CREDENTIALS" } }, { status: 401 });
  }

  try {
    const response = await auth.api.signInEmail({ body: parsed.data, asResponse: true, headers: request.headers });
    if (!response.ok) throw new Error("INVALID_CREDENTIALS");
    const user = await prisma.user.findUnique({ where: { email }, include: { memberships: { take: 1 } } });
    await recordSecurityAudit({
      action: "LOGIN_SUCCEEDED",
      organizationId: user?.memberships[0]?.organizationId,
      actorUserId: user?.id,
      entityType: "Session",
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
    });
    return NextResponse.json({ error: { code: "INVALID_CREDENTIALS" } }, { status: 401 });
  }
}
