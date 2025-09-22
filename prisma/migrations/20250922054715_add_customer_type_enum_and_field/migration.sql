-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('MIDDLEMAN', 'ENDUSER', 'DISTRIBUTOR', 'VENDOR', 'CONTRACTOR');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "customerType" "CustomerType" DEFAULT 'ENDUSER';
