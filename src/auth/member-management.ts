import type { MemberRole } from "@/shared/auth";

export type MembershipSnapshot = {
  userId: string;
  organizationId: string;
  role: MemberRole;
};

export type MemberMutation =
  | { type: "add"; targetUserId: string; targetRole: MemberRole; organizationId: string }
  | { type: "change-role"; targetUserId: string; targetRole: MemberRole; organizationId: string }
  | { type: "remove"; targetUserId: string; organizationId: string };

export type MemberMutationDecision = { allowed: true } | { allowed: false; reason: string };

export function authorizeMemberMutation(input: {
  actor: MembershipSnapshot;
  target?: MembershipSnapshot;
  mutation: MemberMutation;
  ownerCount: number;
}): MemberMutationDecision {
  const { actor, mutation, ownerCount, target } = input;

  if (actor.organizationId !== mutation.organizationId) {
    return { allowed: false, reason: "ORGANIZATION_MEMBERSHIP_REQUIRED" };
  }

  if (target && target.organizationId !== actor.organizationId) {
    return { allowed: false, reason: "ORGANIZATION_MEMBERSHIP_REQUIRED" };
  }

  if (actor.role === "STAFF") {
    return { allowed: false, reason: "PERMISSION_DENIED" };
  }

  if (actor.role === "ADMIN") {
    if ("targetRole" in mutation && mutation.targetRole === "OWNER") return { allowed: false, reason: "ROLE_NOT_ALLOWED" };
    if (mutation.targetUserId === actor.userId) return { allowed: false, reason: "ROLE_NOT_ALLOWED" };
    if (target?.role === "OWNER") return { allowed: false, reason: "ROLE_NOT_ALLOWED" };
  }

  if (target?.role === "OWNER" && ownerCount <= 1) {
    return { allowed: false, reason: "ROLE_NOT_ALLOWED" };
  }

  return { allowed: true };
}
