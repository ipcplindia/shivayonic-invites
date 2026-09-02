import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getPermissionsForRole } from "@/auth/permissions";
import { CommandPalette, commandsFor, filterCommands } from "@/features/admin/command-palette";
import { ConfirmDialog, Dialog, Inspector } from "@/components/overlay";
import { ToastProvider } from "@/components/toast";
import { Button } from "@/components/ui";
import type { CurrentUserContext, MemberRole } from "@/shared/auth";

function contextFor(role: MemberRole): CurrentUserContext {
  return {
    user: { id: "user-1", name: "Aarav Mehta", email: "aarav@shivayonic.test" },
    organization: { id: "org-1", name: "Shivayonic Invites", slug: "shivayonic-invites" },
    role,
    permissions: getPermissionsForRole(role),
  };
}

describe("command palette", () => {
  it("offers only the destinations the operator is permitted to open", () => {
    const owner = commandsFor(contextFor("OWNER")).map((command) => command.label);
    const staff = commandsFor(contextFor("STAFF")).map((command) => command.label);

    expect(owner).toContain("Audit Log");
    expect(staff).not.toContain("Audit Log");
    expect(staff).toContain("Media Library");
  });

  it("labels destinations whose backend capability is not connected", () => {
    const publish = commandsFor(contextFor("OWNER")).find((c) => c.label === "Social Studio");
    const media = commandsFor(contextFor("OWNER")).find((c) => c.label === "Media Library");

    expect(publish?.hint).toBe("Soon");
    expect(media?.hint).toBeUndefined();
  });

  it("filters by label and ignores case and surrounding space", () => {
    const commands = commandsFor(contextFor("OWNER"));

    expect(filterCommands(commands, "  MEDIA ").map((c) => c.label)).toEqual(["Media Library"]);
    expect(filterCommands(commands, "")).toHaveLength(commands.length);
    expect(filterCommands(commands, "customers").map((command) => command.label)).toEqual(["Customers"]);
  });

  it("renders as a native dialog, so focus trapping and Escape are the platform's", () => {
    const markup = renderToStaticMarkup(
      <CommandPalette
        context={contextFor("OWNER")}
        open={false}
        onClose={() => {}}
        onNavigate={() => {}}
      />,
    );

    expect(markup).toMatch(/^<dialog/);
    // Closed: the browser only makes a dialog interactive once showModal() runs.
    expect(markup).not.toContain("<dialog open");
    expect(markup).toContain('aria-label="Command palette"');
    expect(markup).toContain("Search commands and destinations…");
  });

  it("says what it actually searches, and does not claim more", () => {
    const markup = renderToStaticMarkup(
      <CommandPalette
        context={contextFor("OWNER")}
        open={false}
        onClose={() => {}}
        onNavigate={() => {}}
      />,
    );

    expect(markup).toContain("destinations and actions");
    expect(markup.toLowerCase()).not.toContain("search everything");
  });
});

describe("dialog foundation", () => {
  it("uses a native dialog with an accessible name and a close control", () => {
    const markup = renderToStaticMarkup(
      <Dialog open={false} onClose={() => {}} title="Archive master" description="This can be undone.">
        <p>Body</p>
      </Dialog>,
    );

    expect(markup).toMatch(/^<dialog/);
    expect(markup).toContain("aria-labelledby=");
    expect(markup).toContain('aria-label="Close"');
    expect(markup).toContain("This can be undone.");
  });

  it("gives a confirmation both a cancel and a committed action", () => {
    const markup = renderToStaticMarkup(
      <ConfirmDialog
        open={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete master"
        description="This cannot be undone."
        confirmLabel="Delete"
      />,
    );

    expect(markup).toContain("Cancel");
    expect(markup).toContain("Delete");
  });

  it("renders the inspector as a labelled dialog with its own close control", () => {
    const markup = renderToStaticMarkup(
      <Inspector open={false} onClose={() => {}} title="master.mp4" footer={<Button>Download</Button>}>
        <p>Fields</p>
      </Inspector>,
    );

    expect(markup).toMatch(/^<dialog/);
    expect(markup).toContain('id="inspector-title"');
    expect(markup).toContain('aria-label="Close inspector"');
  });
});

describe("toast region", () => {
  it("mounts a polite live region and leaves the page content untouched", () => {
    const markup = renderToStaticMarkup(
      <ToastProvider>
        <p>Page</p>
      </ToastProvider>,
    );

    expect(markup).toContain("<p>Page</p>");
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('role="status"');
  });
});
