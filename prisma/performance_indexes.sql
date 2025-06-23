-- PosalPro MVP2 Performance Indexes
-- Database Optimization for H8, H11, H12 Hypothesis Validation
-- Applied: 2025-01-09

-- =====================================
-- CONTENT SEARCH OPTIMIZATION (H11)
-- =====================================

-- Content title, type, and active status composite index
CREATE INDEX IF NOT EXISTS content_title_type_active_performance_idx
ON "Content" (title, type, "isActive");

-- GIN indexes for array-based searches
CREATE INDEX IF NOT EXISTS content_keywords_gin_performance_idx
ON "Content" USING GIN (keywords);

CREATE INDEX IF NOT EXISTS content_tags_gin_performance_idx
ON "Content" USING GIN (tags);

-- =====================================
-- PROPOSAL MANAGEMENT OPTIMIZATION (H8)
-- =====================================

-- Proposal status, priority, and creation composite index
CREATE INDEX IF NOT EXISTS proposal_status_priority_created_performance_idx
ON "Proposal" (status, priority, "createdBy", "createdAt");

-- Proposal title, status, and due date for dashboard queries
CREATE INDEX IF NOT EXISTS proposal_title_status_due_performance_idx
ON "Proposal" (title, status, "dueDate");

-- =====================================
-- PRODUCT SEARCH OPTIMIZATION (H11)
-- =====================================

-- Product active status and price for filtering
CREATE INDEX IF NOT EXISTS product_active_price_performance_idx
ON "Product" ("isActive", price);

-- Product name, active status, and creation date
CREATE INDEX IF NOT EXISTS product_name_active_created_performance_idx
ON "Product" (name, "isActive", "createdAt");

-- Product tags and category GIN indexes
CREATE INDEX IF NOT EXISTS product_tags_gin_performance_idx
ON "Product" USING GIN (tags);

CREATE INDEX IF NOT EXISTS product_category_gin_performance_idx
ON "Product" USING GIN (category);

-- =====================================
-- CUSTOMER MANAGEMENT OPTIMIZATION
-- =====================================

-- Customer status, industry, and creation date
CREATE INDEX IF NOT EXISTS customer_status_industry_created_performance_idx
ON "Customer" (status, industry, "createdAt");

-- Customer name and email for search
CREATE INDEX IF NOT EXISTS customer_name_email_performance_idx
ON "Customer" (name, email);

-- =====================================
-- ANALYTICS OPTIMIZATION (H12)
-- =====================================

-- Hypothesis validation events
CREATE INDEX IF NOT EXISTS hypothesis_validation_hypothesis_user_time_performance_idx
ON "HypothesisValidationEvent" (hypothesis, "userId", timestamp);

-- User story metrics
CREATE INDEX IF NOT EXISTS user_story_metrics_story_completion_updated_performance_idx
ON "UserStoryMetrics" ("userStoryId", "completionRate", "lastUpdated");

-- Performance baselines
CREATE INDEX IF NOT EXISTS performance_baselines_hypothesis_metric_date_performance_idx
ON "PerformanceBaseline" (hypothesis, "metricName", "collectionDate");

-- =====================================
-- RBAC & SECURITY OPTIMIZATION
-- =====================================

-- User roles for RBAC queries
CREATE INDEX IF NOT EXISTS user_roles_user_role_active_performance_idx
ON "UserRole" ("userId", "roleId", "isActive");

-- User sessions for authentication
CREATE INDEX IF NOT EXISTS user_sessions_token_active_expires_performance_idx
ON "UserSession" ("sessionToken", "isActive", "expiresAt");

-- Audit logs for security monitoring
CREATE INDEX IF NOT EXISTS audit_logs_user_timestamp_action_performance_idx
ON "AuditLog" ("userId", timestamp, action);

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- Verify index creation
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE '%_performance_%'
ORDER BY tablename, indexname;
