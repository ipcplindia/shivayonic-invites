import { cookies } from "next/headers";
import { z } from "zod";
import { CUSTOMER_COOKIE, CUSTOMER_SESSION_SECONDS, customerOrders, openCustomerOrder, requestCustomerSignIn, signOutCustomer, verifyCustomerSignIn } from "@/core/customer-account";
import { paymentError, paymentRequest, paymentResponse } from "@/core/payment-http";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), email: z.string().trim().email().max(160) }).strict(),
  z.object({ action: z.literal("verify"), token: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  z.object({ action: z.literal("orders") }).strict(),
  z.object({ action: z.literal("open"), enquiryId: z.string().min(1).max(100) }).strict(),
  z.object({ action: z.literal("logout") }).strict(),
]);
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await paymentRequest(request, "customer-account"));
    if (!parsed.success) throw new Error("PAYMENT_ACCESS_DENIED");
    const value = parsed.data;
    const jar = await cookies();
    if (value.action === "request") { await requestCustomerSignIn(value.email); return paymentResponse({ ok: true }); }
    if (value.action === "verify") {
      const session = await verifyCustomerSignIn(value.token);
      jar.set(CUSTOMER_COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: CUSTOMER_SESSION_SECONDS });
      return paymentResponse({ ok: true });
    }
    const session = jar.get(CUSTOMER_COOKIE)?.value;
    if (value.action === "orders") return paymentResponse({ orders: await customerOrders(session) });
    if (value.action === "open") return paymentResponse({ orderUrl: await openCustomerOrder(session, value.enquiryId) });
    await signOutCustomer(session); jar.delete(CUSTOMER_COOKIE);
    return paymentResponse({ ok: true });
  } catch (error) { return paymentError(error); }
}
