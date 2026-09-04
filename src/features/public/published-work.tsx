import { prisma } from "@/db/client";
import { unstable_noStore as noStore } from "next/cache";
import { isPubliclyRenderable, type WebsitePlacement } from "@/shared/website-publication";
import { getPublicOrganizationId } from "@/core/public-organization";

/** Database content augments curated pages. Empty/error keeps the established static fallback. */
export async function PublishedWork({ placement, title = "From the studio" }: { placement: WebsitePlacement; title?: string }) {
  noStore();
  try {
    const organizationId = await getPublicOrganizationId();
    if (!organizationId) return null;
    const rows = await prisma.websitePublication.findMany({
      where: { organizationId, placement: placement as never, status: "PUBLISHED" },
      include: { mediaAsset: { select: { id: true, kind: true, status: true, archivedAt: true, originalFilename: true } } },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }], take: 12,
    });
    const publications = rows.filter(isPubliclyRenderable);
    if (!publications.length) return null;
    return <section className="section creamSection"><div className="shell"><h2>{title}</h2><div className="styleCards filmCards">{publications.map((entry) => <article className="styleCard" key={entry.id}>
      {entry.mediaAsset.kind === "IMAGE" ? (
        // eslint-disable-next-line @next/next/no-img-element -- private asset is served through the controlled publication route.
        <img className="styleCardArt hasPhoto" src={`/api/public/media/${entry.mediaAsset.id}`} alt={entry.altText || entry.title || entry.mediaAsset.originalFilename} />
      ) : null}
      {entry.mediaAsset.kind === "VIDEO" ? <video className="styleCardArt" controls preload="metadata"><source src={`/api/public/media/${entry.mediaAsset.id}`} /></video> : null}
      {entry.mediaAsset.kind === "AUDIO" ? <audio controls preload="metadata"><source src={`/api/public/media/${entry.mediaAsset.id}`} /></audio> : null}
      <div className="styleCardBody"><p className="styleCardName">{entry.title || entry.mediaAsset.originalFilename}</p>{entry.description ? <p className="styleCardNote">{entry.description}</p> : null}</div>
    </article>)}</div></div></section>;
  } catch { return null; }
}
