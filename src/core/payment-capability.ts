import "server-only";
import { Buffer } from "node:buffer";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const paymentAccessSchema = z.object({ paymentIntentId: z.string().min(1).max(100), paymentAccessToken: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export function createPaymentCapability(scope: string) {
  const secret = process.env.BETTER_AUTH_SECRET ?? (process.env.NODE_ENV === "test" ? "test-payment-capability-secret" : undefined);
  if (!secret) throw new Error("PAYMENT_CAPABILITY_UNAVAILABLE");
  const token = createHmac("sha256", secret).update(`shivayonic-payment:${scope}`).digest("hex");
  return { token, hash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 86400000) };
}
export function validPaymentCapability(token: string, hash: string | null, expiresAt: Date | null) {
  if (!/^[a-f0-9]{64}$/.test(token) || !hash || !/^[a-f0-9]{64}$/.test(hash) || !expiresAt || expiresAt.getTime() <= Date.now()) return false;
  return timingSafeEqual(createHash("sha256").update(token).digest(), Buffer.from(hash, "hex"));
}
