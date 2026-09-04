CREATE TYPE "ContentItemType" AS ENUM ('VIDEO', 'IMAGE', 'CAROUSEL', 'ARTICLE', 'CAMPAIGN_ASSET');
CREATE TYPE "ContentItemStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ContentDestinationPlatform" AS ENUM ('WEBSITE', 'INSTAGRAM', 'YOUTUBE');
CREATE TYPE "ContentDestinationStatus" AS ENUM ('DRAFT', 'READY', 'QUEUED', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DISABLED');
CREATE TYPE "PublishJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'PUBLISHED', 'FAILED', 'CANCELLED');
CREATE TYPE "IntegrationConnectionStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTED', 'EXPIRED', 'ERROR', 'DISABLED');
CREATE TYPE "WebsiteAnalyticsEventType" AS ENUM ('PAGE_VIEW', 'CTA_CLICK', 'WHATSAPP_CLICK', 'FORM_START', 'FORM_SUBMIT');

CREATE TABLE "ContentItem" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT,
  "description" TEXT,
  "contentType" "ContentItemType" NOT NULL,
  "status" "ContentItemStatus" NOT NULL DEFAULT 'DRAFT',
  "masterMediaId" TEXT,
  "thumbnailMediaId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "updatedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentDestination" (
  "id" TEXT NOT NULL,
  "contentItemId" TEXT NOT NULL,
  "platform" "ContentDestinationPlatform" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "status" "ContentDestinationStatus" NOT NULL DEFAULT 'DRAFT',
  "metadata" JSONB,
  "scheduledFor" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentDestination_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublishJob" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "contentItemId" TEXT NOT NULL,
  "destinationId" TEXT NOT NULL,
  "provider" "ContentDestinationPlatform" NOT NULL,
  "status" "PublishJobStatus" NOT NULL DEFAULT 'QUEUED',
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "scheduledFor" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublishJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformPublication" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "contentItemId" TEXT NOT NULL,
  "destinationId" TEXT NOT NULL,
  "provider" "ContentDestinationPlatform" NOT NULL,
  "externalId" TEXT,
  "externalUrl" TEXT,
  "providerStatus" TEXT,
  "publishedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformPublication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentMetricSnapshot" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "contentItemId" TEXT NOT NULL,
  "platformPublicationId" TEXT,
  "provider" "ContentDestinationPlatform" NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL,
  "views" INTEGER,
  "reach" INTEGER,
  "impressions" INTEGER,
  "likes" INTEGER,
  "comments" INTEGER,
  "shares" INTEGER,
  "saves" INTEGER,
  "watchTimeSeconds" INTEGER,
  "averageViewDurationSeconds" INTEGER,
  "clicks" INTEGER,
  "profileVisits" INTEGER,
  "subscribersGained" INTEGER,
  "subscribersLost" INTEGER,
  CONSTRAINT "ContentMetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationConnection" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "provider" "ContentDestinationPlatform" NOT NULL,
  "externalAccountId" TEXT,
  "externalAccountName" TEXT,
  "status" "IntegrationConnectionStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tokenExpiresAt" TIMESTAMP(3),
  "encryptedAccessToken" TEXT,
  "encryptedRefreshToken" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebsiteAnalyticsEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "contentItemId" TEXT,
  "eventType" "WebsiteAnalyticsEventType" NOT NULL,
  "path" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebsiteAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentItem_organizationId_slug_key" ON "ContentItem"("organizationId", "slug");
CREATE INDEX "ContentItem_organizationId_status_updatedAt_idx" ON "ContentItem"("organizationId", "status", "updatedAt");
CREATE INDEX "ContentItem_masterMediaId_idx" ON "ContentItem"("masterMediaId");
CREATE UNIQUE INDEX "ContentDestination_contentItemId_platform_key" ON "ContentDestination"("contentItemId", "platform");
CREATE INDEX "ContentDestination_platform_status_scheduledFor_idx" ON "ContentDestination"("platform", "status", "scheduledFor");
CREATE UNIQUE INDEX "PublishJob_idempotencyKey_key" ON "PublishJob"("idempotencyKey");
CREATE INDEX "PublishJob_organizationId_status_scheduledFor_idx" ON "PublishJob"("organizationId", "status", "scheduledFor");
CREATE INDEX "PublishJob_contentItemId_provider_status_idx" ON "PublishJob"("contentItemId", "provider", "status");
CREATE INDEX "PublishJob_destinationId_createdAt_idx" ON "PublishJob"("destinationId", "createdAt");
CREATE UNIQUE INDEX "PlatformPublication_destinationId_key" ON "PlatformPublication"("destinationId");
CREATE UNIQUE INDEX "PlatformPublication_contentItemId_provider_key" ON "PlatformPublication"("contentItemId", "provider");
CREATE INDEX "PlatformPublication_organizationId_provider_publishedAt_idx" ON "PlatformPublication"("organizationId", "provider", "publishedAt");
CREATE INDEX "ContentMetricSnapshot_organizationId_provider_capturedAt_idx" ON "ContentMetricSnapshot"("organizationId", "provider", "capturedAt");
CREATE INDEX "ContentMetricSnapshot_contentItemId_capturedAt_idx" ON "ContentMetricSnapshot"("contentItemId", "capturedAt");
CREATE INDEX "ContentMetricSnapshot_platformPublicationId_capturedAt_idx" ON "ContentMetricSnapshot"("platformPublicationId", "capturedAt");
CREATE UNIQUE INDEX "IntegrationConnection_organizationId_provider_key" ON "IntegrationConnection"("organizationId", "provider");
CREATE INDEX "IntegrationConnection_organizationId_status_idx" ON "IntegrationConnection"("organizationId", "status");
CREATE INDEX "WebsiteAnalyticsEvent_organizationId_eventType_occurredAt_idx" ON "WebsiteAnalyticsEvent"("organizationId", "eventType", "occurredAt");
CREATE INDEX "WebsiteAnalyticsEvent_contentItemId_occurredAt_idx" ON "WebsiteAnalyticsEvent"("contentItemId", "occurredAt");

ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_masterMediaId_fkey" FOREIGN KEY ("masterMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_thumbnailMediaId_fkey" FOREIGN KEY ("thumbnailMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentDestination" ADD CONSTRAINT "ContentDestination_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "ContentDestination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformPublication" ADD CONSTRAINT "PlatformPublication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformPublication" ADD CONSTRAINT "PlatformPublication_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformPublication" ADD CONSTRAINT "PlatformPublication_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "ContentDestination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentMetricSnapshot" ADD CONSTRAINT "ContentMetricSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentMetricSnapshot" ADD CONSTRAINT "ContentMetricSnapshot_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentMetricSnapshot" ADD CONSTRAINT "ContentMetricSnapshot_platformPublicationId_fkey" FOREIGN KEY ("platformPublicationId") REFERENCES "PlatformPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteAnalyticsEvent" ADD CONSTRAINT "WebsiteAnalyticsEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteAnalyticsEvent" ADD CONSTRAINT "WebsiteAnalyticsEvent_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
