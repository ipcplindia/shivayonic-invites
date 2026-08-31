import type { ReactNode } from "react";

import type { CurrentUserContext, Permission } from "@/shared/auth";

/**
 * UI-level permission helpers.
 *
 * These exist so the interface does not offer an operator a control the server
 * will reject. They are NOT a security boundary: every API route re-checks the
 * caller's permissions server-side, and that check remains authoritative.
 *
 * The permission list comes from `GET /api/me` (derived server-side from the
 * membership role), so no role matrix is duplicated on the client.
 */

export function can(context: CurrentUserContext, permission: Permission) {
  return context.permissions.includes(permission);
}

export function canAny(context: CurrentUserContext, permissions: readonly Permission[]) {
  return permissions.some((permission) => can(context, permission));
}

export function canAll(context: CurrentUserContext, permissions: readonly Permission[]) {
  return permissions.every((permission) => can(context, permission));
}

export function PermissionGate({
  context,
  permission,
  fallback = null,
  children,
}: {
  context: CurrentUserContext;
  permission: Permission | readonly Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const granted = Array.isArray(permission)
    ? canAny(context, permission)
    : can(context, permission as Permission);
  return <>{granted ? children : fallback}</>;
}
