CREATE TYPE "WebsitePublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');
CREATE TYPE "WebsitePlacement" AS ENUM ('HOMEPAGE_FEATURED', 'OUR_WORK_GRID', 'FILMS_FEATURED', 'MUSIC_SHOWCASE');

ALTER TABLE "MediaAsset"
  ADD COLUMN "displayTitle" TEXT,
  ADD COLUMN "altText" TEXT,
  ADD COLUMN "description" TEXT;

CREATE TABLE "WebsitePublication" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "mediaAssetId" TEXT NOT NULL,
  "placement" "WebsitePlacement" NOT NULL,
  "status" "WebsitePublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "title" TEXT,
  "description" TEXT,
  "altText" TEXT,
  "category" TEXT,
  "slug" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "unpublishedAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "updatedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsitePublication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebsitePublication_organizationId_status_placement_sortOrder_idx" ON "WebsitePublication"("organizationId", "status", "placement", "sortOrder");
CREATE INDEX "WebsitePublication_mediaAssetId_idx" ON "WebsitePublication"("mediaAssetId");
CREATE UNIQUE INDEX "WebsitePublication_organizationId_mediaAssetId_placement_key" ON "WebsitePublication"("organizationId", "mediaAssetId", "placement");
ALTER TABLE "WebsitePublication" ADD CONSTRAINT "WebsitePublication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsitePublication" ADD CONSTRAINT "WebsitePublication_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
