import "server-only";
import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { checkPublicWriteRateLimit } from "@/auth/rate-limit";
import { isCrossOriginMutation } from "@/auth/request-security";

export async function readPaymentBody(request: Request, max = 8192) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_PAYMENT_INPUT");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > max) { await reader.cancel(); throw new Error("PAYLOAD_TOO_LARGE"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
export async function paymentRequest(request: Request, scope: string) {
  if (isCrossOriginMutation(request)) throw new Error("PAYMENT_ACCESS_DENIED");
  const limit = await checkPublicWriteRateLimit(`payment:${scope}`, request.headers);
  if (!limit.allowed) throw new Error("TOO_MANY_REQUESTS");
  return JSON.parse((await readPaymentBody(request)).toString("utf8")) as unknown;
}
export function paymentResponse(value: unknown) { return NextResponse.json(value, { headers: { "Cache-Control": "no-store" } }); }
export function paymentError(error: unknown) {
  const known: Record<string, number> = { PAYMENT_ACCESS_DENIED: 403, INVALID_PAYMENT_INPUT: 400, PAYLOAD_TOO_LARGE: 413, TOO_MANY_REQUESTS: 429, PAYMENT_NOT_READY: 409, PAYMENT_RECONCILIATION_REQUIRED: 409, PAYMENT_VERIFICATION_REJECTED: 400, INVALID_WEBHOOK_SIGNATURE: 401, INVALID_WEBHOOK_EVENT: 400, PAYMENTS_DISABLED: 503 };
  const message = error instanceof Error ? error.message : "";
  const code = Object.hasOwn(known, message) ? message : "PAYMENT_UNAVAILABLE";
  return NextResponse.json({ error: { code } }, { status: known[code] ?? 503, headers: { "Cache-Control": "no-store" } });
}
