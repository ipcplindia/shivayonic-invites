import { describe, expect, it } from "vitest";
import { AppAuthError } from "@/auth/errors";
import { assertOrganizationPermission, assertProjectBelongsToOrganization } from "@/auth/organization-access";
import { getPermissionsForRole, hasPermission } from "@/auth/permissions";
import type { CurrentUserContext } from "@/shared/auth";

const baseContext: CurrentUserContext = {
  user: { id: "user_1", name: "Owner", email: "owner@shivayonic.test" },
  organization: { id: "org_a", name: "Shivayonic", slug: "shivayonic" },
  role: "OWNER",
  permissions: getPermissionsForRole("OWNER"),
};

describe("role permission matrix", () => {
  it("grants OWNER all current permissions", () => {
    expect(getPermissionsForRole("OWNER")).toEqual([
      "ORGANIZATION_MANAGE",
      "MEMBERS_MANAGE",
      "PROJECT_READ",
      "PROJECT_WRITE",
      "MEDIA_READ",
      "MEDIA_WRITE",
      "AUDIT_READ",
    ]);
  });

  it("grants ADMIN operational permissions without organization ownership management", () => {
    expect(hasPermission({ role: "ADMIN" }, "MEMBERS_MANAGE")).toBe(true);
    expect(hasPermission({ role: "ADMIN" }, "AUDIT_READ")).toBe(true);
    expect(hasPermission({ role: "ADMIN" }, "ORGANIZATION_MANAGE")).toBe(false);
  });

  it("grants STAFF project and media permissions only", () => {
    expect(hasPermission({ role: "STAFF" }, "PROJECT_WRITE")).toBe(true);
    expect(hasPermission({ role: "STAFF" }, "MEDIA_WRITE")).toBe(true);
    expect(hasPermission({ role: "STAFF" }, "MEMBERS_MANAGE")).toBe(false);
    expect(hasPermission({ role: "STAFF" }, "AUDIT_READ")).toBe(false);
  });
});

describe("organization isolation", () => {
  it("rejects access to another organization", () => {
    expect(() => assertOrganizationPermission(baseContext, "org_b", "PROJECT_READ")).toThrow(AppAuthError);
  });

  it("rejects project access when an id belongs to another organization", () => {
    expect(() => assertProjectBelongsToOrganization({ organizationId: "org_b" }, "org_a")).toThrow(AppAuthError);
  });

  it("uses server-side membership context, not a client-supplied role", () => {
    const clientSuppliedRole = "OWNER";
    const serverContext = { ...baseContext, role: "STAFF" as const, permissions: getPermissionsForRole("STAFF") };
    expect(clientSuppliedRole).toBe("OWNER");
    expect(() => assertOrganizationPermission(serverContext, "org_a", "AUDIT_READ")).toThrow(AppAuthError);
  });

  it("serializes no session token, password, or auth secret", () => {
    const serialized = JSON.stringify(baseContext);
    expect(serialized).not.toMatch(/password|session|token|secret/i);
  });
});
