import "server-only";
import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export function razorpayConfig() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  // LIVE is represented in storage but cannot execute in this test integration.
  if (process.env.RAZORPAY_MODE !== "TEST" || !key?.startsWith("rzp_test_") || !secret || process.env.VERCEL_ENV === "production") throw new Error("RAZORPAY_TEST_CONFIGURATION_REQUIRED");
  return { key, secret, mode: "TEST" as const };
}

export function validHmac(body: string | Uint8Array, signature: string, secret: string) {
  if (!secret || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(createHmac("sha256", secret).update(body).digest(), Buffer.from(signature, "hex"));
}

const orderSchema = z.object({ id: z.string().regex(/^order_[A-Za-z0-9]+$/), amount: z.number().int().positive().safe(), currency: z.literal("INR"), receipt: z.string(), status: z.enum(["created", "attempted", "paid"]) });
export const providerPaymentSchema = z.object({ id: z.string().regex(/^pay_[A-Za-z0-9]+$/), order_id: z.string().regex(/^order_[A-Za-z0-9]+$/), amount: z.number().int().positive().safe(), currency: z.literal("INR"), status: z.enum(["created", "authorized", "captured", "refunded", "failed"]), captured: z.boolean() });
export type ProviderPayment = z.infer<typeof providerPaymentSchema>;

async function api(path: string, body?: unknown) {
  const { key, secret } = razorpayConfig();
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, { method: body ? "POST" : "GET", redirect: "error", cache: "no-store", signal: globalThis.AbortSignal.timeout(15000), headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  // Safe transport classification only; never include body, headers, or credentials.
  if (!response.ok) throw new Error(`RAZORPAY_PROVIDER_UNAVAILABLE_${response.status}`);
  return response.json();
}

export async function createOrder(amount: bigint, receipt: string) {
  if (amount <= 0n || amount > BigInt(Number.MAX_SAFE_INTEGER) || receipt.length > 40) throw new Error("INVALID_PAYMENT_AMOUNT");
  const order = orderSchema.parse(await api("orders", { amount: Number(amount), currency: "INR", receipt }));
  if (BigInt(order.amount) !== amount || order.receipt !== receipt || order.status !== "created") throw new Error("RAZORPAY_ORDER_MISMATCH");
  return order;
}
export async function getPayment(id: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) throw new Error("INVALID_PAYMENT_ID");
  const payment = providerPaymentSchema.parse(await api(`payments/${id}`));
  if (payment.id !== id) throw new Error("RAZORPAY_PAYMENT_MISMATCH");
  return payment;
}
export function verifyCheckout(order: string, payment: string, signature: string) {
  return validHmac(`${order}|${payment}`, signature, razorpayConfig().secret);
}
export function verifyWebhook(raw: Uint8Array, signature: string) {
  razorpayConfig();
  return validHmac(raw, signature, process.env.RAZORPAY_WEBHOOK_SECRET ?? "");
}
