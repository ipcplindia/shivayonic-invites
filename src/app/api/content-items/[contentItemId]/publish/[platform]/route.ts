import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { publishDestination, publishingErrorCode } from "@/core/publishing";
import { destinationPlatforms, publishRequestSchema } from "@/shared/content";

export async function POST(request: Request, route: { params: Promise<{ contentItemId: string; platform: string }> }) {
  try {
    const context = await requirePermission("PUBLISH_CONTENT", { headers: request.headers });
    const { contentItemId, platform } = await route.params;
    if (!destinationPlatforms.includes(platform as never)) return NextResponse.json({ error: { code: "INVALID_PROVIDER" } }, { status: 400 });
    const parsed = publishRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_PUBLISH_INPUT" } }, { status: 400 });
    const job = await publishDestination({ organizationId: context.organization.id, actorUserId: context.user.id, contentItemId, platform: platform as (typeof destinationPlatforms)[number], idempotencyKey: parsed.data.idempotencyKey, scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : undefined });
    await recordSecurityAudit({ action: job.status === "PUBLISHED" ? "PUBLISH_JOB_PUBLISHED" : "PUBLISH_JOB_CREATED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "PublishJob", entityId: job.id, metadata: { provider: platform, status: job.status } });
    return NextResponse.json({ job }, { status: job.status === "PUBLISHED" ? 201 : 202 });
  } catch (error) {
    if (error instanceof AppAuthError) return authErrorResponse(error);
    const code = publishingErrorCode(error);
    return NextResponse.json({ error: { code } }, { status: code === "INTEGRATION_REQUIRED" ? 409 : 503 });
  }
}
