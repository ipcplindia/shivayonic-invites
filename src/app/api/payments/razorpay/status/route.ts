import { paymentAccessSchema } from "@/core/payment-capability";
import { paymentError, paymentRequest, paymentResponse } from "@/core/payment-http";
import { authorizePayment } from "@/core/razorpay-payments";
export async function POST(request: Request) {
  try {
    const parsed = paymentAccessSchema.safeParse(await paymentRequest(request, "status"));
    if (!parsed.success) throw new Error("INVALID_PAYMENT_INPUT");
    const intent = await authorizePayment(parsed.data.paymentIntentId, parsed.data.paymentAccessToken);
    return paymentResponse({ status: intent.status });
  } catch (error) { return paymentError(error); }
}
