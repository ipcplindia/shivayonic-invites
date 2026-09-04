import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { Card, CardHeader, DataTable, EmptyState, PageHeader } from "@/components/ui";
import { prisma } from "@/db/client";
import { can } from "@/features/access";

export default async function ContentAnalyticsPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "ANALYTICS_VIEW")) redirect("/admin");
  const snapshots = await prisma.contentMetricSnapshot.findMany({ where: { organizationId: context.organization.id }, include: { contentItem: { select: { title: true } } }, orderBy: { capturedAt: "desc" }, take: 100 });
  return <><PageHeader title="Content analytics" lede="Nullable platform fields preserve what each provider actually supports; no metric is invented." />
    <Card><CardHeader title="Captured snapshots" description="External snapshots appear only after a provider is connected and sync is explicitly configured." />
      {snapshots.length ? <DataTable caption="Content metric snapshots" rows={snapshots} rowKey={(snapshot) => snapshot.id} columns={[
        { key: "content", header: "Content", render: (snapshot) => snapshot.contentItem.title },
        { key: "provider", header: "Provider", render: (snapshot) => snapshot.provider },
        { key: "views", header: "Views", numeric: true, render: (snapshot) => snapshot.views == null ? "—" : String(snapshot.views) },
        { key: "clicks", header: "Clicks", numeric: true, render: (snapshot) => snapshot.clicks == null ? "—" : String(snapshot.clicks) },
        { key: "captured", header: "Captured", render: (snapshot) => snapshot.capturedAt.toISOString().slice(0, 16) },
      ]} /> : <EmptyState icon="activity" title="No metric snapshots" body="Instagram and YouTube are not connected. Website events remain separate first-party signals." />}
    </Card></>;
}
