import type { MemberRole, Permission } from "@/shared/auth";

export const rolePermissions = {
  OWNER: [
    "ORGANIZATION_MANAGE",
    "MEMBERS_MANAGE",
    "USERS_MANAGE",
    "INTEGRATIONS_MANAGE",
    "PROJECT_READ",
    "PROJECT_WRITE",
    "MEDIA_READ",
    "MEDIA_WRITE",
    "MEDIA_HARD_DELETE",
    "CONTENT_MANAGE",
    "CATALOGUE_MANAGE",
    "CUSTOMERS_VIEW",
    "ORDERS_MANAGE",
    "PUBLISH_CONTENT",
    "ANALYTICS_VIEW",
    "AUDIT_READ",
    "SECURITY_VIEW",
  ],
  ADMIN: [
    "PROJECT_READ", "PROJECT_WRITE", "MEDIA_READ", "MEDIA_WRITE", "CONTENT_MANAGE", "CATALOGUE_MANAGE",
    "CUSTOMERS_VIEW", "ORDERS_MANAGE", "PUBLISH_CONTENT", "ANALYTICS_VIEW", "AUDIT_READ",
  ],
  STAFF: ["PROJECT_READ", "MEDIA_READ", "MEDIA_WRITE", "CONTENT_MANAGE", "CUSTOMERS_VIEW"],
} as const satisfies Record<MemberRole, readonly Permission[]>;

export function getPermissionsForRole(role: MemberRole): Permission[] {
  return [...rolePermissions[role]];
}

export function hasPermission(member: { role: MemberRole }, permission: Permission) {
  return (rolePermissions[member.role] as readonly Permission[]).includes(permission);
}

export function assertPermission(member: { role: MemberRole }, permission: Permission) {
  if (!hasPermission(member, permission)) {
    throw new Error("PERMISSION_DENIED");
  }
}

/** Named policy helpers keep sensitive checks readable in routes and tests. */
export const permissionPolicy = {
  canManageUsers: "USERS_MANAGE",
  canManageRoles: "USERS_MANAGE",
  canManageIntegrations: "INTEGRATIONS_MANAGE",
  canHardDeleteMedia: "MEDIA_HARD_DELETE",
  canManageCatalogue: "CATALOGUE_MANAGE",
  canManageOrders: "ORDERS_MANAGE",
  canViewAnalytics: "ANALYTICS_VIEW",
  canPublishContent: "PUBLISH_CONTENT",
  canViewSecurity: "SECURITY_VIEW",
} as const satisfies Record<string, Permission>;
