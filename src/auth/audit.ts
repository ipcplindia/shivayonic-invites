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
  | "MEDIA_DELETED";

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
