import { describe, expect, it } from "vitest";

import { getPermissionsForRole } from "@/auth/permissions";
import { activeNavItem, visibleNavGroups } from "@/features/admin/navigation";
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
  it("gives an owner every primary section", () => {
    expect(labelsFor("OWNER")).toEqual([
      "Overview",
      "Projects",
      "Media Library",
      "Publish",
      "Schedule",
      "Activity",
      "Settings",
    ]);
  });

  it("hides the audit record from staff", () => {
    const staff = labelsFor("STAFF");
    expect(staff).toContain("Media Library");
    expect(staff).not.toContain("Activity");
  });

  it("drops a group entirely when none of its sections are permitted", () => {
    expect(visibleNavGroups(contextFor("STAFF")).map((group) => group.label)).toEqual([
      "Operate",
      "Distribute",
      "Govern",
    ]);
  });

  it("keeps the parent section active on nested routes", () => {
    expect(activeNavItem("/admin")?.label).toBe("Overview");
    expect(activeNavItem("/admin/media")?.label).toBe("Media Library");
    expect(activeNavItem("/admin/media/abc123")?.label).toBe("Media Library");
    expect(activeNavItem("/admin/settings")?.label).toBe("Settings");
  });
});
