import { z } from "zod";
import { paymentAccessSchema } from "@/core/payment-capability";
import { paymentError, paymentRequest, paymentResponse } from "@/core/payment-http";
import { verifyPayment } from "@/core/razorpay-payments";
const schema = paymentAccessSchema.extend({ razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/), razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await paymentRequest(request, "verify"));
    if (!parsed.success) throw new Error("INVALID_PAYMENT_INPUT");
    return paymentResponse(await verifyPayment(parsed.data));
  } catch (error) { return paymentError(error); }
}
