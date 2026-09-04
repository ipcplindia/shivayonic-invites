import "server-only";

import { getServerConfig } from "@/config/env";
import { prisma } from "@/db/client";

export async function getPublicOrganizationId() {
  const organization = await prisma.organization.findUnique({
    where: { slug: getServerConfig().PUBLIC_ORGANIZATION_SLUG },
    select: { id: true },
  });
  return organization?.id ?? null;
}
