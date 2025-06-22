-- PosalPro MVP2 - Critical Performance Indexes Migration
-- 🔧 PHASE 2: PERFORMANCE OPTIMIZATION & MONITORING
-- Adding essential indexes for performance optimization

-- User Authentication Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_users_email_status" ON "users" ("email", "status");
CREATE INDEX IF NOT EXISTS "idx_users_department" ON "users" ("department");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_active" ON "user_sessions" ("userId", "isActive");

-- Proposal Management Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_proposals_status_priority" ON "proposals" ("status", "priority");
CREATE INDEX IF NOT EXISTS "idx_proposals_created_by_date" ON "proposals" ("createdBy", "createdAt");

-- Content Search Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_content_type_active" ON "content" ("type", "isActive");
CREATE INDEX IF NOT EXISTS "idx_content_created_at" ON "content" ("createdAt");

-- Product Management Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_products_active_category" ON "products" ("isActive", "category");
CREATE INDEX IF NOT EXISTS "idx_product_relationships_source_type" ON "product_relationships" ("sourceProductId", "type");

-- Customer Management Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_customers_status" ON "customers" ("status");

-- Audit and Security Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_audit_logs_timestamp" ON "audit_logs" ("timestamp");
CREATE INDEX IF NOT EXISTS "idx_security_events_timestamp" ON "security_events" ("timestamp");

-- Analytics Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_user_sessions_created_at" ON "user_sessions" ("createdAt");

-- Comment on migration purpose
COMMENT ON SCHEMA public IS 'PosalPro MVP2 - Phase 2 Performance indexes for query optimization';

-- Update table statistics
ANALYZE "users";
ANALYZE "proposals";
ANALYZE "content";
ANALYZE "products";
ANALYZE "customers";
