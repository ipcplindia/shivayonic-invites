ALTER TABLE "PublicCategory" ADD COLUMN "description" TEXT,
ADD COLUMN "mediaAssetId" TEXT,
ADD COLUMN "organizationId" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "status" "PublicProductStatus" NOT NULL DEFAULT 'PUBLISHED';

ALTER TABLE "VisualStyle" ADD COLUMN "mediaAssetId" TEXT,
ADD COLUMN "organizationId" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "status" "PublicProductStatus" NOT NULL DEFAULT 'PUBLISHED';

ALTER TABLE "PublicProduct" ADD COLUMN "coverMediaAssetId" TEXT,
ADD COLUMN "ctaHref" TEXT,
ADD COLUMN "ctaLabel" TEXT,
ADD COLUMN "duration" TEXT,
ADD COLUMN "features" JSONB,
ADD COLUMN "fullDescription" TEXT,
ADD COLUMN "organizationId" TEXT,
ADD COLUMN "turnaround" TEXT;

CREATE TABLE "PublicPlan" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subtitle" TEXT,
  "description" TEXT NOT NULL,
  "features" JSONB,
  "ctaLabel" TEXT,
  "ctaHref" TEXT,
  "recommended" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "PublicProductStatus" NOT NULL DEFAULT 'DRAFT',
  "mediaAssetId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublicPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicPlan_slug_key" ON "PublicPlan"("slug");
CREATE INDEX "PublicPlan_organizationId_status_sortOrder_idx" ON "PublicPlan"("organizationId", "status", "sortOrder");
CREATE INDEX "PublicPlan_status_recommended_sortOrder_idx" ON "PublicPlan"("status", "recommended", "sortOrder");
CREATE INDEX "PublicCategory_organizationId_status_sortOrder_idx" ON "PublicCategory"("organizationId", "status", "sortOrder");
CREATE INDEX "VisualStyle_organizationId_status_sortOrder_idx" ON "VisualStyle"("organizationId", "status", "sortOrder");
CREATE INDEX "PublicProduct_organizationId_status_displayOrder_idx" ON "PublicProduct"("organizationId", "status", "displayOrder");

ALTER TABLE "PublicCategory" ADD CONSTRAINT "PublicCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicCategory" ADD CONSTRAINT "PublicCategory_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VisualStyle" ADD CONSTRAINT "VisualStyle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisualStyle" ADD CONSTRAINT "VisualStyle_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PublicProduct" ADD CONSTRAINT "PublicProduct_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicProduct" ADD CONSTRAINT "PublicProduct_coverMediaAssetId_fkey" FOREIGN KEY ("coverMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PublicPlan" ADD CONSTRAINT "PublicPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicPlan" ADD CONSTRAINT "PublicPlan_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
