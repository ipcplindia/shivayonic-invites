import "server-only";

import { Prisma } from "@prisma/client";

import { AppAuthError } from "@/auth/errors";
import { prisma } from "@/db/client";
import type { ContentPlatform } from "@/shared/content";

export class ProviderNotConfiguredError extends Error {
  code = "INTEGRATION_REQUIRED" as const;
}

export type PublishingProvider = { platform: ContentPlatform; validateConnection(): Promise<void> };

export const instagramPublishingProvider: PublishingProvider = {
  platform: "INSTAGRAM",
  async validateConnection() { throw new ProviderNotConfiguredError("Instagram is not connected."); },
};

export const youtubePublishingProvider: PublishingProvider = {
  platform: "YOUTUBE",
  async validateConnection() { throw new ProviderNotConfiguredError("YouTube is not connected."); },
};

async function assertOwnedReadyMedia(organizationId: string, mediaId: string | undefined) {
  if (!mediaId) return;
  const media = await prisma.mediaAsset.findFirst({ where: { id: mediaId, organizationId, status: "READY", archivedAt: null }, select: { id: true } });
  if (!media) throw new AppAuthError("ORGANIZATION_MEMBERSHIP_REQUIRED", 403);
}

export async function createContentItem(input: {
  organizationId: string; actorUserId: string; title: string; slug?: string; description?: string;
  contentType: "VIDEO" | "IMAGE" | "CAROUSEL" | "ARTICLE" | "CAMPAIGN_ASSET"; masterMediaId?: string; thumbnailMediaId?: string;
}) {
  await Promise.all([assertOwnedReadyMedia(input.organizationId, input.masterMediaId), assertOwnedReadyMedia(input.organizationId, input.thumbnailMediaId)]);
  return prisma.contentItem.create({ data: { ...input, createdByUserId: input.actorUserId, updatedByUserId: input.actorUserId } });
}

export async function saveDestination(input: {
  organizationId: string; contentItemId: string; platform: ContentPlatform; enabled: boolean; scheduledFor?: Date; metadata: Prisma.InputJsonValue;
}) {
  const item = await prisma.contentItem.findFirst({ where: { id: input.contentItemId, organizationId: input.organizationId }, select: { id: true } });
  if (!item) throw new AppAuthError("ORGANIZATION_MEMBERSHIP_REQUIRED", 403);
  const disconnected = input.platform === "INSTAGRAM" || input.platform === "YOUTUBE";
  return prisma.contentDestination.upsert({
    where: { contentItemId_platform: { contentItemId: item.id, platform: input.platform } },
    create: { contentItemId: item.id, platform: input.platform, enabled: disconnected ? false : input.enabled, status: disconnected ? "DISABLED" : input.scheduledFor ? "QUEUED" : "READY", metadata: input.metadata, scheduledFor: input.scheduledFor },
    update: { enabled: disconnected ? false : input.enabled, status: disconnected ? "DISABLED" : input.scheduledFor ? "QUEUED" : "READY", metadata: input.metadata, scheduledFor: input.scheduledFor },
  });
}

/** Website is the only active adapter. Disconnected providers never create fake jobs. */
export async function publishDestination(input: {
  organizationId: string; actorUserId: string; contentItemId: string; platform: ContentPlatform; idempotencyKey: string; scheduledFor?: Date;
}) {
  if (input.platform === "INSTAGRAM") await instagramPublishingProvider.validateConnection();
  if (input.platform === "YOUTUBE") await youtubePublishingProvider.validateConnection();

  const destination = await prisma.contentDestination.findFirst({ where: { contentItemId: input.contentItemId, platform: "WEBSITE", contentItem: { organizationId: input.organizationId } }, include: { contentItem: true } });
  if (!destination?.contentItem.masterMediaId) throw new Error("CONTENT_MEDIA_NOT_READY");
  if (!destination.enabled) throw new Error("DESTINATION_DISABLED");
  const existing = await prisma.publishJob.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;

  const metadata = destination.metadata as { placement?: "HOMEPAGE_FEATURED" | "OUR_WORK_GRID" | "FILMS_FEATURED" | "MUSIC_SHOWCASE"; title?: string; description?: string; slug?: string } | null;
  if (!metadata?.placement) throw new Error("INVALID_DESTINATION_METADATA");
  const placement = metadata.placement;
  if (input.scheduledFor && input.scheduledFor > new Date()) {
    return prisma.publishJob.create({ data: { organizationId: input.organizationId, contentItemId: input.contentItemId, destinationId: destination.id, provider: "WEBSITE", status: "QUEUED", scheduledFor: input.scheduledFor, nextAttemptAt: input.scheduledFor, idempotencyKey: input.idempotencyKey, createdByUserId: input.actorUserId } });
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const publication = await tx.websitePublication.upsert({
      where: { organizationId_mediaAssetId_placement: { organizationId: input.organizationId, mediaAssetId: destination.contentItem.masterMediaId!, placement } },
      create: { organizationId: input.organizationId, mediaAssetId: destination.contentItem.masterMediaId!, placement, status: "PUBLISHED", title: metadata.title, description: metadata.description, slug: metadata.slug, publishedAt: now, createdByUserId: input.actorUserId, updatedByUserId: input.actorUserId },
      update: { status: "PUBLISHED", title: metadata.title, description: metadata.description, slug: metadata.slug, publishedAt: now, unpublishedAt: null, updatedByUserId: input.actorUserId },
    });
    const job = await tx.publishJob.create({ data: { organizationId: input.organizationId, contentItemId: input.contentItemId, destinationId: destination.id, provider: "WEBSITE", status: "PUBLISHED", attempt: 1, startedAt: now, completedAt: now, idempotencyKey: input.idempotencyKey, createdByUserId: input.actorUserId } });
    await tx.contentDestination.update({ where: { id: destination.id }, data: { status: "PUBLISHED", publishedAt: now, lastAttemptAt: now } });
    await tx.contentItem.update({ where: { id: input.contentItemId }, data: { status: "PUBLISHED", updatedByUserId: input.actorUserId } });
    await tx.platformPublication.upsert({
      where: { destinationId: destination.id },
      create: { organizationId: input.organizationId, contentItemId: input.contentItemId, destinationId: destination.id, provider: "WEBSITE", externalId: publication.id, externalUrl: "/our-work", providerStatus: "PUBLISHED", publishedAt: publication.publishedAt, metadata: { websitePublicationId: publication.id } },
      update: { externalId: publication.id, externalUrl: "/our-work", providerStatus: "PUBLISHED", publishedAt: publication.publishedAt, metadata: { websitePublicationId: publication.id } },
    });
    return job;
  });
}

export function publishingErrorCode(error: unknown) {
  if (error instanceof ProviderNotConfiguredError) return error.code;
  if (error instanceof Error && ["CONTENT_MEDIA_NOT_READY", "DESTINATION_DISABLED", "INVALID_DESTINATION_METADATA"].includes(error.message)) return error.message;
  return "PUBLISHING_UNAVAILABLE";
}
