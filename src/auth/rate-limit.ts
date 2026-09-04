import "server-only";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";

type RateRule = { window: number; max: number };
type RateDecision = { allowed: boolean; retryAfter: number | null };

function rateKey(value: string) {
  return `security-rate:${createHash("sha256").update(value).digest("hex")}`;
}

/** Atomic, durable counter stored in Better Auth's existing Verification table. */
export async function consumeDurableRateLimit(key: string, rule: RateRule, now = new Date()): Promise<RateDecision> {
  const id = rateKey(key);
  const resetAt = new Date(now.getTime() + rule.window * 1_000);
  const pruneBefore = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
  const rows = await prisma.$queryRaw<Array<{ count: number; expiresAt: Date }>>(Prisma.sql`
    WITH "pruned" AS (
      DELETE FROM "Verification"
      WHERE "id" IN (
        SELECT "id" FROM "Verification"
        WHERE "identifier" = 'security-rate-limit' AND "expiresAt" <= ${pruneBefore}
        LIMIT 100
      )
    ), "consumed" AS (
      INSERT INTO "Verification" ("id", "identifier", "value", "expiresAt", "createdAt", "updatedAt")
      VALUES (${id}, 'security-rate-limit', '1', ${resetAt}, ${now}, ${now})
      ON CONFLICT ("id") DO UPDATE SET
        "value" = CASE
          WHEN "Verification"."expiresAt" <= ${now} THEN '1'
          ELSE (("Verification"."value"::integer + 1)::text)
        END,
        "expiresAt" = CASE
          WHEN "Verification"."expiresAt" <= ${now} THEN ${resetAt}
          ELSE "Verification"."expiresAt"
        END,
        "updatedAt" = ${now}
      RETURNING "value"::integer AS "count", "expiresAt"
    )
    SELECT "count", "expiresAt" FROM "consumed"
  `);
  const row = rows[0];
  if (!row) return { allowed: false, retryAfter: rule.window };
  const retryAfter = Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1_000));
  return row.count <= rule.max ? { allowed: true, retryAfter: null } : { allowed: false, retryAfter };
}

export const betterAuthRateLimitStorage = { consume: consumeDurableRateLimit };

export async function checkLoginRateLimit(email: string, headers: Headers): Promise<RateDecision> {
  const clientIp = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const network = await consumeDurableRateLimit(`login:ip:${clientIp}`, { window: 600, max: 20 });
  if (!network.allowed) return network;
  return consumeDurableRateLimit(`login:email:${email.trim().toLowerCase()}`, { window: 600, max: 5 });
}

export async function checkPublicWriteRateLimit(scope: string, headers: Headers): Promise<RateDecision> {
  const clientIp = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return consumeDurableRateLimit(`public:${scope}:ip:${clientIp}`, { window: 600, max: 10 });
}
