import { describe, expect, it } from "vitest";
import { authorizeMemberMutation, type MembershipSnapshot } from "@/auth/member-management";

const owner: MembershipSnapshot = { userId: "owner_1", organizationId: "org_a", role: "OWNER" };
const admin: MembershipSnapshot = { userId: "admin_1", organizationId: "org_a", role: "ADMIN" };
const staff: MembershipSnapshot = { userId: "staff_1", organizationId: "org_a", role: "STAFF" };

describe("member management authorization", () => {
  it("allows OWNER member administration", () => {
    expect(authorizeMemberMutation({
      actor: owner,
      mutation: { type: "add", targetUserId: "staff_2", targetRole: "STAFF", organizationId: "org_a" },
      ownerCount: 1,
    })).toEqual({ allowed: true });
  });

  it("blocks STAFF from member management", () => {
    expect(authorizeMemberMutation({
      actor: staff,
      mutation: { type: "change-role", targetUserId: "staff_2", targetRole: "ADMIN", organizationId: "org_a" },
      ownerCount: 1,
    })).toEqual({ allowed: false, reason: "PERMISSION_DENIED" });
  });

  it("blocks ADMIN self-promotion to OWNER", () => {
    expect(authorizeMemberMutation({
      actor: admin,
      target: admin,
      mutation: { type: "change-role", targetUserId: "admin_1", targetRole: "OWNER", organizationId: "org_a" },
      ownerCount: 1,
    })).toEqual({ allowed: false, reason: "ROLE_NOT_ALLOWED" });
  });

  it("blocks ADMIN from granting OWNER to anyone", () => {
    expect(authorizeMemberMutation({
      actor: admin,
      mutation: { type: "add", targetUserId: "admin_2", targetRole: "OWNER", organizationId: "org_a" },
      ownerCount: 1,
    })).toEqual({ allowed: false, reason: "ROLE_NOT_ALLOWED" });
  });

  it("blocks removal or demotion of the final OWNER", () => {
    expect(authorizeMemberMutation({
      actor: owner,
      target: owner,
      mutation: { type: "remove", targetUserId: "owner_1", organizationId: "org_a" },
      ownerCount: 1,
    })).toEqual({ allowed: false, reason: "ROLE_NOT_ALLOWED" });
  });

  it("blocks cross-organization member changes", () => {
    expect(authorizeMemberMutation({
      actor: owner,
      target: { userId: "staff_b", organizationId: "org_b", role: "STAFF" },
      mutation: { type: "remove", targetUserId: "staff_b", organizationId: "org_b" },
      ownerCount: 2,
    })).toEqual({ allowed: false, reason: "ORGANIZATION_MEMBERSHIP_REQUIRED" });
  });
});
