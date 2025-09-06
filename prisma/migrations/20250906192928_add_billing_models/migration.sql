-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('ALL', 'TEAM', 'OWN');

-- CreateEnum
CREATE TYPE "ContextOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN');

-- CreateEnum
CREATE TYPE "ContextEffect" AS ENUM ('GRANT', 'DENY');

-- CreateEnum
CREATE TYPE "TemporaryAccessStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('IMPROVING', 'DECLINING', 'STABLE');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('DATA', 'ACCESS', 'CONFIGURATION', 'SECURITY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('LOGIN_ATTEMPT', 'PERMISSION_DENIED', 'DATA_ACCESS', 'CONFIG_CHANGE', 'SUSPICIOUS_ACTIVITY');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SecurityEventStatus" AS ENUM ('DETECTED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "NotificationRecipientType" AS ENUM ('USER', 'ROLE', 'GROUP', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'READ');

-- CreateEnum
CREATE TYPE "AccessibilityLevel" AS ENUM ('AA', 'AAA');

-- CreateEnum
CREATE TYPE "AccessibilityTestType" AS ENUM ('AUTOMATED', 'MANUAL', 'USER_TESTING');

-- CreateEnum
CREATE TYPE "AccessibilityStandard" AS ENUM ('WCAG_2_1_AA', 'WCAG_2_1_AAA', 'SECTION_508', 'EN_301_549');

-- CreateEnum
CREATE TYPE "HypothesisType" AS ENUM ('H1', 'H3', 'H4', 'H6', 'H7', 'H8');

-- CreateEnum
CREATE TYPE "ValidationStatusType" AS ENUM ('PENDING', 'VALID', 'INVALID', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "TestStatusType" AS ENUM ('DRAFT', 'ACTIVE', 'EXECUTED', 'PASSED', 'FAILED', 'DEPRECATED');

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
CREATE TYPE "RuleStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "RuleKind" AS ENUM ('REQUIRES', 'EXCLUDES', 'RECOMMENDS', 'AUTO_ADD', 'CHOOSE_ONE_OF', 'COMPAT_BY_ATTR', 'REPLACED_BY', 'CAPACITY_LINK', 'LICENSE_FOR', 'CONDITION');

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
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "department" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,
    "performanceExpectations" JSONB,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" "PermissionScope" NOT NULL DEFAULT 'ALL',
    "constraints" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "context_rules" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "operator" "ContextOperator" NOT NULL,
    "value" JSONB NOT NULL,
    "effect" "ContextEffect" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "context_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "TemporaryAccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "temporary_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'en',
    "analyticsConsent" BOOLEAN NOT NULL DEFAULT false,
    "performanceTracking" BOOLEAN NOT NULL DEFAULT false,
    "dashboardLayout" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_analytics_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performanceMetrics" JSONB NOT NULL,
    "hypothesisContributions" JSONB NOT NULL,
    "skillAssessments" JSONB NOT NULL,
    "efficiencyRatings" JSONB NOT NULL,
    "lastAssessment" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_analytics_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_trends" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "trend" "TrendDirection" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "features" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "seats" INTEGER NOT NULL DEFAULT 5,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "SecurityEventType" NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "status" "SecurityEventStatus" NOT NULL DEFAULT 'DETECTED',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_responses" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "channels" JSONB NOT NULL,
    "frequency" JSONB NOT NULL,
    "categories" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" "NotificationRecipientType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessibility_configurations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "complianceLevel" "AccessibilityLevel" NOT NULL DEFAULT 'AA',
    "preferences" JSONB NOT NULL,
    "assistiveTechnology" JSONB NOT NULL,
    "customizations" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accessibility_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessibility_test_results" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "testType" "AccessibilityTestType" NOT NULL,
    "standard" "AccessibilityStandard" NOT NULL,
    "component" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "violations" JSONB NOT NULL,
    "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testedBy" TEXT NOT NULL,
    "environment" TEXT NOT NULL,

    CONSTRAINT "accessibility_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hypothesis_validation_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hypothesis" "HypothesisType" NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "measurementData" JSONB NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "performanceImprovement" DOUBLE PRECISION NOT NULL,
    "userRole" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "testCaseId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hypothesis_validation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_story_metrics" (
    "id" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "hypothesis" TEXT[],
    "acceptanceCriteria" TEXT[],
    "performanceTargets" JSONB NOT NULL,
    "actualPerformance" JSONB NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passedCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failedCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "baselineMetrics" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_story_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_baselines" (
    "id" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "baselineValue" DOUBLE PRECISION NOT NULL,
    "targetImprovement" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION,
    "improvementPercentage" DOUBLE PRECISION,
    "measurementUnit" TEXT NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "sampleSize" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "methodology" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_traceability" (
    "id" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "userStories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "acceptanceCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "methods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hypotheses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "testCases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "analyticsHooks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastValidated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validationStatus" "ValidationStatusType" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_traceability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "userStory" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "preconditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "testSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "acceptanceCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "measurementPoints" JSONB NOT NULL,
    "successThresholds" JSONB NOT NULL,
    "instrumentationRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "TestStatusType" NOT NULL DEFAULT 'DRAFT',
    "lastExecuted" TIMESTAMP(3),
    "passRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "componentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_execution_results" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "passed" BOOLEAN,
    "executionTime" INTEGER NOT NULL,
    "metrics" JSONB,
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "environment" TEXT NOT NULL DEFAULT 'development',
    "executedBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_execution_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baseline_metrics" (
    "id" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "sampleSize" INTEGER NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "methodology" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baseline_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "revenue" DECIMAL(65,30),
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "tier" "CustomerTier" NOT NULL DEFAULT 'STANDARD',
    "tags" TEXT[],
    "metadata" JSONB,
    "segmentation" JSONB,
    "riskScore" DECIMAL(65,30),
    "ltv" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastContact" TIMESTAMP(3),
    "cloudId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT DEFAULT 'PENDING',

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
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "customerId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "value" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "performanceData" JSONB,
    "userStoryTracking" JSONB,
    "riskScore" DECIMAL(65,30),
    "tags" TEXT[],
    "metadata" JSONB,
    "cloudId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT DEFAULT 'PENDING',
    "projectType" TEXT,
    "approvalCount" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creatorEmail" TEXT,
    "creatorName" TEXT,
    "customerName" TEXT,
    "customerTier" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "sectionCount" INTEGER NOT NULL DEFAULT 0,
    "statsUpdatedAt" TIMESTAMP(3),
    "totalValue" DECIMAL(65,30),

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
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
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "configuration" JSONB,
    "selectionAnalytics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT[],
    "tags" TEXT[],
    "attributes" JSONB,
    "images" TEXT[],
    "stockQuantity" INTEGER DEFAULT 0,
    "status" TEXT DEFAULT 'ACTIVE',
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
    "cloudId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT DEFAULT 'PENDING',

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

-- CreateTable
CREATE TABLE "_ProposalAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
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
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_department_idx" ON "users"("department");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

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
CREATE INDEX "idx_users_department" ON "users"("department");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_users_created_at" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "idx_users_updated_at" ON "users"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

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
CREATE UNIQUE INDEX "permissions_resource_action_scope_key" ON "permissions"("resource", "action", "scope");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE INDEX "user_roles_assignedBy_idx" ON "user_roles"("assignedBy");

-- CreateIndex
CREATE INDEX "user_roles_assignedAt_idx" ON "user_roles"("assignedAt");

-- CreateIndex
CREATE INDEX "user_roles_expiresAt_idx" ON "user_roles"("expiresAt");

-- CreateIndex
CREATE INDEX "user_roles_isActive_idx" ON "user_roles"("isActive");

-- CreateIndex
CREATE INDEX "idx_user_roles_user_id" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "idx_user_roles_role_id" ON "user_roles"("roleId");

-- CreateIndex
CREATE INDEX "idx_user_roles_assigned_by" ON "user_roles"("assignedBy");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_analytics_profiles_userId_key" ON "user_analytics_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "user_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON "user_sessions"("refreshToken");

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
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Entitlement_tenantId_idx" ON "Entitlement"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_tenantId_key_key" ON "Entitlement"("tenantId", "key");

-- CreateIndex
CREATE INDEX "security_events_timestamp_riskLevel_idx" ON "security_events"("timestamp", "riskLevel");

-- CreateIndex
CREATE INDEX "security_events_type_status_idx" ON "security_events"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "communication_preferences_userId_key" ON "communication_preferences"("userId");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_sentAt_idx" ON "notification_deliveries"("status", "sentAt");

-- CreateIndex
CREATE INDEX "notification_deliveries_recipientId_readAt_idx" ON "notification_deliveries"("recipientId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "accessibility_configurations_userId_key" ON "accessibility_configurations"("userId");

-- CreateIndex
CREATE INDEX "hypothesis_validation_events_hypothesis_timestamp_idx" ON "hypothesis_validation_events"("hypothesis", "timestamp");

-- CreateIndex
CREATE INDEX "hypothesis_validation_events_userId_hypothesis_idx" ON "hypothesis_validation_events"("userId", "hypothesis");

-- CreateIndex
CREATE UNIQUE INDEX "user_story_metrics_userStoryId_key" ON "user_story_metrics"("userStoryId");

-- CreateIndex
CREATE INDEX "user_story_metrics_userStoryId_idx" ON "user_story_metrics"("userStoryId");

-- CreateIndex
CREATE INDEX "user_story_metrics_completionRate_idx" ON "user_story_metrics"("completionRate");

-- CreateIndex
CREATE INDEX "performance_baselines_hypothesis_metricName_idx" ON "performance_baselines"("hypothesis", "metricName");

-- CreateIndex
CREATE INDEX "performance_baselines_collectionDate_idx" ON "performance_baselines"("collectionDate");

-- CreateIndex
CREATE UNIQUE INDEX "performance_baselines_hypothesis_metricName_collectionDate_key" ON "performance_baselines"("hypothesis", "metricName", "collectionDate");

-- CreateIndex
CREATE UNIQUE INDEX "component_traceability_componentName_key" ON "component_traceability"("componentName");

-- CreateIndex
CREATE INDEX "component_traceability_componentName_idx" ON "component_traceability"("componentName");

-- CreateIndex
CREATE INDEX "component_traceability_validationStatus_idx" ON "component_traceability"("validationStatus");

-- CreateIndex
CREATE INDEX "component_traceability_userStories_idx" ON "component_traceability"("userStories");

-- CreateIndex
CREATE INDEX "test_cases_userStory_idx" ON "test_cases"("userStory");

-- CreateIndex
CREATE INDEX "test_cases_hypothesis_idx" ON "test_cases"("hypothesis");

-- CreateIndex
CREATE INDEX "test_cases_status_idx" ON "test_cases"("status");

-- CreateIndex
CREATE INDEX "idx_test_cases_status" ON "test_cases"("status");

-- CreateIndex
CREATE INDEX "test_execution_results_testCaseId_idx" ON "test_execution_results"("testCaseId");

-- CreateIndex
CREATE INDEX "test_execution_results_userStoryId_idx" ON "test_execution_results"("userStoryId");

-- CreateIndex
CREATE INDEX "test_execution_results_hypothesis_timestamp_idx" ON "test_execution_results"("hypothesis", "timestamp");

-- CreateIndex
CREATE INDEX "test_execution_results_passed_timestamp_idx" ON "test_execution_results"("passed", "timestamp");

-- CreateIndex
CREATE INDEX "baseline_metrics_hypothesis_metric_idx" ON "baseline_metrics"("hypothesis", "metric");

-- CreateIndex
CREATE INDEX "baseline_metrics_collectedAt_idx" ON "baseline_metrics"("collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "baseline_metrics_hypothesis_metric_collectedAt_key" ON "baseline_metrics"("hypothesis", "metric", "collectedAt");

-- CreateIndex
CREATE INDEX "customers_status_tier_idx" ON "customers"("status", "tier");

-- CreateIndex
CREATE INDEX "customers_industry_idx" ON "customers"("industry");

-- CreateIndex
CREATE INDEX "customers_cloudId_idx" ON "customers"("cloudId");

-- CreateIndex
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

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
CREATE INDEX "idx_customers_industry" ON "customers"("industry");

-- CreateIndex
CREATE INDEX "idx_customers_created_at" ON "customers"("createdAt");

-- CreateIndex
CREATE INDEX "idx_customers_updated_at" ON "customers"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_customers_last_contact" ON "customers"("lastContact");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_email_key" ON "customers"("tenantId", "email");

-- CreateIndex
CREATE INDEX "customer_contacts_customerId_isPrimary_idx" ON "customer_contacts"("customerId", "isPrimary");

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
CREATE INDEX "proposals_status_dueDate_idx" ON "proposals"("status", "dueDate");

-- CreateIndex
CREATE INDEX "proposals_customerId_status_idx" ON "proposals"("customerId", "status");

-- CreateIndex
CREATE INDEX "proposals_createdBy_idx" ON "proposals"("createdBy");

-- CreateIndex
CREATE INDEX "proposals_cloudId_idx" ON "proposals"("cloudId");

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
CREATE INDEX "idx_proposals_created_by" ON "proposals"("createdBy");

-- CreateIndex
CREATE INDEX "idx_proposals_customer_status" ON "proposals"("customerId", "status");

-- CreateIndex
CREATE INDEX "idx_proposals_created_at" ON "proposals"("createdAt");

-- CreateIndex
CREATE INDEX "idx_proposals_updated_at" ON "proposals"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_proposals_due_date" ON "proposals"("dueDate");

-- CreateIndex
CREATE INDEX "proposal_versions_proposalId_version_idx" ON "proposal_versions"("proposalId", "version");

-- CreateIndex
CREATE INDEX "proposal_versions_createdAt_proposalId_idx" ON "proposal_versions"("createdAt", "proposalId");

-- CreateIndex
CREATE INDEX "proposal_versions_productIds_idx" ON "proposal_versions" USING GIN ("productIds");

-- CreateIndex
CREATE INDEX "proposal_sections_proposalId_order_idx" ON "proposal_sections"("proposalId", "order");

-- CreateIndex
CREATE INDEX "idx_proposal_sections_order" ON "proposal_sections"("proposalId", "order");

-- CreateIndex
CREATE INDEX "proposal_products_proposalId_idx" ON "proposal_products"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_products_productId_idx" ON "proposal_products"("productId");

-- CreateIndex
CREATE INDEX "idx_proposal_products_product_id" ON "proposal_products"("productId");

-- CreateIndex
CREATE INDEX "products_isActive_createdAt_idx" ON "products"("isActive", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "products_isActive_price_idx" ON "products"("isActive", "price");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products" USING GIN ("category");

-- CreateIndex
CREATE INDEX "products_tags_idx" ON "products" USING GIN ("tags");

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
CREATE INDEX "product_relationships_sourceProductId_idx" ON "product_relationships"("sourceProductId");

-- CreateIndex
CREATE INDEX "product_relationships_targetProductId_idx" ON "product_relationships"("targetProductId");

-- CreateIndex
CREATE INDEX "product_relationships_type_idx" ON "product_relationships"("type");

-- CreateIndex
CREATE INDEX "idx_product_relationships_target_id" ON "product_relationships"("targetProductId");

-- CreateIndex
CREATE INDEX "idx_product_relationships_type" ON "product_relationships"("type");

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
CREATE INDEX "content_type_isActive_idx" ON "content"("type", "isActive");

-- CreateIndex
CREATE INDEX "content_tags_idx" ON "content"("tags");

-- CreateIndex
CREATE INDEX "content_category_idx" ON "content"("category");

-- CreateIndex
CREATE INDEX "content_cloudId_idx" ON "content"("cloudId");

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
CREATE INDEX "idx_content_category" ON "content"("category");

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
CREATE INDEX "approval_workflows_name_idx" ON "approval_workflows"("name");

-- CreateIndex
CREATE INDEX "approval_workflows_description_idx" ON "approval_workflows"("description");

-- CreateIndex
CREATE INDEX "approval_workflows_entityType_isActive_idx" ON "approval_workflows"("entityType", "isActive");

-- CreateIndex
CREATE INDEX "workflow_stages_workflowId_order_idx" ON "workflow_stages"("workflowId", "order");

-- CreateIndex
CREATE INDEX "idx_workflow_stages_order" ON "workflow_stages"("workflowId", "order");

-- CreateIndex
CREATE INDEX "approval_executions_workflowId_status_idx" ON "approval_executions"("workflowId", "status");

-- CreateIndex
CREATE INDEX "approval_executions_proposalId_idx" ON "approval_executions"("proposalId");

-- CreateIndex
CREATE INDEX "approval_decisions_executionId_idx" ON "approval_decisions"("executionId");

-- CreateIndex
CREATE INDEX "approval_decisions_approverId_idx" ON "approval_decisions"("approverId");

-- CreateIndex
CREATE INDEX "Outbox_status_idx" ON "Outbox"("status");

-- CreateIndex
CREATE INDEX "Outbox_createdAt_idx" ON "Outbox"("createdAt");

-- CreateIndex
CREATE INDEX "Outbox_type_idx" ON "Outbox"("type");

-- CreateIndex
CREATE INDEX "Outbox_status_createdAt_idx" ON "Outbox"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_ProposalAssignees_AB_unique" ON "_ProposalAssignees"("A", "B");

-- CreateIndex
CREATE INDEX "_ProposalAssignees_B_index" ON "_ProposalAssignees"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "context_rules" ADD CONSTRAINT "context_rules_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_access" ADD CONSTRAINT "temporary_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_analytics_profiles" ADD CONSTRAINT "user_analytics_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_trends" ADD CONSTRAINT "performance_trends_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_analytics_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_responses" ADD CONSTRAINT "security_responses_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "security_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_preferences" ADD CONSTRAINT "communication_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessibility_configurations" ADD CONSTRAINT "accessibility_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessibility_test_results" ADD CONSTRAINT "accessibility_test_results_configId_fkey" FOREIGN KEY ("configId") REFERENCES "accessibility_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hypothesis_validation_events" ADD CONSTRAINT "hypothesis_validation_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "component_traceability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_execution_results" ADD CONSTRAINT "test_execution_results_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_execution_results" ADD CONSTRAINT "test_execution_results_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "user_story_metrics"("userStoryId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_sections" ADD CONSTRAINT "proposal_sections_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_products" ADD CONSTRAINT "proposal_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_products" ADD CONSTRAINT "proposal_products_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationships" ADD CONSTRAINT "product_relationships_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationships" ADD CONSTRAINT "product_relationships_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationships" ADD CONSTRAINT "product_relationships_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_access_logs" ADD CONSTRAINT "content_access_logs_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_access_logs" ADD CONSTRAINT "content_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_rules" ADD CONSTRAINT "validation_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_rules" ADD CONSTRAINT "validation_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_proposalProductId_fkey" FOREIGN KEY ("proposalProductId") REFERENCES "proposal_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_issues" ADD CONSTRAINT "validation_issues_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "validation_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_executions" ADD CONSTRAINT "validation_executions_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "approval_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_executions" ADD CONSTRAINT "approval_executions_currentStage_fkey" FOREIGN KEY ("currentStage") REFERENCES "workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_executions" ADD CONSTRAINT "approval_executions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_executions" ADD CONSTRAINT "approval_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "approval_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "approval_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProposalAssignees" ADD CONSTRAINT "_ProposalAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProposalAssignees" ADD CONSTRAINT "_ProposalAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

