"use client";

import { Button, Card, ErrorState } from "@/components/ui";

/**
 * Last-resort boundary for the Command Center. Server messages, stack traces and
 * digests are deliberately not rendered — the operator gets a recovery path.
 */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <ErrorState
        title="This section could not be loaded"
        body="Something went wrong while preparing the page. Nothing has been changed. Try again, and if it keeps happening, tell the studio engineer."
        action={
          <Button variant="secondary" icon="refresh" onClick={reset}>
            Try again
          </Button>
        }
      />
    </Card>
  );
}
