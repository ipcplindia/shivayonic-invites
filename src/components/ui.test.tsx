import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button, DataTable, EmptyState, ErrorState, Skeleton, StatusBadge } from "@/components/ui";

describe("state primitives", () => {
  it("renders an empty state that teaches the section", () => {
    const markup = renderToStaticMarkup(
      <EmptyState
        icon="media"
        title="No masters held yet"
        body="Master files uploaded to the studio appear here."
      />,
    );

    expect(markup).toContain("No masters held yet");
    expect(markup).toContain("Master files uploaded to the studio appear here.");
  });

  it("announces an error state and offers a retry", () => {
    const markup = renderToStaticMarkup(
      <ErrorState
        title="Media could not be loaded"
        body="Try again shortly."
        action={<Button icon="refresh">Try again</Button>}
      />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Try again");
  });

  it("renders a loading skeleton rather than a spinner", () => {
    const markup = renderToStaticMarkup(<Skeleton width="70%" height={13} />);
    expect(markup).toContain("width:70%");
  });
});

describe("StatusBadge", () => {
  it("carries meaning in shape as well as colour", () => {
    const failed = renderToStaticMarkup(
      <StatusBadge label="Failed" tone="danger" shape="square" />,
    );
    const ready = renderToStaticMarkup(<StatusBadge label="Ready" tone="success" />);

    expect(failed).toContain("Failed");
    expect(ready).toContain("Ready");
    expect(failed).not.toBe(ready);
  });
});

describe("DataTable", () => {
  it("renders headers, rows and an accessible caption", () => {
    const markup = renderToStaticMarkup(
      <DataTable
        caption="Permissions granted to your role"
        rowKey={(row: { id: string; label: string }) => row.id}
        rows={[{ id: "a", label: "Browse the media library" }]}
        columns={[{ key: "label", header: "Permission", render: (row) => row.label }]}
      />,
    );

    expect(markup).toContain("Permissions granted to your role");
    expect(markup).toContain('scope="col"');
    expect(markup).toContain("Browse the media library");
  });
});

describe("Button", () => {
  it("defaults to a non-submitting button so it is safe inside forms", () => {
    expect(renderToStaticMarkup(<Button>Save</Button>)).toContain('type="button"');
  });
});
