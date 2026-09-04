import { NextResponse } from "next/server";
import { z } from "zod";

import { checkPublicWriteRateLimit } from "@/auth/rate-limit";
import { getPublicOrganizationId } from "@/core/public-organization";
import { prisma } from "@/db/client";

const schema = z.object({
  eventType: z.enum(["PAGE_VIEW", "CTA_CLICK", "WHATSAPP_CLICK", "FORM_START", "FORM_SUBMIT"]),
  path: z.string().startsWith("/").max(500),
  contentItemId: z.string().cuid().optional(),
});

/** Public events carry no identity, payload, URL query, referrer or provider data. */
export async function POST(request: Request) {
  const limit = await checkPublicWriteRateLimit("analytics", request.headers).catch(() => ({ allowed: false, retryAfter: 60 }));
  if (!limit.allowed) return new NextResponse(null, { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const organizationId = await getPublicOrganizationId();
  if (!organizationId) return new NextResponse(null, { status: 204 });
  if (parsed.data.contentItemId) {
    const item = await prisma.contentItem.findFirst({ where: { id: parsed.data.contentItemId, organizationId }, select: { id: true } });
    if (!item) return new NextResponse(null, { status: 204 });
  }
  await prisma.websiteAnalyticsEvent.create({ data: { organizationId, ...parsed.data } });
  return new NextResponse(null, { status: 204 });
}
