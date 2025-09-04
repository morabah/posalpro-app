/*
  Warnings:

  - You are about to alter the column `revenue` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `riskScore` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `ltv` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `unitPrice` on the `proposal_products` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `discount` on the `proposal_products` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `total` on the `proposal_products` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `value` on the `proposals` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `riskScore` on the `proposals` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `completionRate` on the `proposals` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `totalValue` on the `proposals` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenantId,email]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tenantId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `proposals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "RuleKind" AS ENUM ('REQUIRES', 'EXCLUDES', 'RECOMMENDS', 'AUTO_ADD', 'CHOOSE_ONE_OF', 'COMPAT_BY_ATTR', 'REPLACED_BY', 'CAPACITY_LINK', 'LICENSE_FOR', 'CONDITION');

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropIndex
DROP INDEX "customers_email_idx";

-- DropIndex
DROP INDEX "products_sku_idx";

-- DropIndex
DROP INDEX "products_sku_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "tenantId" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "revenue" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "riskScore" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "ltv" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "status" TEXT DEFAULT 'ACTIVE',
ADD COLUMN     "stockQuantity" INTEGER DEFAULT 0,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "proposal_products" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "tenantId" TEXT NOT NULL,
ALTER COLUMN "value" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "riskScore" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "completionRate" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "totalValue" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenantId" TEXT NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "audit_logs";

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subdomain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "model" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "diff" JSONB,
    "ip" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idempotency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "Idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_versions" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeType" TEXT NOT NULL,
    "changesSummary" TEXT,
    "snapshot" JSONB NOT NULL,
    "productIds" TEXT[],

    CONSTRAINT "proposal_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_relationship_rules" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" "RuleKind" NOT NULL,
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "rule" JSONB NOT NULL,
    "precedence" INTEGER NOT NULL DEFAULT 0,
    "scope" JSONB,
    "explain" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_relationship_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_relationship_rule_versions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "RuleStatus" NOT NULL,
    "rule" JSONB NOT NULL,
    "explain" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_relationship_rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "tenants_createdAt_idx" ON "tenants"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_model_action_idx" ON "AuditLog"("model", "action");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_at_idx" ON "AuditLog"("actorId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_revoked_idx" ON "ApiKey"("revoked");

-- CreateIndex
CREATE INDEX "ApiKey_createdAt_idx" ON "ApiKey"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Idempotency_key_key" ON "Idempotency"("key");

-- CreateIndex
CREATE INDEX "Idempotency_key_idx" ON "Idempotency"("key");

-- CreateIndex
CREATE INDEX "Idempotency_route_idx" ON "Idempotency"("route");

-- CreateIndex
CREATE INDEX "Idempotency_userId_idx" ON "Idempotency"("userId");

-- CreateIndex
CREATE INDEX "Idempotency_expiresAt_idx" ON "Idempotency"("expiresAt");

-- CreateIndex
CREATE INDEX "proposal_versions_proposalId_version_idx" ON "proposal_versions"("proposalId", "version");

-- CreateIndex
CREATE INDEX "proposal_versions_createdAt_proposalId_idx" ON "proposal_versions"("createdAt", "proposalId");

-- CreateIndex
CREATE INDEX "proposal_versions_productIds_idx" ON "proposal_versions" USING GIN ("productIds");

-- CreateIndex
CREATE INDEX "product_relationship_rules_productId_status_idx" ON "product_relationship_rules"("productId", "status");

-- CreateIndex
CREATE INDEX "product_relationship_rules_ruleType_status_idx" ON "product_relationship_rules"("ruleType", "status");

-- CreateIndex
CREATE INDEX "product_relationship_rules_effectiveFrom_effectiveTo_idx" ON "product_relationship_rules"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "product_relationship_rule_versions_status_createdAt_idx" ON "product_relationship_rule_versions"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_relationship_rule_versions_ruleId_version_key" ON "product_relationship_rule_versions"("ruleId", "version");

-- CreateIndex
CREATE INDEX "Outbox_status_idx" ON "Outbox"("status");

-- CreateIndex
CREATE INDEX "Outbox_createdAt_idx" ON "Outbox"("createdAt");

-- CreateIndex
CREATE INDEX "Outbox_type_idx" ON "Outbox"("type");

-- CreateIndex
CREATE INDEX "Outbox_status_createdAt_idx" ON "Outbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "content_createdAt_idx" ON "content"("createdAt");

-- CreateIndex
CREATE INDEX "content_updatedAt_idx" ON "content"("updatedAt");

-- CreateIndex
CREATE INDEX "content_createdBy_idx" ON "content"("createdBy");

-- CreateIndex
CREATE INDEX "content_lastSyncedAt_idx" ON "content"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "content_isActive_idx" ON "content"("isActive");

-- CreateIndex
CREATE INDEX "content_isPublic_idx" ON "content"("isPublic");

-- CreateIndex
CREATE INDEX "content_type_idx" ON "content"("type");

-- CreateIndex
CREATE INDEX "idx_content_created_by" ON "content"("createdBy");

-- CreateIndex
CREATE INDEX "idx_content_created_at" ON "content"("createdAt");

-- CreateIndex
CREATE INDEX "idx_content_updated_at" ON "content"("updatedAt");

-- CreateIndex
CREATE INDEX "customer_contacts_customerId_idx" ON "customer_contacts"("customerId");

-- CreateIndex
CREATE INDEX "customer_contacts_createdAt_idx" ON "customer_contacts"("createdAt");

-- CreateIndex
CREATE INDEX "customer_contacts_updatedAt_idx" ON "customer_contacts"("updatedAt");

-- CreateIndex
CREATE INDEX "customer_contacts_email_idx" ON "customer_contacts"("email");

-- CreateIndex
CREATE INDEX "customer_contacts_isActive_idx" ON "customer_contacts"("isActive");

-- CreateIndex
CREATE INDEX "idx_customer_contacts_customer_id" ON "customer_contacts"("customerId");

-- CreateIndex
CREATE INDEX "idx_customer_contacts_created_at" ON "customer_contacts"("createdAt");

-- CreateIndex
CREATE INDEX "idx_customer_contacts_updated_at" ON "customer_contacts"("updatedAt");

-- CreateIndex
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");

-- CreateIndex
CREATE INDEX "customers_createdAt_idx" ON "customers"("createdAt");

-- CreateIndex
CREATE INDEX "customers_updatedAt_idx" ON "customers"("updatedAt");

-- CreateIndex
CREATE INDEX "customers_lastContact_idx" ON "customers"("lastContact");

-- CreateIndex
CREATE INDEX "customers_lastSyncedAt_idx" ON "customers"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "customers_tier_idx" ON "customers"("tier");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "idx_customers_tenant_email" ON "customers"("tenantId", "email");

-- CreateIndex
CREATE INDEX "idx_customers_created_at" ON "customers"("createdAt");

-- CreateIndex
CREATE INDEX "idx_customers_updated_at" ON "customers"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_customers_last_contact" ON "customers"("lastContact");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_email_key" ON "customers"("tenantId", "email");

-- CreateIndex
CREATE INDEX "permissions_createdAt_idx" ON "permissions"("createdAt");

-- CreateIndex
CREATE INDEX "permissions_updatedAt_idx" ON "permissions"("updatedAt");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "permissions_scope_idx" ON "permissions"("scope");

-- CreateIndex
CREATE INDEX "idx_permissions_created_at" ON "permissions"("createdAt");

-- CreateIndex
CREATE INDEX "idx_permissions_updated_at" ON "permissions"("updatedAt");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "products_updatedAt_idx" ON "products"("updatedAt");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_currency_idx" ON "products"("currency");

-- CreateIndex
CREATE INDEX "idx_products_tenant_sku" ON "products"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "idx_products_created_at" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "idx_products_updated_at" ON "products"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenantId_sku_key" ON "products"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "proposals_tenantId_idx" ON "proposals"("tenantId");

-- CreateIndex
CREATE INDEX "proposals_createdAt_idx" ON "proposals"("createdAt");

-- CreateIndex
CREATE INDEX "proposals_updatedAt_idx" ON "proposals"("updatedAt");

-- CreateIndex
CREATE INDEX "proposals_submittedAt_idx" ON "proposals"("submittedAt");

-- CreateIndex
CREATE INDEX "proposals_approvedAt_idx" ON "proposals"("approvedAt");

-- CreateIndex
CREATE INDEX "proposals_dueDate_idx" ON "proposals"("dueDate");

-- CreateIndex
CREATE INDEX "proposals_validUntil_idx" ON "proposals"("validUntil");

-- CreateIndex
CREATE INDEX "proposals_lastActivityAt_idx" ON "proposals"("lastActivityAt");

-- CreateIndex
CREATE INDEX "proposals_statsUpdatedAt_idx" ON "proposals"("statsUpdatedAt");

-- CreateIndex
CREATE INDEX "proposals_customerId_idx" ON "proposals"("customerId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_priority_idx" ON "proposals"("priority");

-- CreateIndex
CREATE INDEX "proposals_projectType_idx" ON "proposals"("projectType");

-- CreateIndex
CREATE INDEX "idx_proposals_tenant_customer" ON "proposals"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "idx_proposals_created_at" ON "proposals"("createdAt");

-- CreateIndex
CREATE INDEX "idx_proposals_updated_at" ON "proposals"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_proposals_due_date" ON "proposals"("dueDate");

-- CreateIndex
CREATE INDEX "roles_createdAt_idx" ON "roles"("createdAt");

-- CreateIndex
CREATE INDEX "roles_updatedAt_idx" ON "roles"("updatedAt");

-- CreateIndex
CREATE INDEX "roles_parentId_idx" ON "roles"("parentId");

-- CreateIndex
CREATE INDEX "roles_level_idx" ON "roles"("level");

-- CreateIndex
CREATE INDEX "roles_isSystem_idx" ON "roles"("isSystem");

-- CreateIndex
CREATE INDEX "idx_roles_created_at" ON "roles"("createdAt");

-- CreateIndex
CREATE INDEX "idx_roles_updated_at" ON "roles"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_roles_parent_id" ON "roles"("parentId");

-- CreateIndex
CREATE INDEX "user_roles_assignedBy_idx" ON "user_roles"("assignedBy");

-- CreateIndex
CREATE INDEX "user_roles_assignedAt_idx" ON "user_roles"("assignedAt");

-- CreateIndex
CREATE INDEX "user_roles_expiresAt_idx" ON "user_roles"("expiresAt");

-- CreateIndex
CREATE INDEX "user_roles_isActive_idx" ON "user_roles"("isActive");

-- CreateIndex
CREATE INDEX "idx_user_roles_assigned_by" ON "user_roles"("assignedBy");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_updatedAt_idx" ON "users"("updatedAt");

-- CreateIndex
CREATE INDEX "users_lastLogin_idx" ON "users"("lastLogin");

-- CreateIndex
CREATE INDEX "idx_users_tenant_email" ON "users"("tenantId", "email");

-- CreateIndex
CREATE INDEX "idx_users_created_at" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "idx_users_updated_at" ON "users"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationship_rules" ADD CONSTRAINT "product_relationship_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationship_rules" ADD CONSTRAINT "product_relationship_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationship_rules" ADD CONSTRAINT "product_relationship_rules_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationship_rule_versions" ADD CONSTRAINT "product_relationship_rule_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationship_rule_versions" ADD CONSTRAINT "product_relationship_rule_versions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "product_relationship_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
