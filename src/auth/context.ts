import "server-only";

import { headers } from "next/headers";
import { auth } from "@/auth/auth";
import { AppAuthError } from "@/auth/errors";
import { getPermissionsForRole } from "@/auth/permissions";
import { consumeDurableRateLimit } from "@/auth/rate-limit";
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
  await enforceMutationRateLimit(context.user.id, input.headers);
  return context;
}

export async function requireRole(role: MemberRole, input: { organizationId?: string; headers?: Headers } = {}) {
  const context = await getCurrentUserContext(input);
  if (context.role !== role) {
    throw new AppAuthError("ROLE_NOT_ALLOWED", 403);
  }
  await enforceMutationRateLimit(context.user.id, input.headers);
  return context;
}

async function enforceMutationRateLimit(userId: string, requestHeaders?: Headers) {
  const method = requestHeaders?.get("x-shivayonic-method");
  if (!method || ["GET", "HEAD", "OPTIONS"].includes(method)) return;
  const route = requestHeaders?.get("x-shivayonic-route") ?? "unknown";
  const rule = method === "DELETE" ? { window: 60, max: 10 } : { window: 60, max: 60 };
  const decision = await consumeDurableRateLimit(`admin:${userId}:${method}:${route}`, rule);
  if (!decision.allowed) throw new AppAuthError("RATE_LIMITED", 429);
}
