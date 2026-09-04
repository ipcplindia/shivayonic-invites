import { NextResponse } from "next/server";

import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { prisma } from "@/db/client";

export async function GET(request: Request) {
  try {
    const context = await requirePermission("ANALYTICS_VIEW", { headers: request.headers });
    const snapshots = await prisma.contentMetricSnapshot.findMany({
      where: { organizationId: context.organization.id },
      include: { contentItem: { select: { id: true, title: true } } },
      orderBy: { capturedAt: "desc" },
      take: 100,
    });
    const websiteEvents = await prisma.websiteAnalyticsEvent.groupBy({
      by: ["eventType"],
      where: { organizationId: context.organization.id },
      _count: { _all: true },
    });
    return NextResponse.json({ snapshots, websiteEvents });
  } catch (error) {
    if (error instanceof AppAuthError) return authErrorResponse(error);
    return NextResponse.json({ error: { code: "ANALYTICS_UNAVAILABLE" } }, { status: 503 });
  }
}
