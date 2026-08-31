import { AppAuthError } from "@/auth/errors";
import type { CurrentUserContext, Permission } from "@/shared/auth";

export function assertOrganizationAccess(context: CurrentUserContext, organizationId: string) {
  if (context.organization.id !== organizationId) {
    throw new AppAuthError("ORGANIZATION_MEMBERSHIP_REQUIRED", 403);
  }
}

export function assertOrganizationPermission(context: CurrentUserContext, organizationId: string, permission: Permission) {
  assertOrganizationAccess(context, organizationId);
  if (!context.permissions.includes(permission)) {
    throw new AppAuthError("PERMISSION_DENIED", 403);
  }
}

export function assertProjectBelongsToOrganization(project: { organizationId: string }, organizationId: string) {
  if (project.organizationId !== organizationId) {
    throw new AppAuthError("ORGANIZATION_MEMBERSHIP_REQUIRED", 403);
  }
}
