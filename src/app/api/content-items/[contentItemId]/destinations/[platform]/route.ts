import { NextResponse } from "next/server";

import { recordSecurityAudit } from "@/auth/audit";
import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { saveDestination } from "@/core/publishing";
import { destinationInputSchema } from "@/shared/content";

function failure(error: unknown) {
  if (error instanceof AppAuthError) return authErrorResponse(error);
  return NextResponse.json({ error: { code: "DESTINATION_UNAVAILABLE" } }, { status: 503 });
}

export async function PUT(request: Request, route: { params: Promise<{ contentItemId: string; platform: string }> }) {
  try {
    const context = await requirePermission("PUBLISH_CONTENT", { headers: request.headers });
    const { contentItemId, platform } = await route.params;
    const parsed = destinationInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || parsed.data.platform !== platform) return NextResponse.json({ error: { code: "INVALID_DESTINATION_INPUT" } }, { status: 400 });
    const destination = await saveDestination({
      organizationId: context.organization.id,
      contentItemId,
      platform: parsed.data.platform,
      enabled: parsed.data.enabled,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : undefined,
      metadata: parsed.data.metadata,
    });
    await recordSecurityAudit({ action: "CONTENT_DESTINATION_SAVED", organizationId: context.organization.id, actorUserId: context.user.id, entityType: "ContentDestination", entityId: destination.id, metadata: { platform: destination.platform } });
    return NextResponse.json({ destination });
  } catch (error) { return failure(error); }
}
