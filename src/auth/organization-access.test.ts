import { describe, expect, it } from "vitest";

import { assertOrganizationAccess } from "./organization-access";
import type { CurrentUserContext } from "@/shared/auth";

describe("organization access", () => {
  it("rejects a caller trying to access another tenant", () => {
    const context: CurrentUserContext = {
      user: { id: "user_a", name: "Owner", email: "owner@example.test" },
      organization: { id: "org_a", name: "A", slug: "a" },
      role: "OWNER" as const,
      permissions: ["MEDIA_READ", "MEDIA_WRITE"],
    };
    expect(() => assertOrganizationAccess(context, "org_b")).toThrow("ORGANIZATION_MEMBERSHIP_REQUIRED");
  });
});
