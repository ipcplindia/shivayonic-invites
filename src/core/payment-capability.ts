import "server-only";
import { Buffer } from "node:buffer";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const paymentAccessSchema = z.object({ paymentIntentId: z.string().min(1).max(100), paymentAccessToken: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export function createPaymentCapability(_scope?: string) {
  void _scope; // Scope is enforced by the database relation during validation.
  const days = Number(process.env.PAYMENT_LINK_EXPIRY_DAYS ?? 30);
  if (!Number.isInteger(days) || days < 7 || days > 90) throw new Error("INVALID_PAYMENT_LINK_EXPIRY");
  const token = randomBytes(32).toString("hex");
  return { token, hash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + days * 86_400_000) };
}
export function validPaymentCapability(token: string, hash: string | null, expiresAt: Date | null) {
  if (!/^[a-f0-9]{64}$/.test(token) || !hash || !/^[a-f0-9]{64}$/.test(hash) || !expiresAt || expiresAt.getTime() <= Date.now()) return false;
  return timingSafeEqual(createHash("sha256").update(token).digest(), Buffer.from(hash, "hex"));
}
