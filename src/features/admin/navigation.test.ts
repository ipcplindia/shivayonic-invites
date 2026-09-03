import { describe, expect, it } from "vitest";

import { getPermissionsForRole } from "@/auth/permissions";
import { adminModules } from "@/features/admin/modules";
import {
  activeNavItem,
  adminNavItem,
  allNavItems,
  canVisitAdminDestination,
  visibleNavGroups,
} from "@/features/admin/navigation";
import type { CurrentUserContext, MemberRole } from "@/shared/auth";

function contextFor(role: MemberRole): CurrentUserContext {
  return {
    user: { id: "user-1", name: "Test Operator", email: "operator@example.com" },
    organization: { id: "org-1", name: "Shivayonic Invites", slug: "shivayonic" },
    role,
    permissions: getPermissionsForRole(role),
  };
}

function labelsFor(role: MemberRole) {
  return visibleNavGroups(contextFor(role)).flatMap((group) =>
    group.items.map((item) => item.label),
  );
}

describe("command center navigation", () => {
  it("gives an owner all operational sections", () => {
    const owner = labelsFor("OWNER");
    expect(owner).toContain("Users & Roles");
    expect(owner).toContain("Integrations");
    expect(owner).toContain("Products");
  });

  it("hides sensitive administration from staff", () => {
    const staff = labelsFor("STAFF");
    expect(staff).toContain("Media Library");
    expect(staff).not.toContain("Activity");
    expect(staff).not.toContain("Users & Roles");
    expect(staff).not.toContain("Integrations");
  });

  it("drops unavailable groups", () => {
    const groups = visibleNavGroups(contextFor("STAFF")).map((group) => group.label);
    expect(groups).toContain("Content");
    expect(groups).not.toContain("Security");
  });

  it("keeps the parent section active on nested routes", () => {
    expect(activeNavItem("/admin")?.label).toBe("Overview");
    expect(activeNavItem("/admin/media")?.label).toBe("Media Library");
    expect(activeNavItem("/admin/media/abc123")?.label).toBe("Media Library");
    expect(activeNavItem("/admin/catalogue/products")?.label).toBe("Products");
    expect(activeNavItem("/admin/settings")?.label).toBe("Settings");
  });

  it("keeps every module landing reachable from the rail", () => {
    // A module the rail cannot reach is dead weight; a rail entry with no
    // landing and no page is dead navigation. Both are caught here.
    for (const entry of adminModules) {
      expect(adminNavItem(entry.href), `${entry.href} is missing from the navigation`).toBeDefined();
    }
  });

  it("gives every destination a title and a lede, so no screen opens unexplained", () => {
    for (const entry of allNavItems) {
      expect(entry.title.length, entry.href).toBeGreaterThan(0);
      expect(entry.lede.length, entry.href).toBeGreaterThan(0);
    }
  });

  it("does not trust anonymous or lower-role access to sensitive destinations", () => {
    const users = adminNavItem("/admin/security/users");
    const products = adminNavItem("/admin/catalogue/products");
    expect(users).toBeDefined();
    expect(products).toBeDefined();
    expect(canVisitAdminDestination(null, users!)).toBe(false);
    expect(canVisitAdminDestination(contextFor("STAFF"), users!)).toBe(false);
    expect(canVisitAdminDestination(contextFor("ADMIN"), users!)).toBe(false);
    expect(canVisitAdminDestination(contextFor("OWNER"), users!)).toBe(true);
    expect(canVisitAdminDestination(contextFor("ADMIN"), products!)).toBe(true);
  });
});
