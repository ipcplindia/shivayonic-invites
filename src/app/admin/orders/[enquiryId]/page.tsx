import { notFound } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { hasPermission } from "@/auth/permissions";
import { Card, CardBody, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/db/client";
import { zohoInvoicingEnabled } from "@/core/paid-order-workflow";
import { OrderApproval } from "@/features/admin/order-approval";
import { InvoiceRetry } from "@/features/admin/invoice-retry";
import { OrderPaymentLink } from "@/features/admin/order-payment-link";

function money(value: bigint) { return `₹${(value / 100n).toLocaleString("en-IN")}`; }
function Field({ label, value }: { label: string; value: string | null | undefined }) { return <p><strong>{label}</strong><br />{value || "—"}</p>; }

export default async function OrderDetailPage({ params }: { params: Promise<{ enquiryId: string }> }) {
  const context = await getCurrentUserContext();
  if (!hasPermission(context, "ORDERS_MANAGE")) return <EmptyState title="Access restricted" body="Your role cannot view orders." />;
  const { enquiryId } = await params;
  const enquiry = await prisma.checkoutEnquiry.findFirst({ where: { id: enquiryId, organizationId: context.organization.id }, include: { paymentIntent: true } });
  if (!enquiry) notFound();
  const payment = enquiry.paymentIntent;
  return <>
    {payment?.status === "READY" && context.role === "OWNER" ? <OrderPaymentLink enquiryId={enquiry.id} /> : null}
    <PageHeader title={enquiry.customerName} lede={`Submitted ${enquiry.createdAt.toLocaleString("en-IN")}`} actions={process.env.VERCEL_ENV === "preview" ? <StatusBadge label="Test mode" tone="warning" /> : undefined} />
    <Card><CardHeader title="Customer" /><CardBody><Field label="Email" value={enquiry.customerEmail} /><Field label="Phone" value={enquiry.customerPhone} /><Field label="WhatsApp" value={enquiry.customerWhatsapp} /><Field label="Address" value={[enquiry.address1, enquiry.address2, enquiry.city, enquiry.state, enquiry.pincode, enquiry.country].filter(Boolean).join(", ")} /></CardBody></Card>
    <Card><CardHeader title="Commission" /><CardBody><Field label="Design" value={enquiry.designName ?? enquiry.designSlug} /><Field label="Occasion" value={enquiry.designOccasion} /><Field label="Style" value={enquiry.designStyle} /><Field label="Plan" value={enquiry.planKey} /><Field label="Event date" value={enquiry.eventDate} /><Field label="Venue" value={enquiry.eventLocation} /><Field label="Notes" value={enquiry.notes} /></CardBody></Card>
    <Card><CardHeader title="Payment" action={enquiry.planKey === "CUSTOM" && payment?.status === "PENDING_APPROVAL" && context.role === "OWNER" ? <OrderApproval enquiryId={enquiry.id} /> : payment && context.role === "OWNER" && ["RETRY_REQUIRED", "FAILED"].includes(payment.invoiceStatus ?? "") ? <InvoiceRetry paymentIntentId={payment.id} /> : undefined} /><CardBody>{payment ? <><Field label="Amount" value={money(payment.amountMinor)} /><Field label="Status" value={payment.status} /><Field label="Mode" value={payment.paymentMode} /><Field label="Provider" value={payment.provider ? `${payment.provider}${payment.providerEnvironment ? ` (${payment.providerEnvironment})` : ""}` : "Not started"} /><Field label="Provider order" value={payment.providerOrderId} /><Field label="Provider payment" value={payment.providerPaymentId} /><Field label="Invoice" value={payment.invoiceStatus ?? (zohoInvoicingEnabled() ? "Not created" : "Not enabled")} /><Field label="Invoice number" value={payment.invoiceNumber} /></> : <p>Custom amount approval is required before payment can begin.</p>}</CardBody></Card>
  </>;
}
