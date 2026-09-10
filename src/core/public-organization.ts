import "server-only";

import { getServerConfig } from "@/config/env";
import { prisma } from "@/db/client";
import { ensurePreviewBaseline } from "@/auth/ensure-preview-baseline";

export async function getPublicOrganizationId() {
  await ensurePreviewBaseline();
  const config = getServerConfig();
  const organizationSlug = process.env.VERCEL_ENV === "preview"
    ? (config.ADMIN_BOOTSTRAP_ORG_SLUG ?? config.PUBLIC_ORGANIZATION_SLUG)
    : config.PUBLIC_ORGANIZATION_SLUG;
  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    select: { id: true },
  });
  return organization?.id ?? null;
}
