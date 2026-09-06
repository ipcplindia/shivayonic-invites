import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePermission } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { approveCheckoutPayment } from "@/core/payment-approval";

const inputSchema = z.object({ amountMinor: z.string().regex(/^[1-9]\d*$/).optional() }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const context = await requirePermission("PAYMENTS_APPROVE", { headers: request.headers });
    const parsed = inputSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_PAYMENT_APPROVAL_INPUT" } }, { status: 400 });
    const { enquiryId } = await params;
    const paymentIntent = await approveCheckoutPayment({ organizationId: context.organization.id, actorUserId: context.user.id, actorRole: context.role, enquiryId, amountMinor: parsed.data.amountMinor });
    return NextResponse.json({ paymentIntent: { id: paymentIntent.id, status: paymentIntent.status } });
  } catch (error) {
    if (error instanceof AppAuthError) return authErrorResponse(error);
    const code = error instanceof Error ? error.message : "PAYMENT_APPROVAL_UNAVAILABLE";
    if (["CHECKOUT_ENQUIRY_NOT_FOUND", "PAYMENT_INTENT_NOT_FOUND"].includes(code)) return NextResponse.json({ error: { code } }, { status: 404 });
    if (["CUSTOM_AMOUNT_OWNER_REQUIRED", "STANDARD_AMOUNT_SERVER_CONTROLLED"].includes(code)) return NextResponse.json({ error: { code } }, { status: 403 });
    if (code === "INVALID_PAYMENT_AMOUNT") return NextResponse.json({ error: { code } }, { status: 400 });
    return NextResponse.json({ error: { code: "PAYMENT_APPROVAL_UNAVAILABLE" } }, { status: 503 });
  }
}
