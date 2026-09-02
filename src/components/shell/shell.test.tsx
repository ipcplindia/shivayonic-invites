import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getPermissionsForRole } from "@/auth/permissions";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar, initials } from "@/components/shell/top-bar";
import type { CurrentUserContext, MemberRole } from "@/shared/auth";

function contextFor(role: MemberRole): CurrentUserContext {
  return {
    user: { id: "user-1", name: "Aarav Mehta", email: "aarav@shivayonic.test" },
    organization: { id: "org-1", name: "Shivayonic Invites", slug: "shivayonic-invites" },
    role,
    permissions: getPermissionsForRole(role),
  };
}

describe("Sidebar", () => {
  it("renders the wordmark, the permitted sections and the organization", () => {
    const markup = renderToStaticMarkup(
      <Sidebar context={contextFor("OWNER")} pathname="/admin" />,
    );

    expect(markup).toContain("SHIVAYONIC");
    expect(markup).toContain("Media Library");
    expect(markup).toContain("Audit Log");
    expect(markup).toContain("Shivayonic Invites");
    expect(markup).toContain('href="/admin/media"');
  });

  it("does not offer staff the owner-only audit section", () => {
    const markup = renderToStaticMarkup(
      <Sidebar context={contextFor("STAFF")} pathname="/admin" />,
    );

    expect(markup).toContain("Media Library");
    expect(markup).not.toContain('href="/admin/security/audit"');
  });

  it("marks the current section for assistive technology", () => {
    const markup = renderToStaticMarkup(
      <Sidebar context={contextFor("OWNER")} pathname="/admin/media/xyz" />,
    );

    expect(markup).toMatch(/aria-current="page"[^>]*href="\/admin\/media"/);
  });

  it("labels sections whose backend capability is not connected yet", () => {
    const markup = renderToStaticMarkup(
      <Sidebar context={contextFor("OWNER")} pathname="/admin" />,
    );

    expect(markup).toContain("Soon");
  });

  it("exposes its open/closed state so the mobile drawer is controllable", () => {
    const closed = renderToStaticMarkup(
      <Sidebar context={contextFor("OWNER")} pathname="/admin" open={false} />,
    );
    const open = renderToStaticMarkup(
      <Sidebar context={contextFor("OWNER")} pathname="/admin" open />,
    );

    expect(closed).toContain('data-open="false"');
    expect(open).toContain('data-open="true"');
  });
});

describe("TopBar", () => {
  it("shows the page, the operator, their role and their organization", () => {
    const markup = renderToStaticMarkup(
      <TopBar context={contextFor("ADMIN")} pageTitle="Media Library" />,
    );

    expect(markup).toContain("Media Library");
    expect(markup).toContain("Aarav Mehta");
    expect(markup).toContain("Admin");
    expect(markup).toContain("Shivayonic Invites");
  });

  it("offers a command palette trigger that says what it actually searches", () => {
    const markup = renderToStaticMarkup(
      <TopBar context={contextFor("OWNER")} pageTitle="Overview" />,
    );

    expect(markup).toContain("Search commands and destinations…");
    expect(markup).toContain('aria-haspopup="dialog"');
  });

  it("keeps unimplemented tools inert rather than pretending they work", () => {
    const markup = renderToStaticMarkup(
      <TopBar context={contextFor("OWNER")} pageTitle="Overview" />,
    );

    expect(markup).toContain("Notifications — not connected yet");
    expect(markup).toMatch(/aria-label="Notifications[^>]*disabled/);
  });

  it("links to Settings from the account menu", () => {
    const markup = renderToStaticMarkup(
      <TopBar context={contextFor("STAFF")} pageTitle="Overview" />,
    );

    expect(markup).toContain('href="/admin/settings"');
  });

  it("offers a real sign-out route", () => {
    const markup = renderToStaticMarkup(
      <TopBar context={contextFor("OWNER")} pageTitle="Overview" />,
    );

    expect(markup).toContain('action="/api/auth/logout"');
  });

  it("never renders session or storage internals", () => {
    const markup = renderToStaticMarkup(
      <TopBar context={contextFor("OWNER")} pageTitle="Overview" />,
    );

    for (const secret of ["user-1", "org-1", "session", "token", "cookie", "storageKey"]) {
      expect(markup.toLowerCase()).not.toContain(secret.toLowerCase());
    }
  });
});

describe("initials", () => {
  it("derives a two-letter monogram without breaking on odd names", () => {
    expect(initials("Aarav Mehta")).toBe("AM");
    expect(initials("Priya")).toBe("PR");
    expect(initials("   ")).toBe("SY");
  });
});
