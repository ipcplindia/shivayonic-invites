import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { Card, CardHeader, DataTable, EmptyState, PageHeader } from "@/components/ui";
import { prisma } from "@/db/client";
import { can } from "@/features/access";

export default async function WebsiteAnalyticsPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "ANALYTICS_VIEW")) redirect("/admin");
  const events = await prisma.websiteAnalyticsEvent.groupBy({ by: ["eventType", "path"], where: { organizationId: context.organization.id }, _count: { _all: true }, orderBy: { _count: { id: "desc" } }, take: 100 });
  return <><PageHeader title="Website analytics" lede="First-party, privacy-minimal event counts only. No historic or third-party numbers are fabricated." />
    <Card><CardHeader title="Captured events" description="Path, event type and time are stored; identities, query strings and referrers are not." />
      {events.length ? <DataTable caption="Website event counts" rows={events} rowKey={(event) => `${event.eventType}:${event.path}`} columns={[
        { key: "event", header: "Event", render: (event) => event.eventType.replaceAll("_", " ") },
        { key: "path", header: "Path", render: (event) => event.path },
        { key: "count", header: "Count", numeric: true, render: (event) => String(event._count._all) },
      ]} /> : <EmptyState icon="activity" title="No captured events" body="The ingestion endpoint is ready; wire approved public interactions to it when event collection is desired." />}
    </Card></>;
}
