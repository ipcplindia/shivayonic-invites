import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { can } from "@/features/access";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const context = await getCurrentUserContext();
  if (!can(context, "PROJECT_WRITE")) redirect("/admin");

  return (
    <>
      <PageHeader
        title="Schedule"
        lede="Release windows for invitations that must land at a chosen hour — a muhurat, a launch, a reveal."
      />

      <Card>
        <CardHeader
          title="Upcoming releases"
          description="Publications waiting for their release window."
        />
        <EmptyState
          icon="schedule"
          title="Scheduling is not running yet"
          body="The job queue behind scheduled releases has not been built. When it is, this becomes a calendar of upcoming windows with the state of each queued job."
        />
      </Card>
    </>
  );
}
