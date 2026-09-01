CREATE TYPE "PublicProductType" AS ENUM ('INVITATION', 'VIDEO_INVITATION', 'AUDIO_INVITATION');
CREATE TYPE "PublicProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ProductMediaRole" AS ENUM ('COVER', 'GALLERY', 'VIDEO_PREVIEW', 'AUDIO_PREVIEW');

CREATE TABLE "PublicCategory" ("id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "parentId" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PublicCategory_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "PublicCategory_slug_key" ON "PublicCategory"("slug");
CREATE INDEX "PublicCategory_parentId_active_idx" ON "PublicCategory"("parentId", "active");
ALTER TABLE "PublicCategory" ADD CONSTRAINT "PublicCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PublicCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "VisualStyle" ("id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "VisualStyle_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "VisualStyle_slug_key" ON "VisualStyle"("slug");

CREATE TABLE "PublicProduct" ("id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "shortDescription" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "productType" "PublicProductType" NOT NULL, "startingPrice" INTEGER, "pricingLabel" TEXT, "currency" TEXT NOT NULL DEFAULT 'INR', "status" "PublicProductStatus" NOT NULL DEFAULT 'DRAFT', "featured" BOOLEAN NOT NULL DEFAULT false, "displayOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PublicProduct_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "PublicProduct_slug_key" ON "PublicProduct"("slug");
CREATE INDEX "PublicProduct_status_featured_displayOrder_idx" ON "PublicProduct"("status", "featured", "displayOrder");
CREATE INDEX "PublicProduct_categoryId_status_displayOrder_idx" ON "PublicProduct"("categoryId", "status", "displayOrder");
ALTER TABLE "PublicProduct" ADD CONSTRAINT "PublicProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PublicCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PublicProductStyle" ("productId" TEXT NOT NULL, "styleId" TEXT NOT NULL, CONSTRAINT "PublicProductStyle_pkey" PRIMARY KEY ("productId", "styleId"));
CREATE INDEX "PublicProductStyle_styleId_idx" ON "PublicProductStyle"("styleId");
ALTER TABLE "PublicProductStyle" ADD CONSTRAINT "PublicProductStyle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PublicProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicProductStyle" ADD CONSTRAINT "PublicProductStyle_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "VisualStyle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PublicProductMedia" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "mediaAssetId" TEXT NOT NULL, "role" "ProductMediaRole" NOT NULL, "altText" TEXT, "displayOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "PublicProductMedia_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "PublicProductMedia_productId_mediaAssetId_role_key" ON "PublicProductMedia"("productId", "mediaAssetId", "role");
CREATE INDEX "PublicProductMedia_productId_role_displayOrder_idx" ON "PublicProductMedia"("productId", "role", "displayOrder");
ALTER TABLE "PublicProductMedia" ADD CONSTRAINT "PublicProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PublicProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicProductMedia" ADD CONSTRAINT "PublicProductMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PublicCollection" ("id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "shortDescription" TEXT, "coverMediaAssetId" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "displayOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PublicCollection_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "PublicCollection_slug_key" ON "PublicCollection"("slug");
CREATE INDEX "PublicCollection_active_displayOrder_idx" ON "PublicCollection"("active", "displayOrder");

CREATE TABLE "PublicCollectionProduct" ("collectionId" TEXT NOT NULL, "productId" TEXT NOT NULL, "displayOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "PublicCollectionProduct_pkey" PRIMARY KEY ("collectionId", "productId"));
CREATE INDEX "PublicCollectionProduct_productId_idx" ON "PublicCollectionProduct"("productId");
ALTER TABLE "PublicCollectionProduct" ADD CONSTRAINT "PublicCollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "PublicCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicCollectionProduct" ADD CONSTRAINT "PublicCollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PublicProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
