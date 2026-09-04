import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { prisma } from "@/db/client";
import { can } from "@/features/access";

export default async function AnalyticsPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "ANALYTICS_VIEW")) redirect("/admin");
  const events = await prisma.websiteAnalyticsEvent.groupBy({ by: ["eventType"], where: { organizationId: context.organization.id }, _count: { _all: true } });
  return <><PageHeader title="Analytics" lede="Only captured first-party events appear. External channel metrics remain disconnected until OAuth is configured." />
    <section>
      <Card><CardHeader title="Website" description="First-party events captured after this foundation is deployed." /><CardBody>{events.length ? <ul>{events.map((event) => <li key={event.eventType}>{event.eventType.replaceAll("_", " ")}: {event._count._all}</li>)}</ul> : <EmptyState icon="activity" title="No website events yet" body="Page views, CTA clicks, WhatsApp clicks and form events will appear after the public event hook is wired into the relevant surfaces." />}</CardBody></Card>
      <Card><CardHeader title="Instagram" description="Provider analytics." /><CardBody><Badge>Not connected</Badge><p>Connect Meta to begin collecting analytics.</p></CardBody></Card>
      <Card><CardHeader title="YouTube" description="Provider analytics." /><CardBody><Badge>Not connected</Badge><p>Connect Google to begin collecting analytics.</p></CardBody></Card>
    </section></>;
}
