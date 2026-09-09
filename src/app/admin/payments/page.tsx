import { requirePermission } from "@/auth/context";
import { prisma } from "@/db/client";
export const dynamic = "force-dynamic";
export default async function PaymentsPage() {
  const context = await requirePermission("PAYMENTS_VIEW");
  const payments = await prisma.paymentIntent.findMany({ where: { organizationId: context.organization.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, enquiryId: true, purpose: true, amountMinor: true, status: true, paymentMode: true, providerEnvironment: true, providerOrderId: true, providerPaymentId: true, captureMode: true, createdAt: true, verifiedAt: true, paidAt: true } });
  return <section><h1>Payments</h1><p>RAZORPAY — TEST MODE</p><p>Confirm capture mode in the Test Dashboard. Unset capture mode is never assumed to be AUTO.</p>{payments.length === 0 ? <p>No payment records.</p> : payments.map(p => <article key={p.id}><h2>{p.purpose}</h2><p>{p.status} · {p.providerEnvironment ?? "UNSET"}</p><dl>{Object.entries({ Reference: p.id, Enquiry: p.enquiryId, "Amount (INR minor units)": p.amountMinor.toString(), Mode: p.paymentMode, "Provider order": p.providerOrderId, "Provider payment": p.providerPaymentId, Capture: p.captureMode ?? "UNSET", Created: p.createdAt.toISOString(), Verified: p.verifiedAt?.toISOString(), Paid: p.paidAt?.toISOString() }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value ?? "—"}</dd></div>)}</dl></article>)}</section>;
}
