import { z } from "zod";
import { getCustomerOrder } from "@/core/customer-order";
import { paymentRequest, paymentResponse, paymentError } from "@/core/payment-http";

const input = z.object({ enquiryId: z.string().min(1).max(100), access: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export async function POST(request: Request) {
  try {
    const value = input.safeParse(await paymentRequest(request, "customer-order"));
    if (!value.success) throw new Error("PAYMENT_ACCESS_DENIED");
    return paymentResponse(await getCustomerOrder(value.data.enquiryId, value.data.access));
  } catch (error) { return paymentError(error); }
}
