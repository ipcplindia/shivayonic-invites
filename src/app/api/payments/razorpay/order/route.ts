import { paymentAccessSchema } from "@/core/payment-capability";
import { paymentError, paymentRequest, paymentResponse } from "@/core/payment-http";
import { initiatePayment } from "@/core/razorpay-payments";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const parsed = paymentAccessSchema.safeParse(await paymentRequest(request, "order"));
    if (!parsed.success) throw new Error("INVALID_PAYMENT_INPUT");
    return paymentResponse(await initiatePayment(parsed.data.paymentIntentId, parsed.data.paymentAccessToken));
  } catch (error) {
    console.error("Razorpay order creation failed", { code: error instanceof Error ? error.message : "UNKNOWN" });
    return paymentError(error);
  }
}
