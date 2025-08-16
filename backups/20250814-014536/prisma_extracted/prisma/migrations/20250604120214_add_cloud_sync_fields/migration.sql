-- AlterTable
ALTER TABLE "content" ADD COLUMN     "cloudId" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "syncStatus" TEXT DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "cloudId" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "syncStatus" TEXT DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "cloudId" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "syncStatus" TEXT DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "content_cloudId_idx" ON "content"("cloudId");

-- CreateIndex
CREATE INDEX "customers_cloudId_idx" ON "customers"("cloudId");

-- CreateIndex
CREATE INDEX "proposals_cloudId_idx" ON "proposals"("cloudId");
