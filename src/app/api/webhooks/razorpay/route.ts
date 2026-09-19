import { readPaymentBody, paymentError, paymentResponse } from "@/core/payment-http";
import { processRazorpayWebhook } from "@/core/razorpay-payments";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await processRazorpayWebhook(await readPaymentBody(request, 65536), request.headers.get("x-razorpay-signature") ?? "", request.headers.get("x-razorpay-event-id") ?? "");
    return paymentResponse({ ok: true });
  } catch (error) { return paymentError(error); }
}
