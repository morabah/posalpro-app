-- DropIndex
DROP INDEX "idx_customers_country";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "datasheetPath" TEXT;
