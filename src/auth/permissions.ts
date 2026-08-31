import type { MemberRole, Permission } from "@/shared/auth";

export const rolePermissions = {
  OWNER: [
    "ORGANIZATION_MANAGE",
    "MEMBERS_MANAGE",
    "PROJECT_READ",
    "PROJECT_WRITE",
    "MEDIA_READ",
    "MEDIA_WRITE",
    "AUDIT_READ",
  ],
  ADMIN: ["MEMBERS_MANAGE", "PROJECT_READ", "PROJECT_WRITE", "MEDIA_READ", "MEDIA_WRITE", "AUDIT_READ"],
  STAFF: ["PROJECT_READ", "PROJECT_WRITE", "MEDIA_READ", "MEDIA_WRITE"],
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
