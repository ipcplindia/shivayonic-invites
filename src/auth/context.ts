import "server-only";

import { headers } from "next/headers";
import { auth } from "@/auth/auth";
import { AppAuthError } from "@/auth/errors";
import { getPermissionsForRole } from "@/auth/permissions";
import { prisma } from "@/db/client";
import type { CurrentUserContext, MemberRole, Permission } from "@/shared/auth";

export async function getCurrentSession(requestHeaders?: Headers) {
  return auth.api.getSession({ headers: requestHeaders ?? (await headers()) });
}

export async function getCurrentUserContext(input: { organizationId?: string; headers?: Headers } = {}): Promise<CurrentUserContext> {
  const session = await getCurrentSession(input.headers);
  if (!session?.user?.id) {
    throw new AppAuthError("AUTHENTICATION_REQUIRED", 401);
  }

  const membership = input.organizationId
    ? await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: session.user.id, organizationId: input.organizationId } },
        include: { user: true, organization: true },
      })
    : await prisma.organizationMember.findFirst({
        where: { userId: session.user.id },
        include: { user: true, organization: true },
        orderBy: { organization: { createdAt: "asc" } },
      });

  if (!membership) {
    throw new AppAuthError("ORGANIZATION_MEMBERSHIP_REQUIRED", 403);
  }

  const role = membership.role as MemberRole;
  return {
    user: { id: membership.user.id, name: membership.user.name ?? membership.user.email, email: membership.user.email },
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
    },
    role,
    permissions: getPermissionsForRole(role),
  };
}

export async function requirePermission(permission: Permission, input: { organizationId?: string; headers?: Headers } = {}) {
  const context = await getCurrentUserContext(input);
  if (!context.permissions.includes(permission)) {
    throw new AppAuthError("PERMISSION_DENIED", 403);
  }
  return context;
}

export async function requireRole(role: MemberRole, input: { organizationId?: string; headers?: Headers } = {}) {
  const context = await getCurrentUserContext(input);
  if (context.role !== role) {
    throw new AppAuthError("ROLE_NOT_ALLOWED", 403);
  }
  return context;
}
