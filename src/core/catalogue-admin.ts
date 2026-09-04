import { revalidatePath } from "next/cache";

import { recordSecurityAudit, type SecurityAuditAction } from "@/auth/audit";
import type { CurrentUserContext } from "@/shared/auth";
import { publicationPathsForCatalogue } from "@/core/catalogue-management";
import { prisma } from "@/db/client";

export async function assertReadyMedia(mediaAssetId: string | undefined, organizationId: string) {
  if (!mediaAssetId) return;
  const media = await prisma.mediaAsset.findFirst({ where: { id: mediaAssetId, organizationId, status: "READY", archivedAt: null } });
  if (!media) throw new Error("CATALOGUE_MEDIA_NOT_READY");
}

export async function assertCategory(id: string, organizationId: string) {
  const category = await prisma.publicCategory.findFirst({ where: { id, OR: [{ organizationId }, { organizationId: null }] } });
  if (!category) throw new Error("CATALOGUE_CATEGORY_NOT_FOUND");
  return category;
}

export async function assertStyles(ids: string[], organizationId: string) {
  if (!ids.length) return;
  const count = await prisma.visualStyle.count({ where: { id: { in: ids }, OR: [{ organizationId }, { organizationId: null }] } });
  if (count !== new Set(ids).size) throw new Error("CATALOGUE_STYLE_NOT_FOUND");
}

export async function auditCatalogue(context: CurrentUserContext, action: SecurityAuditAction, entityType: string, entityId?: string) {
  await recordSecurityAudit({ action, organizationId: context.organization.id, actorUserId: context.user.id, entityType, entityId });
}

export function revalidateCatalogue(input?: { slug?: string | null; isPlan?: boolean }) {
  for (const path of publicationPathsForCatalogue(input)) revalidatePath(path);
}

export function adminFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "CATALOGUE_UNAVAILABLE";
  if (message === "CATALOGUE_MEDIA_NOT_READY") return { code: "CATALOGUE_MEDIA_NOT_READY", status: 409 };
  if (message === "CATALOGUE_CATEGORY_NOT_FOUND") return { code: "CATALOGUE_CATEGORY_NOT_FOUND", status: 404 };
  if (message === "CATALOGUE_STYLE_NOT_FOUND") return { code: "CATALOGUE_STYLE_NOT_FOUND", status: 404 };
  if ((error as { code?: string }).code === "P2002") return { code: "CATALOGUE_SLUG_EXISTS", status: 409 };
  return { code: "CATALOGUE_UNAVAILABLE", status: 503 };
}
