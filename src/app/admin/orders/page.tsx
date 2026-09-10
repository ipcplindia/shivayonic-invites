import Link from "next/link";

import { getCurrentUserContext } from "@/auth/context";
import { hasPermission } from "@/auth/permissions";
import { Card, DataTable, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/db/client";

function money(value: bigint) { return `₹${(value / 100n).toLocaleString("en-IN")}`; }

export default async function OrdersPage() {
  const context = await getCurrentUserContext();
  if (!hasPermission(context, "ORDERS_MANAGE")) return <EmptyState title="Access restricted" body="Your role cannot view orders." />;
  const enquiries = await prisma.checkoutEnquiry.findMany({
    where: { organizationId: context.organization.id },
    include: { paymentIntent: { select: { status: true, amountMinor: true } } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return <>
    <PageHeader title="Orders" lede="Website checkout enquiries and their payment approval state." actions={process.env.VERCEL_ENV === "preview" ? <StatusBadge label="Test mode" tone="warning" /> : undefined} />
    <Card>{enquiries.length === 0 ? <EmptyState title="No orders yet." body="Website checkout submissions appear here." /> : <DataTable caption="Website orders" rows={enquiries} rowKey={(row) => row.id} columns={[
      { key: "customer", header: "Customer", render: row => <Link href={`/admin/orders/${row.id}`}>{row.customerName}</Link> },
      { key: "design", header: "Design", render: row => row.designName ?? row.designSlug ?? "—" },
      { key: "plan", header: "Plan", render: row => row.planKey },
      { key: "amount", header: "Amount", numeric: true, render: row => row.paymentIntent ? money(row.paymentIntent.amountMinor) : "Awaiting custom amount" },
      { key: "event", header: "Event date", render: row => row.eventDate ?? "—" },
      { key: "submitted", header: "Submitted", render: row => row.createdAt.toLocaleDateString("en-IN") },
      { key: "status", header: "Order", render: row => <StatusBadge label={row.status} tone="neutral" /> },
      { key: "payment", header: "Payment", render: row => <StatusBadge label={row.paymentIntent?.status ?? "NO INTENT"} tone={row.paymentIntent?.status === "READY" || row.paymentIntent?.status === "PAID" ? "success" : "warning"} /> },
    ]} />}</Card>
  </>;
}
