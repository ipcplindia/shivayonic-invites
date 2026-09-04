import { z } from "zod";

export const contentTypes = ["VIDEO", "IMAGE", "CAROUSEL", "ARTICLE", "CAMPAIGN_ASSET"] as const;
export const contentItemStatuses = ["DRAFT", "READY", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
export const destinationPlatforms = ["WEBSITE", "INSTAGRAM", "YOUTUBE"] as const;
export const destinationStatuses = ["DRAFT", "READY", "QUEUED", "PROCESSING", "PUBLISHED", "FAILED", "DISABLED"] as const;
export const publishJobStatuses = ["QUEUED", "PROCESSING", "PUBLISHED", "FAILED", "CANCELLED"] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || undefined);
const mediaId = z.string().refine((value) => z.string().cuid().safeParse(value).success || z.string().uuid().safeParse(value).success, "Invalid media id");
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);

export const websiteDestinationMetadataSchema = z.object({
  title: optionalText(500),
  description: optionalText(4_000),
  placement: z.enum(["HOMEPAGE_FEATURED", "OUR_WORK_GRID", "FILMS_FEATURED", "MUSIC_SHOWCASE"]),
  slug: slug.optional(),
});

export const instagramDestinationMetadataSchema = z.object({
  format: z.enum(["POST", "REEL", "STORY"]),
  caption: optionalText(2_200),
  coverMediaId: mediaId.optional(),
  showOnFeed: z.boolean().optional(),
  aiGeneratedDisclosure: z.boolean().optional(),
});

export const youtubeDestinationMetadataSchema = z.object({
  title: optionalText(100),
  description: optionalText(5_000),
  format: z.enum(["VIDEO", "SHORT"]),
  privacy: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]),
  tags: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  category: optionalText(120),
  madeForKids: z.boolean(),
  syntheticContentDisclosure: z.boolean().optional(),
  thumbnailMediaId: mediaId.optional(),
});

export const contentItemCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  slug: slug.optional(),
  description: optionalText(8_000),
  contentType: z.enum(contentTypes),
  masterMediaId: mediaId.optional(),
  thumbnailMediaId: mediaId.optional(),
});

export const contentItemUpdateSchema = contentItemCreateSchema.partial().extend({
  status: z.enum(contentItemStatuses).optional(),
});

export const destinationInputSchema = z.discriminatedUnion("platform", [
  z.object({ platform: z.literal("WEBSITE"), enabled: z.boolean().default(true), scheduledFor: z.string().datetime().optional(), metadata: websiteDestinationMetadataSchema }),
  z.object({ platform: z.literal("INSTAGRAM"), enabled: z.boolean().default(false), scheduledFor: z.string().datetime().optional(), metadata: instagramDestinationMetadataSchema }),
  z.object({ platform: z.literal("YOUTUBE"), enabled: z.boolean().default(false), scheduledFor: z.string().datetime().optional(), metadata: youtubeDestinationMetadataSchema }),
]);

export const publishRequestSchema = z.object({
  idempotencyKey: z.string().uuid(),
  scheduledFor: z.string().datetime().optional(),
});

export type ContentPlatform = (typeof destinationPlatforms)[number];
