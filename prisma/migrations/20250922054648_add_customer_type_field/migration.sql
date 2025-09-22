-- DropIndex
DROP INDEX "Subscription_status_idx";

-- CreateTable
CREATE TABLE "SecurityAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityAuditLog_userId_timestamp_idx" ON "SecurityAuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_resource_action_idx" ON "SecurityAuditLog"("resource", "action");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_success_timestamp_idx" ON "SecurityAuditLog"("success", "timestamp");

-- RenameIndex
ALTER INDEX "idx_proposal_products_proposal_id_section_id" RENAME TO "proposal_products_proposalId_sectionId_idx";
