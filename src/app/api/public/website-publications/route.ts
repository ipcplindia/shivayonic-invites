import { NextResponse } from "next/server";

import { prisma } from "@/db/client";
import { isPubliclyRenderable, websitePlacements } from "@/shared/website-publication";

/** Public projection: published + READY only. Storage keys never leave the server. */
export async function GET(request: Request) {
  const placement = new URL(request.url).searchParams.get("placement");
  if (!placement || !websitePlacements.includes(placement as never)) return NextResponse.json({ publications: [] });
  const candidates = await prisma.websitePublication.findMany({
    where: { placement: placement as never, status: "PUBLISHED" },
    include: { mediaAsset: { select: { id: true, kind: true, status: true, archivedAt: true, mimeType: true, originalFilename: true } } },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
  });
  const publications = candidates.filter(isPubliclyRenderable).map(({ mediaAsset, id, placement: destination, title, description, altText, category, slug, sortOrder, publishedAt }) => ({ id, placement: destination, title, description, altText, category, slug, sortOrder, publishedAt, media: { id: mediaAsset.id, kind: mediaAsset.kind, mimeType: mediaAsset.mimeType, originalFilename: mediaAsset.originalFilename } }));
  return NextResponse.json({ publications }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
