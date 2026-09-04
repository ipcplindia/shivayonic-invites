import { z } from "zod";

export const catalogueStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const productTypes = ["INVITATION", "VIDEO_INVITATION", "AUDIO_INVITATION"] as const;

const reservedSlugs = new Set(["admin", "api", "login", "logout", "product", "catalogue", "plans", "styles", "media"]);
export const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).refine((slug) => !reservedSlugs.has(slug), "Reserved slug");
const optionalText = (max = 500) => z.string().trim().max(max).optional().transform((value) => value || undefined);
const featuresSchema = z.array(z.string().trim().min(1).max(180)).max(20);
const mediaIdSchema = z.string().trim().optional().transform((value) => value || undefined);

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  description: optionalText(1000),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  status: z.enum(catalogueStatuses).default("DRAFT"),
  mediaAssetId: mediaIdSchema,
});

export const styleInputSchema = categoryInputSchema;

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  shortDescription: z.string().trim().min(10).max(500),
  fullDescription: optionalText(4000),
  categoryId: z.string().min(1),
  styleIds: z.array(z.string().min(1)).max(8).default([]),
  productType: z.enum(productTypes).default("INVITATION"),
  ctaLabel: optionalText(80),
  ctaHref: optionalText(300),
  features: featuresSchema.default([]),
  turnaround: optionalText(120),
  duration: optionalText(120),
  coverMediaAssetId: mediaIdSchema,
  displayOrder: z.number().int().min(0).max(10_000).default(0),
  featured: z.boolean().default(false),
  status: z.enum(catalogueStatuses).default("DRAFT"),
});

export const planInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  subtitle: optionalText(240),
  description: z.string().trim().min(10).max(2000),
  features: featuresSchema.default([]),
  ctaLabel: optionalText(80),
  ctaHref: optionalText(300),
  recommended: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  status: z.enum(catalogueStatuses).default("DRAFT"),
  mediaAssetId: mediaIdSchema,
});

export function safeFeatures(value: unknown): string[] {
  const parsed = featuresSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function publicationPathsForCatalogue(input?: { slug?: string | null; isPlan?: boolean }) {
  return input?.isPlan ? ["/plans"] : ["/catalogue", ...(input?.slug ? [`/product/${input.slug}`] : [])];
}
