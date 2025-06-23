-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "approvalCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "creatorEmail" TEXT,
ADD COLUMN     "creatorName" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerTier" TEXT,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "productCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sectionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "statsUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "totalValue" DOUBLE PRECISION;
