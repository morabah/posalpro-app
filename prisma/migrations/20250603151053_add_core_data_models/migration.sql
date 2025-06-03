-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED');

-- CreateEnum
CREATE TYPE "CustomerTier" AS ENUM ('STANDARD', 'PREMIUM', 'ENTERPRISE', 'VIP');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUBMITTED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('TEXT', 'PRODUCTS', 'TERMS', 'PRICING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('VALID', 'INVALID', 'WARNING', 'NOT_VALIDATED');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('REQUIRES', 'RECOMMENDS', 'INCOMPATIBLE', 'ALTERNATIVE', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'TEMPLATE', 'IMAGE', 'DOCUMENT', 'MEDIA');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('VIEW', 'EDIT', 'USE', 'DOWNLOAD');

-- CreateEnum
CREATE TYPE "ValidationRuleType" AS ENUM ('COMPATIBILITY', 'LICENSE', 'CONFIGURATION', 'COMPLIANCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "ResolutionMethod" AS ENUM ('AUTO', 'MANUAL', 'SUGGESTION');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('APPROVE', 'REJECT', 'DELEGATE', 'REQUEST_CHANGES');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PROPOSAL', 'CUSTOMER', 'PRODUCT', 'USER', 'ROLE', 'CONTENT', 'VALIDATION_RULE', 'APPROVAL_WORKFLOW', 'PROPOSAL_SECTION', 'PROPOSAL_PRODUCT', 'PRODUCT_RELATIONSHIP');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "revenue" DOUBLE PRECISION,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "tier" "CustomerTier" NOT NULL DEFAULT 'STANDARD',
    "tags" TEXT[],
    "metadata" JSONB,
    "segmentation" JSONB,
    "riskScore" DOUBLE PRECISION,
    "ltv" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastContact" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT,
    "department" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "customerId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "performanceData" JSONB,
    "userStoryTracking" JSONB,
    "riskScore" DOUBLE PRECISION,
    "tags" TEXT[],
    "metadata" JSONB,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_sections" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "SectionType" NOT NULL DEFAULT 'TEXT',
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'NOT_VALIDATED',
    "analyticsData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_products" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "configuration" JSONB,
    "selectionAnalytics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT[],
    "tags" TEXT[],
    "attributes" JSONB,
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "usageAnalytics" JSONB,
    "userStoryMappings" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_relationships" (
    "id" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "targetProductId" TEXT NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "quantity" INTEGER,
    "condition" JSONB,
    "validationHistory" JSONB,
    "performanceImpact" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ContentType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "category" TEXT[],
    "searchableText" TEXT,
    "keywords" TEXT[],
    "quality" JSONB,
    "usage" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" TEXT[],
    "searchOptimization" JSONB,
    "userStoryTracking" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_access_logs" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessType" "AccessType" NOT NULL,
    "userStory" TEXT,
    "performanceImpact" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "ruleType" "ValidationRuleType" NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'WARNING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "productId" TEXT,
    "executionStats" JSONB,
    "userStoryMappings" TEXT[],
    "hypothesesSupported" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_issues" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "ruleId" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "message" TEXT NOT NULL,
    "fixSuggestion" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "proposalId" TEXT,
    "proposalProductId" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionMethod" "ResolutionMethod",
    "performanceMetrics" JSONB,
    "userStoryContext" TEXT[],

    CONSTRAINT "validation_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_executions" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "rulesExecuted" TEXT[],
    "executionTime" INTEGER NOT NULL,
    "issuesFound" INTEGER NOT NULL,
    "issuesResolved" INTEGER NOT NULL,
    "performanceScore" DOUBLE PRECISION,
    "triggeredBy" TEXT NOT NULL,
    "userStoryContext" TEXT[],
    "hypothesesValidated" TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "EntityType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "executionStats" JSONB,
    "performanceMetrics" JSONB,
    "userStoryMappings" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "approvers" TEXT[],
    "conditions" JSONB,
    "actions" JSONB,
    "slaHours" INTEGER,
    "isParallel" BOOLEAN NOT NULL DEFAULT false,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "escalationRules" JSONB,
    "performanceTracking" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_executions" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "currentStage" TEXT,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "slaCompliance" BOOLEAN,
    "proposalId" TEXT,
    "performanceMetrics" JSONB,
    "userStoryContext" TEXT[],

    CONSTRAINT "approval_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_decisions" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" "DecisionType" NOT NULL,
    "comments" TEXT,
    "timeToDecision" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "performanceImpact" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProposalAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "customers_status_tier_idx" ON "customers"("status", "tier");

-- CreateIndex
CREATE INDEX "customers_industry_idx" ON "customers"("industry");

-- CreateIndex
CREATE INDEX "customer_contacts_customerId_isPrimary_idx" ON "customer_contacts"("customerId", "isPrimary");

-- CreateIndex
CREATE INDEX "proposals_status_dueDate_idx" ON "proposals"("status", "dueDate");

-- CreateIndex
CREATE INDEX "proposals_customerId_status_idx" ON "proposals"("customerId", "status");

-- CreateIndex
CREATE INDEX "proposals_createdBy_idx" ON "proposals"("createdBy");

-- CreateIndex
CREATE INDEX "proposal_sections_proposalId_order_idx" ON "proposal_sections"("proposalId", "order");

-- CreateIndex
CREATE INDEX "proposal_products_proposalId_idx" ON "proposal_products"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_products_productId_idx" ON "proposal_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_isActive_category_idx" ON "products"("isActive", "category");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "product_relationships_sourceProductId_idx" ON "product_relationships"("sourceProductId");

-- CreateIndex
CREATE INDEX "product_relationships_targetProductId_idx" ON "product_relationships"("targetProductId");

-- CreateIndex
CREATE INDEX "product_relationships_type_idx" ON "product_relationships"("type");

-- CreateIndex
CREATE INDEX "content_type_isActive_idx" ON "content"("type", "isActive");

-- CreateIndex
CREATE INDEX "content_tags_idx" ON "content"("tags");

-- CreateIndex
CREATE INDEX "content_category_idx" ON "content"("category");

-- CreateIndex
CREATE INDEX "content_access_logs_contentId_timestamp_idx" ON "content_access_logs"("contentId", "timestamp");

-- CreateIndex
CREATE INDEX "content_access_logs_userId_accessType_idx" ON "content_access_logs"("userId", "accessType");

-- CreateIndex
CREATE INDEX "validation_rules_category_isActive_idx" ON "validation_rules"("category", "isActive");

-- CreateIndex
CREATE INDEX "validation_rules_ruleType_idx" ON "validation_rules"("ruleType");

-- CreateIndex
CREATE INDEX "validation_issues_entityType_status_idx" ON "validation_issues"("entityType", "status");

-- CreateIndex
CREATE INDEX "validation_issues_ruleId_status_idx" ON "validation_issues"("ruleId", "status");

-- CreateIndex
CREATE INDEX "validation_issues_severity_detectedAt_idx" ON "validation_issues"("severity", "detectedAt");

-- CreateIndex
CREATE INDEX "validation_executions_entityType_timestamp_idx" ON "validation_executions"("entityType", "timestamp");

-- CreateIndex
CREATE INDEX "validation_executions_triggeredBy_idx" ON "validation_executions"("triggeredBy");

-- CreateIndex
CREATE INDEX "approval_workflows_entityType_isActive_idx" ON "approval_workflows"("entityType", "isActive");

-- CreateIndex
CREATE INDEX "workflow_stages_workflowId_order_idx" ON "workflow_stages"("workflowId", "order");

-- CreateIndex
CREATE INDEX "approval_executions_workflowId_status_idx" ON "approval_executions"("workflowId", "status");

-- CreateIndex
CREATE INDEX "approval_executions_proposalId_idx" ON "approval_executions"("proposalId");

-- CreateIndex
CREATE INDEX "approval_decisions_executionId_idx" ON "approval_decisions"("executionId");

-- CreateIndex
CREATE INDEX "approval_decisions_approverId_idx" ON "approval_decisions"("approverId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProposalAssignees_AB_unique" ON "_ProposalAssignees"("A", "B");

-- CreateIndex
CREATE INDEX "_ProposalAssignees_B_index" ON "_ProposalAssignees"("B");

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_sections" ADD CONSTRAINT "proposal_sections_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_products" ADD CONSTRAINT "proposal_products_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_products" ADD CONSTRAINT "proposal_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationships" ADD CONSTRAINT "product_relationships_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationships" ADD CONSTRAINT "product_relationships_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationships" ADD CONSTRAINT "product_relationships_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_access_logs" ADD CONSTRAINT "content_access_logs_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_access_logs" ADD CONSTRAINT "content_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_rules" ADD CONSTRAINT "validation_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_rules" ADD CONSTRAINT "validation_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "validation_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_proposalProductId_fkey" FOREIGN KEY ("proposalProductId") REFERENCES "proposal_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_executions" ADD CONSTRAINT "validation_executions_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "approval_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_executions" ADD CONSTRAINT "approval_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "approval_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_executions" ADD CONSTRAINT "approval_executions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_executions" ADD CONSTRAINT "approval_executions_currentStage_fkey" FOREIGN KEY ("currentStage") REFERENCES "workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "approval_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProposalAssignees" ADD CONSTRAINT "_ProposalAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProposalAssignees" ADD CONSTRAINT "_ProposalAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
