import { NextResponse } from "next/server";

import { getObjectStorage } from "@/core/storage-provider";
import { getPublicOrganizationId } from "@/core/public-organization";
import { prisma } from "@/db/client";

type RouteContext = { params: Promise<{ mediaId: string }> };

/** A public website asset is authorised by a live publication, never by a bucket URL. */
export async function GET(_request: Request, route: RouteContext) {
  const { mediaId } = await route.params;
  const organizationId = await getPublicOrganizationId();
  if (!organizationId) return new NextResponse(null, { status: 404 });
  const media = await prisma.mediaAsset.findFirst({
    where: { id: mediaId, organizationId, status: "READY", archivedAt: null, websitePublications: { some: { organizationId, status: "PUBLISHED" } } },
    select: { storageKey: true, originalFilename: true },
  });
  if (!media) return new NextResponse(null, { status: 404, headers: { "cache-control": "no-store" } });
  const target = await getObjectStorage().createDownloadTarget({ storageKey: media.storageKey, disposition: "inline", filename: media.originalFilename });
  if (!target) return new NextResponse(null, { status: 404, headers: { "cache-control": "no-store" } });
  return NextResponse.redirect(target.url, 307);
}
