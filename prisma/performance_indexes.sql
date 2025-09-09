-- PosalPro MVP2 - Performance Indexes Migration
-- Critical database indexes for admin API optimization
-- Addresses TTFB regression and admin API slowness

-- User table indexes for admin operations
CREATE INDEX IF NOT EXISTS idx_user_status_created_at ON users (status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_user_email_tenant ON users ("tenantId", email);
CREATE INDEX IF NOT EXISTS idx_user_last_login ON users ("lastLogin" DESC) WHERE "lastLogin" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_department ON users (department);

-- UserRole table indexes for role lookups
CREATE INDEX IF NOT EXISTS idx_user_role_user_id ON user_roles ("userId");
CREATE INDEX IF NOT EXISTS idx_user_role_role_id ON user_roles ("roleId");
CREATE INDEX IF NOT EXISTS idx_user_role_composite ON user_roles ("userId", "roleId");

-- Role table indexes
CREATE INDEX IF NOT EXISTS idx_role_name ON roles (name);
CREATE INDEX IF NOT EXISTS idx_role_level ON roles (level);

-- AuditLog table indexes for recent activity queries
CREATE INDEX IF NOT EXISTS idx_audit_log_at_desc ON "AuditLog" ("at" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_model_action ON "AuditLog" (model, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON "AuditLog" ("actorId");

-- Proposal table indexes
CREATE INDEX IF NOT EXISTS idx_proposal_status_created ON proposals (status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_due_date ON proposals ("dueDate") WHERE "dueDate" IS NOT NULL;

-- Product table indexes
CREATE INDEX IF NOT EXISTS idx_product_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_product_status ON products (status);

-- Session table indexes for RBAC optimization
CREATE INDEX IF NOT EXISTS idx_session_user_id ON user_sessions ("userId");
CREATE INDEX IF NOT EXISTS idx_session_expires ON user_sessions (expires);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_user_status_dept_created ON users (status, department, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_recent ON "AuditLog" ("at" DESC, model, action) WHERE "at" > NOW() - INTERVAL '30 days';

-- Permission indexes for RBAC
CREATE INDEX IF NOT EXISTS idx_permission_resource_action ON permissions (resource, action);
CREATE INDEX IF NOT EXISTS idx_user_permission_user_id ON user_permissions ("userId");

-- Content table indexes
CREATE INDEX IF NOT EXISTS idx_content_type_status ON content (type, status);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content ("createdAt" DESC);

-- Performance monitoring indexes
CREATE INDEX IF NOT EXISTS idx_proposal_value ON proposals (value) WHERE value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposal_total ON proposals (total);

-- Cleanup old indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_user_roles_user_id;
DROP INDEX IF EXISTS idx_user_roles_role_id;
