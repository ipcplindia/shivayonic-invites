import { NextResponse } from "next/server";

import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { prisma } from "@/db/client";

export async function GET(request: Request) {
  try {
    const context = await requirePermission("PUBLISH_CONTENT", { headers: request.headers });
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const provider = params.get("provider");
    const jobs = await prisma.publishJob.findMany({
      where: { organizationId: context.organization.id, ...(status ? { status: status as never } : {}), ...(provider ? { provider: provider as never } : {}) },
      include: { contentItem: { select: { id: true, title: true } }, destination: { select: { platform: true } }, createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    if (error instanceof AppAuthError) return authErrorResponse(error);
    return NextResponse.json({ error: { code: "PUBLISH_JOBS_UNAVAILABLE" } }, { status: 503 });
  }
}
