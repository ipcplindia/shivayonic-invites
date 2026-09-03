import { z } from "zod";

export const websitePlacements = ["HOMEPAGE_FEATURED", "OUR_WORK_GRID", "FILMS_FEATURED", "MUSIC_SHOWCASE"] as const;
export type WebsitePlacement = (typeof websitePlacements)[number];
export const websitePublicationStatuses = ["DRAFT", "PUBLISHED", "UNPUBLISHED"] as const;
export type WebsitePublicationStatus = (typeof websitePublicationStatuses)[number];

const copy = z.string().trim().max(500).optional().transform((value) => value || undefined);
const mediaId = z.string().refine((value) => z.string().cuid().safeParse(value).success || z.string().uuid().safeParse(value).success, "Invalid media id");
export const websitePublicationInputSchema = z.object({
  mediaId,
  placement: z.enum(websitePlacements),
  title: copy,
  description: z.string().trim().max(4_000).optional().transform((value) => value || undefined),
  altText: copy,
  category: z.string().trim().max(80).optional().transform((value) => value || undefined),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).optional().transform((value) => value || undefined),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});
export const websitePublicationUpdateSchema = websitePublicationInputSchema.omit({ mediaId: true }).partial().extend({ action: z.enum(["save", "publish", "unpublish"]).default("save") });
export type WebsitePublicationInput = z.infer<typeof websitePublicationInputSchema>;

export const publicPathsForPlacement: Record<WebsitePlacement, string[]> = {
  HOMEPAGE_FEATURED: ["/"], OUR_WORK_GRID: ["/our-work"], FILMS_FEATURED: ["/films"], MUSIC_SHOWCASE: ["/music"],
};

export function isPubliclyRenderable(publication: { status: string; mediaAsset: { status: string; archivedAt: Date | null } }) {
  return publication.status === "PUBLISHED" && publication.mediaAsset.status === "READY" && !publication.mediaAsset.archivedAt;
}
