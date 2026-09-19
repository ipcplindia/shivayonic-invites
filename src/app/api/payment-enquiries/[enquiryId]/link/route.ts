import { requireRole } from "@/auth/context";
import { AppAuthError, authErrorResponse } from "@/auth/errors";
import { resendOrderPaymentLink } from "@/core/customer-order";
import { paymentError, paymentResponse } from "@/core/payment-http";
export async function POST(request: Request, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const context = await requireRole("OWNER", { headers: request.headers });
    const { enquiryId } = await params;
    return paymentResponse(await resendOrderPaymentLink({ organizationId: context.organization.id, actorUserId: context.user.id, actorRole: context.role, enquiryId }));
  } catch (error) { return error instanceof AppAuthError ? authErrorResponse(error) : paymentError(error); }
}
