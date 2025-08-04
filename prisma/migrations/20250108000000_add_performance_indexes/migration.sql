-- CreateEnum
-- No enums to create

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_users_last_login" ON "users"("lastLogin");

-- CreateIndex
CREATE INDEX "idx_proposals_created_at" ON "proposals"("createdAt");

-- CreateIndex
CREATE INDEX "idx_proposals_status" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "idx_proposals_customer_id" ON "proposals"("customerId");

-- CreateIndex
CREATE INDEX "idx_proposals_created_by" ON "proposals"("createdBy");

-- CreateIndex
CREATE INDEX "idx_proposals_due_date" ON "proposals"("dueDate");

-- CreateIndex
CREATE INDEX "idx_customers_name" ON "customers"("name");

-- CreateIndex
CREATE INDEX "idx_customers_email" ON "customers"("email");

-- CreateIndex
CREATE INDEX "idx_customers_tier" ON "customers"("tier");

-- CreateIndex
CREATE INDEX "idx_customers_status" ON "customers"("status");

-- CreateIndex
CREATE INDEX "idx_customers_updated_at" ON "customers"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_products_name" ON "products"("name");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category");

-- CreateIndex
CREATE INDEX "idx_products_status" ON "products"("status");

-- CreateIndex
CREATE INDEX "idx_user_roles_user_id" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "idx_user_roles_role_id" ON "user_roles"("roleId");

-- CreateIndex
CREATE INDEX "idx_user_roles_active" ON "user_roles"("isActive");

-- CreateIndex
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_content_type" ON "content"("type");

-- CreateIndex
CREATE INDEX "idx_content_status" ON "content"("status");

-- CreateIndex
CREATE INDEX "idx_content_created_at" ON "content"("createdAt");

-- CreateIndex
CREATE INDEX "idx_proposals_status_created_at" ON "proposals"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_customers_tier_status" ON "customers"("tier", "status");

-- CreateIndex
CREATE INDEX "idx_users_status_department" ON "users"("status", "department");
