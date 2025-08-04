-- PosalPro MVP2 - Performance Indexes
-- Comprehensive database optimization for improved API performance
-- Based on actual Prisma schema column names

-- User indexes for authentication performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users("lastLogin" DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users("createdAt" DESC);

-- Role indexes for authorization performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles("isSystem");

-- User Role indexes for role management performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON "user_roles"("userId");
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON "user_roles"("roleId");
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON "user_roles"("isActive");
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_at ON "user_roles"("assignedAt" DESC);

-- Permission indexes for authorization performance
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_scope ON permissions(scope);

-- Role Permission indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON "role_permissions"("roleId");
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON "role_permissions"("permissionId");

-- User Permission indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON "user_permissions"("userId");
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON "user_permissions"("permissionId");

-- Customer indexes for customer management performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers("updatedAt" DESC);

-- Customer Contact indexes
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON "customer_contacts"("customerId");
CREATE INDEX IF NOT EXISTS idx_customer_contacts_email ON "customer_contacts"(email);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_phone ON "customer_contacts"(phone);

-- Proposal indexes for proposal management performance
CREATE INDEX IF NOT EXISTS idx_proposals_title ON proposals(title);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_priority ON proposals(priority);
CREATE INDEX IF NOT EXISTS idx_proposals_customer_id ON proposals("customerId");
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals("createdBy");
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_updated_at ON proposals("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_due_date ON proposals("dueDate");

-- Proposal Section indexes
CREATE INDEX IF NOT EXISTS idx_proposal_sections_proposal_id ON "proposal_sections"("proposalId");
CREATE INDEX IF NOT EXISTS idx_proposal_sections_type ON "proposal_sections"(type);
CREATE INDEX IF NOT EXISTS idx_proposal_sections_order ON "proposal_sections"("proposalId", "order");

-- Proposal Product indexes
CREATE INDEX IF NOT EXISTS idx_proposal_products_proposal_id ON "proposal_products"("proposalId");
CREATE INDEX IF NOT EXISTS idx_proposal_products_product_id ON "proposal_products"("productId");

-- Product indexes for product management performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products("updatedAt" DESC);

-- Product Relationship indexes
CREATE INDEX IF NOT EXISTS idx_product_relationships_source_id ON "product_relationships"("sourceProductId");
CREATE INDEX IF NOT EXISTS idx_product_relationships_target_id ON "product_relationships"("targetProductId");
CREATE INDEX IF NOT EXISTS idx_product_relationships_type ON "product_relationships"(type);

-- Content indexes for content management performance
CREATE INDEX IF NOT EXISTS idx_content_title ON content(title);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_created_by ON content("createdBy");
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_content_updated_at ON content("updatedAt" DESC);

-- Content Access Log indexes
CREATE INDEX IF NOT EXISTS idx_content_access_logs_content_id ON "content_access_logs"("contentId");
CREATE INDEX IF NOT EXISTS idx_content_access_logs_user_id ON "content_access_logs"("userId");
CREATE INDEX IF NOT EXISTS idx_content_access_logs_access_type ON "content_access_logs"("accessType");
CREATE INDEX IF NOT EXISTS idx_content_access_logs_timestamp ON "content_access_logs"(timestamp DESC);

-- Validation Rule indexes
CREATE INDEX IF NOT EXISTS idx_validation_rules_name ON "validation_rules"(name);
CREATE INDEX IF NOT EXISTS idx_validation_rules_type ON "validation_rules"(type);
CREATE INDEX IF NOT EXISTS idx_validation_rules_severity ON "validation_rules"(severity);
CREATE INDEX IF NOT EXISTS idx_validation_rules_created_by ON "validation_rules"("createdBy");

-- Validation Issue indexes
CREATE INDEX IF NOT EXISTS idx_validation_issues_rule_id ON "validation_issues"("ruleId");
CREATE INDEX IF NOT EXISTS idx_validation_issues_status ON "validation_issues"(status);
CREATE INDEX IF NOT EXISTS idx_validation_issues_severity ON "validation_issues"(severity);
CREATE INDEX IF NOT EXISTS idx_validation_issues_created_at ON "validation_issues"("createdAt" DESC);

-- Validation Execution indexes
CREATE INDEX IF NOT EXISTS idx_validation_executions_rule_id ON "validation_executions"("ruleId");
CREATE INDEX IF NOT EXISTS idx_validation_executions_executed_by ON "validation_executions"("executedBy");
CREATE INDEX IF NOT EXISTS idx_validation_executions_status ON "validation_executions"(status);
CREATE INDEX IF NOT EXISTS idx_validation_executions_executed_at ON "validation_executions"("executedAt" DESC);

-- Approval Workflow indexes
CREATE INDEX IF NOT EXISTS idx_approval_workflows_name ON "approval_workflows"(name);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON "approval_workflows"(status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_created_by ON "approval_workflows"("createdBy");
CREATE INDEX IF NOT EXISTS idx_approval_workflows_created_at ON "approval_workflows"("createdAt" DESC);

-- Workflow Stage indexes
CREATE INDEX IF NOT EXISTS idx_workflow_stages_workflow_id ON "workflow_stages"("workflowId");
CREATE INDEX IF NOT EXISTS idx_workflow_stages_order ON "workflow_stages"("workflowId", "order");
CREATE INDEX IF NOT EXISTS idx_workflow_stages_status ON "workflow_stages"(status);

-- Approval Execution indexes
CREATE INDEX IF NOT EXISTS idx_approval_executions_workflow_id ON "approval_executions"("workflowId");
CREATE INDEX IF NOT EXISTS idx_approval_executions_stage_id ON "approval_executions"("stageId");
CREATE INDEX IF NOT EXISTS idx_approval_executions_status ON "approval_executions"(status);
CREATE INDEX IF NOT EXISTS idx_approval_executions_started_at ON "approval_executions"("startedAt" DESC);

-- Approval Decision indexes
CREATE INDEX IF NOT EXISTS idx_approval_decisions_execution_id ON "approval_decisions"("executionId");
CREATE INDEX IF NOT EXISTS idx_approval_decisions_decided_by ON "approval_decisions"("decidedBy");
CREATE INDEX IF NOT EXISTS idx_approval_decisions_type ON "approval_decisions"(type);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_decided_at ON "approval_decisions"("decidedAt" DESC);

-- Audit Log indexes for system monitoring performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON "audit_logs"(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON "audit_logs"(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON "audit_logs"(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON "audit_logs"(category);

-- Security Event indexes
CREATE INDEX IF NOT EXISTS idx_security_events_type ON "security_events"("eventType");
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON "security_events"("userId");
CREATE INDEX IF NOT EXISTS idx_security_events_status ON "security_events"(status);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON "security_events"("createdAt" DESC);

-- Security Response indexes
CREATE INDEX IF NOT EXISTS idx_security_responses_event_id ON "security_responses"("eventId");
CREATE INDEX IF NOT EXISTS idx_security_responses_type ON "security_responses"("responseType");
CREATE INDEX IF NOT EXISTS idx_security_responses_status ON "security_responses"(status);
CREATE INDEX IF NOT EXISTS idx_security_responses_created_at ON "security_responses"("createdAt" DESC);

-- Notification Delivery indexes
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_id ON "notification_deliveries"("userId");
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_channel ON "notification_deliveries"(channel);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON "notification_deliveries"(status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_created_at ON "notification_deliveries"("createdAt" DESC);

-- Hypothesis Validation Event indexes
CREATE INDEX IF NOT EXISTS idx_hypothesis_events_hypothesis_id ON "hypothesis_validation_events"("hypothesisId");
CREATE INDEX IF NOT EXISTS idx_hypothesis_events_type ON "hypothesis_validation_events"("eventType");
CREATE INDEX IF NOT EXISTS idx_hypothesis_events_user_id ON "hypothesis_validation_events"("userId");
CREATE INDEX IF NOT EXISTS idx_hypothesis_events_timestamp ON "hypothesis_validation_events"(timestamp DESC);

-- User Analytics Profile indexes
CREATE INDEX IF NOT EXISTS idx_user_analytics_profiles_user_id ON "user_analytics_profiles"("userId");
CREATE INDEX IF NOT EXISTS idx_user_analytics_profiles_created_at ON "user_analytics_profiles"("createdAt" DESC);

-- Performance Trend indexes
CREATE INDEX IF NOT EXISTS idx_performance_trends_metric ON "performance_trends"(metric);
CREATE INDEX IF NOT EXISTS idx_performance_trends_direction ON "performance_trends"(direction);
CREATE INDEX IF NOT EXISTS idx_performance_trends_created_at ON "performance_trends"("createdAt" DESC);

-- User Session indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON "user_sessions"("userId");
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON "user_sessions"(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON "user_sessions"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON "user_sessions"("expiresAt");

-- Temporary Access indexes
CREATE INDEX IF NOT EXISTS idx_temporary_access_user_id ON "temporary_access"("userId");
CREATE INDEX IF NOT EXISTS idx_temporary_access_status ON "temporary_access"(status);
CREATE INDEX IF NOT EXISTS idx_temporary_access_expires_at ON "temporary_access"("expiresAt");

-- Component Traceability indexes
CREATE INDEX IF NOT EXISTS idx_component_traceability_component_id ON "component_traceability"("componentId");
CREATE INDEX IF NOT EXISTS idx_component_traceability_user_story ON "component_traceability"("userStory");
CREATE INDEX IF NOT EXISTS idx_component_traceability_created_at ON "component_traceability"("createdAt" DESC);

-- Test Case indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_name ON "test_cases"(name);
CREATE INDEX IF NOT EXISTS idx_test_cases_type ON "test_cases"(type);
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON "test_cases"(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_created_at ON "test_cases"("createdAt" DESC);

-- Test Execution Result indexes
CREATE INDEX IF NOT EXISTS idx_test_execution_results_test_id ON "test_execution_results"("testId");
CREATE INDEX IF NOT EXISTS idx_test_execution_results_status ON "test_execution_results"(status);
CREATE INDEX IF NOT EXISTS idx_test_execution_results_executed_at ON "test_execution_results"("executedAt" DESC);

-- Baseline Metrics indexes
CREATE INDEX IF NOT EXISTS idx_baseline_metrics_metric ON "baseline_metrics"(metric);
CREATE INDEX IF NOT EXISTS idx_baseline_metrics_created_at ON "baseline_metrics"("createdAt" DESC);

-- User Story Metrics indexes
CREATE INDEX IF NOT EXISTS idx_user_story_metrics_user_story ON "user_story_metrics"("userStory");
CREATE INDEX IF NOT EXISTS idx_user_story_metrics_created_at ON "user_story_metrics"("createdAt" DESC);

-- Performance Baseline indexes
CREATE INDEX IF NOT EXISTS idx_performance_baselines_name ON "performance_baselines"(name);
CREATE INDEX IF NOT EXISTS idx_performance_baselines_created_at ON "performance_baselines"("createdAt" DESC);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_proposals_complex ON proposals(status, "createdAt" DESC, priority);
CREATE INDEX IF NOT EXISTS idx_customers_complex ON customers(status, "createdAt" DESC, tier);
CREATE INDEX IF NOT EXISTS idx_users_complex ON users(status, department, "lastLogin" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_complex ON "audit_logs"(timestamp DESC, "userId", action);

-- Full-text search indexes for search performance
CREATE INDEX IF NOT EXISTS idx_proposals_search ON proposals USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_content_search ON content USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Performance monitoring
-- These indexes will significantly improve query performance for:
-- 1. Authentication and session management
-- 2. Proposal listing and filtering
-- 3. Customer management
-- 4. Product catalog operations
-- 5. Workflow management
-- 6. Analytics and reporting
-- 7. Search functionality
-- 8. Audit and security monitoring
