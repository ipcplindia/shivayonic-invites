import "server-only";

import { prisma } from "@/db/client";

export type SecurityAuditAction =
  | "ADMIN_BOOTSTRAPPED"
  | "LOGIN_SUCCEEDED"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "MEMBER_ROLE_CHANGED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "SESSION_REVOKED"
  | "MEDIA_UPLOAD_CREATED"
  | "MEDIA_UPLOADED"
  | "MEDIA_UPLOAD_FAILED"
  | "MEDIA_READY"
  | "MEDIA_ARCHIVED"
  | "MEDIA_DELETED"
  | "MEDIA_METADATA_UPDATED"
  | "WEBSITE_PUBLICATION_CREATED"
  | "WEBSITE_PUBLICATION_UPDATED"
  | "WEBSITE_PUBLICATION_PUBLISHED"
  | "WEBSITE_PUBLICATION_UNPUBLISHED"
  | "WEBSITE_PUBLICATION_DELETED"
  | "CATALOGUE_CATEGORY_CHANGED"
  | "CATALOGUE_STYLE_CHANGED"
  | "CATALOGUE_PRODUCT_CHANGED"
  | "CATALOGUE_PLAN_CHANGED"
  | "CATALOGUE_PRODUCT_DELETED"
  | "CATALOGUE_PLAN_DELETED"
  | "CONTENT_ITEM_CREATED"
  | "CONTENT_ITEM_UPDATED"
  | "CONTENT_DESTINATION_SAVED"
  | "PUBLISH_JOB_CREATED"
  | "PUBLISH_JOB_PUBLISHED";

export async function recordSecurityAudit(input: {
  action: SecurityAuditAction;
  organizationId?: string;
  actorUserId?: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  if (!input.organizationId) return;

  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? undefined,
    },
  });
}
