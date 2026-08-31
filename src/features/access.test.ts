import { describe, expect, it } from "vitest";

import { can, canAll, canAny } from "@/features/access";
import { getPermissionsForRole } from "@/auth/permissions";
import type { CurrentUserContext, MemberRole } from "@/shared/auth";

function contextFor(role: MemberRole): CurrentUserContext {
  return {
    user: { id: "user-1", name: "Test Operator", email: "operator@example.com" },
    organization: { id: "org-1", name: "Shivayonic Invites", slug: "shivayonic" },
    role,
    permissions: getPermissionsForRole(role),
  };
}

describe("frontend permission helper", () => {
  it("reads the permission list issued by /api/me rather than a local role matrix", () => {
    expect(can(contextFor("OWNER"), "ORGANIZATION_MANAGE")).toBe(true);
    expect(can(contextFor("ADMIN"), "ORGANIZATION_MANAGE")).toBe(false);
    expect(can(contextFor("STAFF"), "AUDIT_READ")).toBe(false);
  });

  it("supports any/all checks for sections with several entry permissions", () => {
    const staff = contextFor("STAFF");
    expect(canAny(staff, ["ORGANIZATION_MANAGE", "MEDIA_READ"])).toBe(true);
    expect(canAll(staff, ["ORGANIZATION_MANAGE", "MEDIA_READ"])).toBe(false);
    expect(canAll(staff, ["MEDIA_READ", "MEDIA_WRITE"])).toBe(true);
  });
});
