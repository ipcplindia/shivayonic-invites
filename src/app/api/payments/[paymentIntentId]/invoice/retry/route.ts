import { NextResponse } from "next/server";

import { requirePermission } from "@/auth/context";
import { prisma } from "@/db/client";
import { createInvoiceForPaidOrder } from "@/core/paid-order-workflow";

export const runtime = "nodejs";

/** OWNER-only retry. It cannot charge, alter PAID, or create a second invoice. */
export async function POST(request: Request, { params }: { params: Promise<{ paymentIntentId: string }> }) {
  try {
    const context = await requirePermission("PAYMENTS_APPROVE", { headers: request.headers });
    if (context.role !== "OWNER") return NextResponse.json({ error: { code: "PAYMENT_APPROVAL_OWNER_REQUIRED" } }, { status: 403 });
    const { paymentIntentId } = await params;
    const payment = await prisma.paymentIntent.findFirst({ where: { id: paymentIntentId, organizationId: context.organization.id }, select: { id: true, status: true, invoiceStatus: true } });
    if (!payment || payment.status !== "PAID" || !["RETRY_REQUIRED", "FAILED"].includes(payment.invoiceStatus ?? "")) return NextResponse.json({ error: { code: "INVOICE_RETRY_NOT_AVAILABLE" } }, { status: 409 });
    await createInvoiceForPaidOrder(payment.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: { code: "AUTH_REQUIRED" } }, { status: 401 });
  }
}
