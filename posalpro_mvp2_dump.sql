--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.workflow_stages DROP CONSTRAINT "workflow_stages_workflowId_fkey";
ALTER TABLE ONLY public.validation_rules DROP CONSTRAINT "validation_rules_productId_fkey";
ALTER TABLE ONLY public.validation_rules DROP CONSTRAINT "validation_rules_createdBy_fkey";
ALTER TABLE ONLY public.validation_issues DROP CONSTRAINT "validation_issues_ruleId_fkey";
ALTER TABLE ONLY public.validation_issues DROP CONSTRAINT "validation_issues_resolvedBy_fkey";
ALTER TABLE ONLY public.validation_issues DROP CONSTRAINT "validation_issues_proposalProductId_fkey";
ALTER TABLE ONLY public.validation_issues DROP CONSTRAINT "validation_issues_proposalId_fkey";
ALTER TABLE ONLY public.validation_executions DROP CONSTRAINT "validation_executions_triggeredBy_fkey";
ALTER TABLE ONLY public.user_sessions DROP CONSTRAINT "user_sessions_userId_fkey";
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT "user_roles_userId_fkey";
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT "user_roles_roleId_fkey";
ALTER TABLE ONLY public.user_preferences DROP CONSTRAINT "user_preferences_userId_fkey";
ALTER TABLE ONLY public.user_permissions DROP CONSTRAINT "user_permissions_userId_fkey";
ALTER TABLE ONLY public.user_permissions DROP CONSTRAINT "user_permissions_permissionId_fkey";
ALTER TABLE ONLY public.user_analytics_profiles DROP CONSTRAINT "user_analytics_profiles_userId_fkey";
ALTER TABLE ONLY public.temporary_access DROP CONSTRAINT "temporary_access_userId_fkey";
ALTER TABLE ONLY public.security_responses DROP CONSTRAINT "security_responses_eventId_fkey";
ALTER TABLE ONLY public.security_events DROP CONSTRAINT "security_events_userId_fkey";
ALTER TABLE ONLY public.roles DROP CONSTRAINT "roles_parentId_fkey";
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT "role_permissions_roleId_fkey";
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT "role_permissions_permissionId_fkey";
ALTER TABLE ONLY public.proposals DROP CONSTRAINT "proposals_customerId_fkey";
ALTER TABLE ONLY public.proposals DROP CONSTRAINT "proposals_createdBy_fkey";
ALTER TABLE ONLY public.proposal_sections DROP CONSTRAINT "proposal_sections_proposalId_fkey";
ALTER TABLE ONLY public.proposal_products DROP CONSTRAINT "proposal_products_proposalId_fkey";
ALTER TABLE ONLY public.proposal_products DROP CONSTRAINT "proposal_products_productId_fkey";
ALTER TABLE ONLY public.product_relationships DROP CONSTRAINT "product_relationships_targetProductId_fkey";
ALTER TABLE ONLY public.product_relationships DROP CONSTRAINT "product_relationships_sourceProductId_fkey";
ALTER TABLE ONLY public.product_relationships DROP CONSTRAINT "product_relationships_createdBy_fkey";
ALTER TABLE ONLY public.performance_trends DROP CONSTRAINT "performance_trends_profileId_fkey";
ALTER TABLE ONLY public.notification_deliveries DROP CONSTRAINT "notification_deliveries_recipientId_fkey";
ALTER TABLE ONLY public.hypothesis_validation_events DROP CONSTRAINT "hypothesis_validation_events_userId_fkey";
ALTER TABLE ONLY public.customer_contacts DROP CONSTRAINT "customer_contacts_customerId_fkey";
ALTER TABLE ONLY public.context_rules DROP CONSTRAINT "context_rules_roleId_fkey";
ALTER TABLE ONLY public.content DROP CONSTRAINT "content_createdBy_fkey";
ALTER TABLE ONLY public.content_access_logs DROP CONSTRAINT "content_access_logs_userId_fkey";
ALTER TABLE ONLY public.content_access_logs DROP CONSTRAINT "content_access_logs_contentId_fkey";
ALTER TABLE ONLY public.communication_preferences DROP CONSTRAINT "communication_preferences_userId_fkey";
ALTER TABLE ONLY public.audit_logs DROP CONSTRAINT "audit_logs_userId_fkey";
ALTER TABLE ONLY public.approval_workflows DROP CONSTRAINT "approval_workflows_createdBy_fkey";
ALTER TABLE ONLY public.approval_executions DROP CONSTRAINT "approval_executions_workflowId_fkey";
ALTER TABLE ONLY public.approval_executions DROP CONSTRAINT "approval_executions_proposalId_fkey";
ALTER TABLE ONLY public.approval_executions DROP CONSTRAINT "approval_executions_currentStage_fkey";
ALTER TABLE ONLY public.approval_decisions DROP CONSTRAINT "approval_decisions_stageId_fkey";
ALTER TABLE ONLY public.approval_decisions DROP CONSTRAINT "approval_decisions_executionId_fkey";
ALTER TABLE ONLY public.approval_decisions DROP CONSTRAINT "approval_decisions_approverId_fkey";
ALTER TABLE ONLY public.accessibility_test_results DROP CONSTRAINT "accessibility_test_results_configId_fkey";
ALTER TABLE ONLY public.accessibility_configurations DROP CONSTRAINT "accessibility_configurations_userId_fkey";
ALTER TABLE ONLY public."_ProposalAssignees" DROP CONSTRAINT "_ProposalAssignees_B_fkey";
ALTER TABLE ONLY public."_ProposalAssignees" DROP CONSTRAINT "_ProposalAssignees_A_fkey";
DROP INDEX public."workflow_stages_workflowId_order_idx";
DROP INDEX public."validation_rules_ruleType_idx";
DROP INDEX public."validation_rules_category_isActive_idx";
DROP INDEX public."validation_issues_severity_detectedAt_idx";
DROP INDEX public."validation_issues_ruleId_status_idx";
DROP INDEX public."validation_issues_entityType_status_idx";
DROP INDEX public."validation_executions_triggeredBy_idx";
DROP INDEX public."validation_executions_entityType_timestamp_idx";
DROP INDEX public.users_email_key;
DROP INDEX public."user_sessions_sessionToken_key";
DROP INDEX public."user_sessions_refreshToken_key";
DROP INDEX public."user_roles_userId_roleId_key";
DROP INDEX public."user_preferences_userId_key";
DROP INDEX public."user_permissions_userId_permissionId_key";
DROP INDEX public."user_analytics_profiles_userId_key";
DROP INDEX public.security_events_type_status_idx;
DROP INDEX public."security_events_timestamp_riskLevel_idx";
DROP INDEX public.roles_name_key;
DROP INDEX public."role_permissions_roleId_permissionId_key";
DROP INDEX public."proposals_status_dueDate_idx";
DROP INDEX public."proposals_customerId_status_idx";
DROP INDEX public."proposals_createdBy_idx";
DROP INDEX public."proposal_sections_proposalId_order_idx";
DROP INDEX public."proposal_products_proposalId_idx";
DROP INDEX public."proposal_products_productId_idx";
DROP INDEX public.products_sku_key;
DROP INDEX public.products_sku_idx;
DROP INDEX public."products_isActive_category_idx";
DROP INDEX public.product_relationships_type_idx;
DROP INDEX public."product_relationships_targetProductId_idx";
DROP INDEX public."product_relationships_sourceProductId_idx";
DROP INDEX public.permissions_resource_action_scope_key;
DROP INDEX public."notification_deliveries_status_sentAt_idx";
DROP INDEX public."notification_deliveries_recipientId_readAt_idx";
DROP INDEX public."hypothesis_validation_events_userId_hypothesis_idx";
DROP INDEX public.hypothesis_validation_events_hypothesis_timestamp_idx;
DROP INDEX public.customers_status_tier_idx;
DROP INDEX public.customers_industry_idx;
DROP INDEX public."customer_contacts_customerId_isPrimary_idx";
DROP INDEX public."content_type_isActive_idx";
DROP INDEX public.content_tags_idx;
DROP INDEX public.content_category_idx;
DROP INDEX public."content_access_logs_userId_accessType_idx";
DROP INDEX public."content_access_logs_contentId_timestamp_idx";
DROP INDEX public."communication_preferences_userId_key";
DROP INDEX public."audit_logs_userId_timestamp_idx";
DROP INDEX public.audit_logs_timestamp_severity_idx;
DROP INDEX public."audit_logs_entity_entityId_idx";
DROP INDEX public."approval_workflows_entityType_isActive_idx";
DROP INDEX public."approval_executions_workflowId_status_idx";
DROP INDEX public."approval_executions_proposalId_idx";
DROP INDEX public."approval_decisions_executionId_idx";
DROP INDEX public."approval_decisions_approverId_idx";
DROP INDEX public."accessibility_configurations_userId_key";
DROP INDEX public."_ProposalAssignees_B_index";
DROP INDEX public."_ProposalAssignees_AB_unique";
ALTER TABLE ONLY public.workflow_stages DROP CONSTRAINT workflow_stages_pkey;
ALTER TABLE ONLY public.validation_rules DROP CONSTRAINT validation_rules_pkey;
ALTER TABLE ONLY public.validation_issues DROP CONSTRAINT validation_issues_pkey;
ALTER TABLE ONLY public.validation_executions DROP CONSTRAINT validation_executions_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.user_sessions DROP CONSTRAINT user_sessions_pkey;
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT user_roles_pkey;
ALTER TABLE ONLY public.user_preferences DROP CONSTRAINT user_preferences_pkey;
ALTER TABLE ONLY public.user_permissions DROP CONSTRAINT user_permissions_pkey;
ALTER TABLE ONLY public.user_analytics_profiles DROP CONSTRAINT user_analytics_profiles_pkey;
ALTER TABLE ONLY public.temporary_access DROP CONSTRAINT temporary_access_pkey;
ALTER TABLE ONLY public.security_responses DROP CONSTRAINT security_responses_pkey;
ALTER TABLE ONLY public.security_events DROP CONSTRAINT security_events_pkey;
ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_pkey;
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT role_permissions_pkey;
ALTER TABLE ONLY public.proposals DROP CONSTRAINT proposals_pkey;
ALTER TABLE ONLY public.proposal_sections DROP CONSTRAINT proposal_sections_pkey;
ALTER TABLE ONLY public.proposal_products DROP CONSTRAINT proposal_products_pkey;
ALTER TABLE ONLY public.products DROP CONSTRAINT products_pkey;
ALTER TABLE ONLY public.product_relationships DROP CONSTRAINT product_relationships_pkey;
ALTER TABLE ONLY public.permissions DROP CONSTRAINT permissions_pkey;
ALTER TABLE ONLY public.performance_trends DROP CONSTRAINT performance_trends_pkey;
ALTER TABLE ONLY public.notification_deliveries DROP CONSTRAINT notification_deliveries_pkey;
ALTER TABLE ONLY public.hypothesis_validation_events DROP CONSTRAINT hypothesis_validation_events_pkey;
ALTER TABLE ONLY public.customers DROP CONSTRAINT customers_pkey;
ALTER TABLE ONLY public.customer_contacts DROP CONSTRAINT customer_contacts_pkey;
ALTER TABLE ONLY public.context_rules DROP CONSTRAINT context_rules_pkey;
ALTER TABLE ONLY public.content DROP CONSTRAINT content_pkey;
ALTER TABLE ONLY public.content_access_logs DROP CONSTRAINT content_access_logs_pkey;
ALTER TABLE ONLY public.communication_preferences DROP CONSTRAINT communication_preferences_pkey;
ALTER TABLE ONLY public.audit_logs DROP CONSTRAINT audit_logs_pkey;
ALTER TABLE ONLY public.approval_workflows DROP CONSTRAINT approval_workflows_pkey;
ALTER TABLE ONLY public.approval_executions DROP CONSTRAINT approval_executions_pkey;
ALTER TABLE ONLY public.approval_decisions DROP CONSTRAINT approval_decisions_pkey;
ALTER TABLE ONLY public.accessibility_test_results DROP CONSTRAINT accessibility_test_results_pkey;
ALTER TABLE ONLY public.accessibility_configurations DROP CONSTRAINT accessibility_configurations_pkey;
ALTER TABLE ONLY public._prisma_migrations DROP CONSTRAINT _prisma_migrations_pkey;
DROP TABLE public.workflow_stages;
DROP TABLE public.validation_rules;
DROP TABLE public.validation_issues;
DROP TABLE public.validation_executions;
DROP TABLE public.users;
DROP TABLE public.user_sessions;
DROP TABLE public.user_roles;
DROP TABLE public.user_preferences;
DROP TABLE public.user_permissions;
DROP TABLE public.user_analytics_profiles;
DROP TABLE public.temporary_access;
DROP TABLE public.security_responses;
DROP TABLE public.security_events;
DROP TABLE public.roles;
DROP TABLE public.role_permissions;
DROP TABLE public.proposals;
DROP TABLE public.proposal_sections;
DROP TABLE public.proposal_products;
DROP TABLE public.products;
DROP TABLE public.product_relationships;
DROP TABLE public.permissions;
DROP TABLE public.performance_trends;
DROP TABLE public.notification_deliveries;
DROP TABLE public.hypothesis_validation_events;
DROP TABLE public.customers;
DROP TABLE public.customer_contacts;
DROP TABLE public.context_rules;
DROP TABLE public.content_access_logs;
DROP TABLE public.content;
DROP TABLE public.communication_preferences;
DROP TABLE public.audit_logs;
DROP TABLE public.approval_workflows;
DROP TABLE public.approval_executions;
DROP TABLE public.approval_decisions;
DROP TABLE public.accessibility_test_results;
DROP TABLE public.accessibility_configurations;
DROP TABLE public._prisma_migrations;
DROP TABLE public."_ProposalAssignees";
DROP TYPE public."ValidationStatus";
DROP TYPE public."ValidationRuleType";
DROP TYPE public."UserStatus";
DROP TYPE public."TrendDirection";
DROP TYPE public."TemporaryAccessStatus";
DROP TYPE public."Severity";
DROP TYPE public."SecurityEventType";
DROP TYPE public."SecurityEventStatus";
DROP TYPE public."SectionType";
DROP TYPE public."RiskLevel";
DROP TYPE public."ResolutionMethod";
DROP TYPE public."RelationshipType";
DROP TYPE public."ProposalStatus";
DROP TYPE public."Priority";
DROP TYPE public."PermissionScope";
DROP TYPE public."NotificationStatus";
DROP TYPE public."NotificationRecipientType";
DROP TYPE public."NotificationChannel";
DROP TYPE public."IssueStatus";
DROP TYPE public."HypothesisType";
DROP TYPE public."ExecutionStatus";
DROP TYPE public."EntityType";
DROP TYPE public."DecisionType";
DROP TYPE public."CustomerTier";
DROP TYPE public."CustomerStatus";
DROP TYPE public."ContextOperator";
DROP TYPE public."ContextEffect";
DROP TYPE public."ContentType";
DROP TYPE public."AuditSeverity";
DROP TYPE public."AuditCategory";
DROP TYPE public."AccessibilityTestType";
DROP TYPE public."AccessibilityStandard";
DROP TYPE public."AccessibilityLevel";
DROP TYPE public."AccessType";
--
-- Name: AccessType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccessType" AS ENUM (
    'VIEW',
    'EDIT',
    'USE',
    'DOWNLOAD'
);


--
-- Name: AccessibilityLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccessibilityLevel" AS ENUM (
    'AA',
    'AAA'
);


--
-- Name: AccessibilityStandard; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccessibilityStandard" AS ENUM (
    'WCAG_2_1_AA',
    'WCAG_2_1_AAA',
    'SECTION_508',
    'EN_301_549'
);


--
-- Name: AccessibilityTestType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccessibilityTestType" AS ENUM (
    'AUTOMATED',
    'MANUAL',
    'USER_TESTING'
);


--
-- Name: AuditCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditCategory" AS ENUM (
    'DATA',
    'ACCESS',
    'CONFIGURATION',
    'SECURITY',
    'SYSTEM'
);


--
-- Name: AuditSeverity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditSeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: ContentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContentType" AS ENUM (
    'TEXT',
    'TEMPLATE',
    'IMAGE',
    'DOCUMENT',
    'MEDIA'
);


--
-- Name: ContextEffect; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContextEffect" AS ENUM (
    'GRANT',
    'DENY'
);


--
-- Name: ContextOperator; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContextOperator" AS ENUM (
    'EQUALS',
    'NOT_EQUALS',
    'CONTAINS',
    'GREATER_THAN',
    'LESS_THAN'
);


--
-- Name: CustomerStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CustomerStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PROSPECT',
    'CHURNED'
);


--
-- Name: CustomerTier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CustomerTier" AS ENUM (
    'STANDARD',
    'PREMIUM',
    'ENTERPRISE',
    'VIP'
);


--
-- Name: DecisionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DecisionType" AS ENUM (
    'APPROVE',
    'REJECT',
    'DELEGATE',
    'REQUEST_CHANGES'
);


--
-- Name: EntityType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EntityType" AS ENUM (
    'PROPOSAL',
    'CUSTOMER',
    'PRODUCT',
    'USER',
    'ROLE',
    'CONTENT',
    'VALIDATION_RULE',
    'APPROVAL_WORKFLOW',
    'PROPOSAL_SECTION',
    'PROPOSAL_PRODUCT',
    'PRODUCT_RELATIONSHIP'
);


--
-- Name: ExecutionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExecutionStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'ESCALATED'
);


--
-- Name: HypothesisType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."HypothesisType" AS ENUM (
    'H1',
    'H3',
    'H4',
    'H6',
    'H7',
    'H8'
);


--
-- Name: IssueStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IssueStatus" AS ENUM (
    'OPEN',
    'RESOLVED',
    'IGNORED',
    'FALSE_POSITIVE'
);


--
-- Name: NotificationChannel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationChannel" AS ENUM (
    'EMAIL',
    'SMS',
    'PUSH',
    'IN_APP',
    'WEBHOOK'
);


--
-- Name: NotificationRecipientType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationRecipientType" AS ENUM (
    'USER',
    'ROLE',
    'GROUP',
    'EXTERNAL'
);


--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'BOUNCED',
    'READ'
);


--
-- Name: PermissionScope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PermissionScope" AS ENUM (
    'ALL',
    'TEAM',
    'OWN'
);


--
-- Name: Priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


--
-- Name: ProposalStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ProposalStatus" AS ENUM (
    'DRAFT',
    'IN_REVIEW',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'SUBMITTED',
    'ACCEPTED',
    'DECLINED'
);


--
-- Name: RelationshipType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RelationshipType" AS ENUM (
    'REQUIRES',
    'RECOMMENDS',
    'INCOMPATIBLE',
    'ALTERNATIVE',
    'OPTIONAL'
);


--
-- Name: ResolutionMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ResolutionMethod" AS ENUM (
    'AUTO',
    'MANUAL',
    'SUGGESTION'
);


--
-- Name: RiskLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RiskLevel" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: SectionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SectionType" AS ENUM (
    'TEXT',
    'PRODUCTS',
    'TERMS',
    'PRICING',
    'CUSTOM'
);


--
-- Name: SecurityEventStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SecurityEventStatus" AS ENUM (
    'DETECTED',
    'INVESTIGATING',
    'RESOLVED',
    'FALSE_POSITIVE'
);


--
-- Name: SecurityEventType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SecurityEventType" AS ENUM (
    'LOGIN_ATTEMPT',
    'PERMISSION_DENIED',
    'DATA_ACCESS',
    'CONFIG_CHANGE',
    'SUSPICIOUS_ACTIVITY'
);


--
-- Name: Severity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Severity" AS ENUM (
    'INFO',
    'WARNING',
    'ERROR',
    'CRITICAL'
);


--
-- Name: TemporaryAccessStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TemporaryAccessStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'REVOKED'
);


--
-- Name: TrendDirection; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TrendDirection" AS ENUM (
    'IMPROVING',
    'DECLINING',
    'STABLE'
);


--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING',
    'SUSPENDED',
    'DELETED'
);


--
-- Name: ValidationRuleType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ValidationRuleType" AS ENUM (
    'COMPATIBILITY',
    'LICENSE',
    'CONFIGURATION',
    'COMPLIANCE',
    'CUSTOM'
);


--
-- Name: ValidationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ValidationStatus" AS ENUM (
    'VALID',
    'INVALID',
    'WARNING',
    'NOT_VALIDATED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _ProposalAssignees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_ProposalAssignees" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: accessibility_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessibility_configurations (
    id text NOT NULL,
    "userId" text NOT NULL,
    "complianceLevel" public."AccessibilityLevel" DEFAULT 'AA'::public."AccessibilityLevel" NOT NULL,
    preferences jsonb NOT NULL,
    "assistiveTechnology" jsonb NOT NULL,
    customizations jsonb NOT NULL,
    "lastUpdated" timestamp(3) without time zone NOT NULL
);


--
-- Name: accessibility_test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessibility_test_results (
    id text NOT NULL,
    "configId" text NOT NULL,
    "testType" public."AccessibilityTestType" NOT NULL,
    standard public."AccessibilityStandard" NOT NULL,
    component text NOT NULL,
    passed boolean NOT NULL,
    violations jsonb NOT NULL,
    "testedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "testedBy" text NOT NULL,
    environment text NOT NULL
);


--
-- Name: approval_decisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_decisions (
    id text NOT NULL,
    "executionId" text NOT NULL,
    "stageId" text NOT NULL,
    "approverId" text NOT NULL,
    decision public."DecisionType" NOT NULL,
    comments text,
    "timeToDecision" integer,
    "qualityScore" double precision,
    "performanceImpact" double precision,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: approval_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_executions (
    id text NOT NULL,
    "workflowId" text NOT NULL,
    "entityId" text NOT NULL,
    "currentStage" text,
    status public."ExecutionStatus" DEFAULT 'PENDING'::public."ExecutionStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "slaCompliance" boolean,
    "proposalId" text,
    "performanceMetrics" jsonb,
    "userStoryContext" text[]
);


--
-- Name: approval_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_workflows (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "entityType" public."EntityType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "executionStats" jsonb,
    "performanceMetrics" jsonb,
    "userStoryMappings" text[],
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text,
    "userRole" text,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text NOT NULL,
    changes jsonb NOT NULL,
    "ipAddress" text NOT NULL,
    "userAgent" text NOT NULL,
    success boolean NOT NULL,
    "errorMessage" text,
    severity public."AuditSeverity" NOT NULL,
    category public."AuditCategory" NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: communication_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communication_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    "quietHoursStart" text,
    "quietHoursEnd" text,
    channels jsonb NOT NULL,
    frequency jsonb NOT NULL,
    categories jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    type public."ContentType" DEFAULT 'TEXT'::public."ContentType" NOT NULL,
    content text NOT NULL,
    tags text[],
    category text[],
    "searchableText" text,
    keywords text[],
    quality jsonb,
    usage jsonb,
    "isPublic" boolean DEFAULT false NOT NULL,
    "allowedRoles" text[],
    "searchOptimization" jsonb,
    "userStoryTracking" jsonb,
    version integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: content_access_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_access_logs (
    id text NOT NULL,
    "contentId" text NOT NULL,
    "userId" text NOT NULL,
    "accessType" public."AccessType" NOT NULL,
    "userStory" text,
    "performanceImpact" double precision,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: context_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.context_rules (
    id text NOT NULL,
    "roleId" text NOT NULL,
    attribute text NOT NULL,
    operator public."ContextOperator" NOT NULL,
    value jsonb NOT NULL,
    effect public."ContextEffect" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: customer_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_contacts (
    id text NOT NULL,
    "customerId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    role text,
    department text,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    website text,
    address text,
    industry text,
    "companySize" text,
    revenue double precision,
    status public."CustomerStatus" DEFAULT 'ACTIVE'::public."CustomerStatus" NOT NULL,
    tier public."CustomerTier" DEFAULT 'STANDARD'::public."CustomerTier" NOT NULL,
    tags text[],
    metadata jsonb,
    segmentation jsonb,
    "riskScore" double precision,
    ltv double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastContact" timestamp(3) without time zone
);


--
-- Name: hypothesis_validation_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hypothesis_validation_events (
    id text NOT NULL,
    "userId" text NOT NULL,
    hypothesis public."HypothesisType" NOT NULL,
    "userStoryId" text NOT NULL,
    "componentId" text NOT NULL,
    action text NOT NULL,
    "measurementData" jsonb NOT NULL,
    "targetValue" double precision NOT NULL,
    "actualValue" double precision NOT NULL,
    "performanceImprovement" double precision NOT NULL,
    "userRole" text NOT NULL,
    "sessionId" text NOT NULL,
    "testCaseId" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notification_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_deliveries (
    id text NOT NULL,
    "templateId" text NOT NULL,
    "recipientId" text NOT NULL,
    "recipientType" public."NotificationRecipientType" NOT NULL,
    channel public."NotificationChannel" NOT NULL,
    status public."NotificationStatus" DEFAULT 'PENDING'::public."NotificationStatus" NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "readAt" timestamp(3) without time zone,
    attempts integer DEFAULT 0 NOT NULL,
    "errorMessage" text,
    metadata jsonb
);


--
-- Name: performance_trends; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_trends (
    id text NOT NULL,
    "profileId" text NOT NULL,
    metric text NOT NULL,
    "values" jsonb NOT NULL,
    trend public."TrendDirection" NOT NULL,
    confidence double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    scope public."PermissionScope" DEFAULT 'ALL'::public."PermissionScope" NOT NULL,
    constraints jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: product_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_relationships (
    id text NOT NULL,
    "sourceProductId" text NOT NULL,
    "targetProductId" text NOT NULL,
    type public."RelationshipType" NOT NULL,
    quantity integer,
    condition jsonb,
    "validationHistory" jsonb,
    "performanceImpact" jsonb,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    sku text NOT NULL,
    price double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    category text[],
    tags text[],
    attributes jsonb,
    images text[],
    "isActive" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "usageAnalytics" jsonb,
    "userStoryMappings" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: proposal_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_products (
    id text NOT NULL,
    "proposalId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    configuration jsonb,
    "selectionAnalytics" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: proposal_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_sections (
    id text NOT NULL,
    "proposalId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "order" integer NOT NULL,
    type public."SectionType" DEFAULT 'TEXT'::public."SectionType" NOT NULL,
    "validationStatus" public."ValidationStatus" DEFAULT 'NOT_VALIDATED'::public."ValidationStatus" NOT NULL,
    "analyticsData" jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposals (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "customerId" text NOT NULL,
    "createdBy" text NOT NULL,
    status public."ProposalStatus" DEFAULT 'DRAFT'::public."ProposalStatus" NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    value double precision,
    currency text DEFAULT 'USD'::text NOT NULL,
    "validUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone,
    "approvedAt" timestamp(3) without time zone,
    "performanceData" jsonb,
    "userStoryTracking" jsonb,
    "riskScore" double precision,
    tags text[],
    metadata jsonb
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "grantedBy" text NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    level integer NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "parentId" text,
    "performanceExpectations" jsonb
);


--
-- Name: security_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_events (
    id text NOT NULL,
    "userId" text,
    type public."SecurityEventType" NOT NULL,
    "ipAddress" text NOT NULL,
    details jsonb NOT NULL,
    "riskLevel" public."RiskLevel" NOT NULL,
    status public."SecurityEventStatus" DEFAULT 'DETECTED'::public."SecurityEventStatus" NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: security_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_responses (
    id text NOT NULL,
    "eventId" text NOT NULL,
    action text NOT NULL,
    "performedBy" text NOT NULL,
    result text NOT NULL,
    notes text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: temporary_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temporary_access (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roleId" text NOT NULL,
    "grantedBy" text NOT NULL,
    reason text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    status public."TemporaryAccessStatus" DEFAULT 'ACTIVE'::public."TemporaryAccessStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "revokedBy" text
);


--
-- Name: user_analytics_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_analytics_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "performanceMetrics" jsonb NOT NULL,
    "hypothesisContributions" jsonb NOT NULL,
    "skillAssessments" jsonb NOT NULL,
    "efficiencyRatings" jsonb NOT NULL,
    "lastAssessment" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "permissionId" text NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "grantedBy" text NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    theme text DEFAULT 'system'::text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    "analyticsConsent" boolean DEFAULT false NOT NULL,
    "performanceTracking" boolean DEFAULT false NOT NULL,
    "dashboardLayout" jsonb,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roleId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assignedBy" text NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "sessionToken" text NOT NULL,
    "refreshToken" text,
    "ipAddress" text NOT NULL,
    "userAgent" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "lastUsed" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    department text NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLogin" timestamp(3) without time zone
);


--
-- Name: validation_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validation_executions (
    id text NOT NULL,
    "entityId" text NOT NULL,
    "entityType" public."EntityType" NOT NULL,
    "rulesExecuted" text[],
    "executionTime" integer NOT NULL,
    "issuesFound" integer NOT NULL,
    "issuesResolved" integer NOT NULL,
    "performanceScore" double precision,
    "triggeredBy" text NOT NULL,
    "userStoryContext" text[],
    "hypothesesValidated" text[],
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: validation_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validation_issues (
    id text NOT NULL,
    "entityId" text NOT NULL,
    "entityType" public."EntityType" NOT NULL,
    "ruleId" text NOT NULL,
    severity public."Severity" NOT NULL,
    message text NOT NULL,
    "fixSuggestion" text,
    status public."IssueStatus" DEFAULT 'OPEN'::public."IssueStatus" NOT NULL,
    "proposalId" text,
    "proposalProductId" text,
    "detectedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "resolutionMethod" public."ResolutionMethod",
    "performanceMetrics" jsonb,
    "userStoryContext" text[]
);


--
-- Name: validation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validation_rules (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    "ruleType" public."ValidationRuleType" NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    severity public."Severity" DEFAULT 'WARNING'::public."Severity" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "productId" text,
    "executionStats" jsonb,
    "userStoryMappings" text[],
    "hypothesesSupported" text[],
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: workflow_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_stages (
    id text NOT NULL,
    "workflowId" text NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer NOT NULL,
    approvers text[],
    conditions jsonb,
    actions jsonb,
    "slaHours" integer,
    "isParallel" boolean DEFAULT false NOT NULL,
    "isOptional" boolean DEFAULT false NOT NULL,
    "escalationRules" jsonb,
    "performanceTracking" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _ProposalAssignees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_ProposalAssignees" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
2d03ee4b-bef6-4e8d-badd-713539447007	b6e926be415a5a7d27ff0f1b96367d38560b11428b3aba881453963c493db8a6	2025-06-01 17:21:49.422234+03	20240101000000_init_authentication_system	\N	\N	2025-06-01 17:21:49.389883+03	1
9b677eff-4d03-4ff4-acb1-810470455677	6804b69ad53a339aa6e0bbea2369f0aa596bda6e53d7a73cbdcac1a133e396c3	2025-06-03 18:10:53.17847+03	20250603151053_add_core_data_models	\N	\N	2025-06-03 18:10:53.115058+03	1
\.


--
-- Data for Name: accessibility_configurations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessibility_configurations (id, "userId", "complianceLevel", preferences, "assistiveTechnology", customizations, "lastUpdated") FROM stdin;
\.


--
-- Data for Name: accessibility_test_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessibility_test_results (id, "configId", "testType", standard, component, passed, violations, "testedAt", "testedBy", environment) FROM stdin;
\.


--
-- Data for Name: approval_decisions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_decisions (id, "executionId", "stageId", "approverId", decision, comments, "timeToDecision", "qualityScore", "performanceImpact", "timestamp") FROM stdin;
\.


--
-- Data for Name: approval_executions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_executions (id, "workflowId", "entityId", "currentStage", status, "startedAt", "completedAt", "slaCompliance", "proposalId", "performanceMetrics", "userStoryContext") FROM stdin;
\.


--
-- Data for Name: approval_workflows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_workflows (id, name, description, "entityType", "isActive", "executionStats", "performanceMetrics", "userStoryMappings", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "userId", "userRole", action, entity, "entityId", changes, "ipAddress", "userAgent", success, "errorMessage", severity, category, "timestamp") FROM stdin;
cmbdzy6340001y0zdvlghbv6l	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T18:30:56.847Z", "oldValue": null, "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 18:30:56.847
cmbe7sp010001s2ntpa9ljydd	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:10:38.352Z", "oldValue": "2025-06-01T18:30:56.840Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:10:38.352
cmbe7wtel0006s2ntsddo0dl0	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:13:50.684Z", "oldValue": "2025-06-01T22:10:38.344Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:13:50.684
cmbe7yhyd000bs2nt88z0pt8a	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:15:09.156Z", "oldValue": "2025-06-01T22:13:50.673Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:15:09.156
cmbe7ytvg000fs2ntmm5r7agm	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:15:24.603Z", "oldValue": "2025-06-01T22:15:09.151Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:15:24.603
cmbe7z1y6000js2ntul06q9a3	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:15:35.070Z", "oldValue": "2025-06-01T22:15:24.601Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:15:35.07
cmbe7ztrh000ns2nt84s2yebt	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:16:11.116Z", "oldValue": "2025-06-01T22:15:35.068Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:16:11.116
cmbe8039w000rs2nteb8ivo7t	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:16:23.443Z", "oldValue": "2025-06-01T22:16:11.112Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:16:23.443
cmbe82mao000vs2ntvb20hup3	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:18:21.407Z", "oldValue": "2025-06-01T22:16:23.441Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:18:21.407
cmbe83dn3000zs2ntdwnvs4rg	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:18:56.847Z", "oldValue": "2025-06-01T22:18:21.399Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:18:56.847
cmbe83kji0013s2ntgcwbykb8	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:19:05.789Z", "oldValue": "2025-06-01T22:18:56.845Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:19:05.789
cmbe867sx0017s2ntjrkdcduu	\N	System Administrator	LOGIN	User	cmbdr1uvm001sz047cpsyfjne	[{"field": "lastLogin", "newValue": "2025-06-01T22:21:09.248Z", "oldValue": "2025-06-01T22:19:05.786Z", "changeType": "update"}]	0.0.0.0	NextAuth	t	\N	LOW	ACCESS	2025-06-01 22:21:09.248
\.


--
-- Data for Name: communication_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.communication_preferences (id, "userId", language, timezone, "quietHoursStart", "quietHoursEnd", channels, frequency, categories, "updatedAt") FROM stdin;
\.


--
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content (id, title, description, type, content, tags, category, "searchableText", keywords, quality, usage, "isPublic", "allowedRoles", "searchOptimization", "userStoryTracking", version, "isActive", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: content_access_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_access_logs (id, "contentId", "userId", "accessType", "userStory", "performanceImpact", "timestamp") FROM stdin;
\.


--
-- Data for Name: context_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.context_rules (id, "roleId", attribute, operator, value, effect, "createdAt") FROM stdin;
\.


--
-- Data for Name: customer_contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_contacts (id, "customerId", name, email, phone, role, department, "isPrimary", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, email, phone, website, address, industry, "companySize", revenue, status, tier, tags, metadata, segmentation, "riskScore", ltv, "createdAt", "updatedAt", "lastContact") FROM stdin;
cmbgvm5ww00006gox6gg0a3t4	API Test Customer	apitest@example.com	+1-555-9999	https://apitest.com	\N	Testing	\N	\N	ACTIVE	STANDARD	{}	\N	\N	\N	\N	2025-06-03 18:52:56.816	2025-06-03 18:52:56.816	\N
\.


--
-- Data for Name: hypothesis_validation_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hypothesis_validation_events (id, "userId", hypothesis, "userStoryId", "componentId", action, "measurementData", "targetValue", "actualValue", "performanceImprovement", "userRole", "sessionId", "testCaseId", "timestamp") FROM stdin;
\.


--
-- Data for Name: notification_deliveries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_deliveries (id, "templateId", "recipientId", "recipientType", channel, status, "sentAt", "deliveredAt", "readAt", attempts, "errorMessage", metadata) FROM stdin;
\.


--
-- Data for Name: performance_trends; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.performance_trends (id, "profileId", metric, "values", trend, confidence, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, resource, action, scope, constraints, "createdAt", "updatedAt") FROM stdin;
cmbdr1unt0000z047kinfuw2f	users	create	ALL	\N	2025-06-01 14:21:52.121	2025-06-01 14:21:52.121
cmbdr1uo00001z047532ximpr	users	read	ALL	\N	2025-06-01 14:21:52.129	2025-06-01 14:21:52.129
cmbdr1uo20002z047sdlfdtji	users	read	TEAM	\N	2025-06-01 14:21:52.13	2025-06-01 14:21:52.13
cmbdr1uo30003z047y28by9uy	users	read	OWN	\N	2025-06-01 14:21:52.131	2025-06-01 14:21:52.131
cmbdr1uo40004z047us1teaf2	users	update	ALL	\N	2025-06-01 14:21:52.132	2025-06-01 14:21:52.132
cmbdr1uo50005z047vw5s9xx0	users	update	OWN	\N	2025-06-01 14:21:52.133	2025-06-01 14:21:52.133
cmbdr1uo60006z047yp5ja30h	users	delete	ALL	\N	2025-06-01 14:21:52.134	2025-06-01 14:21:52.134
cmbdr1uo70007z047mfzlnowe	proposals	create	ALL	\N	2025-06-01 14:21:52.135	2025-06-01 14:21:52.135
cmbdr1uo80008z0478sxqyb59	proposals	create	TEAM	\N	2025-06-01 14:21:52.136	2025-06-01 14:21:52.136
cmbdr1uo80009z047900smqfx	proposals	read	ALL	\N	2025-06-01 14:21:52.137	2025-06-01 14:21:52.137
cmbdr1uo9000az047cecz1ip7	proposals	read	TEAM	\N	2025-06-01 14:21:52.138	2025-06-01 14:21:52.138
cmbdr1uoa000bz047dsdcjhkr	proposals	read	OWN	\N	2025-06-01 14:21:52.139	2025-06-01 14:21:52.139
cmbdr1uob000cz047nmi34rte	proposals	update	ALL	\N	2025-06-01 14:21:52.139	2025-06-01 14:21:52.139
cmbdr1uoc000dz047fdp6bds9	proposals	update	TEAM	\N	2025-06-01 14:21:52.141	2025-06-01 14:21:52.141
cmbdr1uod000ez047rb92no1r	proposals	update	OWN	\N	2025-06-01 14:21:52.142	2025-06-01 14:21:52.142
cmbdr1uoe000fz0478v3u035g	proposals	delete	ALL	\N	2025-06-01 14:21:52.143	2025-06-01 14:21:52.143
cmbdr1uog000gz047f03pan0k	proposals	delete	OWN	\N	2025-06-01 14:21:52.144	2025-06-01 14:21:52.144
cmbdr1uoh000hz0470tzn61g0	proposals	approve	ALL	\N	2025-06-01 14:21:52.145	2025-06-01 14:21:52.145
cmbdr1uoi000iz047b4z6fcqw	proposals	approve	TEAM	\N	2025-06-01 14:21:52.147	2025-06-01 14:21:52.147
cmbdr1uoj000jz0471kecplw8	proposals	submit	ALL	\N	2025-06-01 14:21:52.148	2025-06-01 14:21:52.148
cmbdr1uok000kz0477oka2e0z	proposals	submit	OWN	\N	2025-06-01 14:21:52.149	2025-06-01 14:21:52.149
cmbdr1uol000lz047g2dzgnpg	products	create	ALL	\N	2025-06-01 14:21:52.15	2025-06-01 14:21:52.15
cmbdr1uom000mz047zx3fmxew	products	read	ALL	\N	2025-06-01 14:21:52.151	2025-06-01 14:21:52.151
cmbdr1uon000nz047yryar2jn	products	update	ALL	\N	2025-06-01 14:21:52.152	2025-06-01 14:21:52.152
cmbdr1uop000oz047ea5sapg3	products	delete	ALL	\N	2025-06-01 14:21:52.153	2025-06-01 14:21:52.153
cmbdr1uoq000pz047p455vb3z	products	validate	ALL	\N	2025-06-01 14:21:52.154	2025-06-01 14:21:52.154
cmbdr1uoq000qz04784lbp3gr	customers	create	ALL	\N	2025-06-01 14:21:52.155	2025-06-01 14:21:52.155
cmbdr1uos000rz047sople8o5	customers	create	TEAM	\N	2025-06-01 14:21:52.156	2025-06-01 14:21:52.156
cmbdr1uow000sz047or5gf9sl	customers	read	ALL	\N	2025-06-01 14:21:52.16	2025-06-01 14:21:52.16
cmbdr1uox000tz047etu57i90	customers	read	TEAM	\N	2025-06-01 14:21:52.161	2025-06-01 14:21:52.161
cmbdr1uoy000uz047agz1bxtx	customers	update	ALL	\N	2025-06-01 14:21:52.162	2025-06-01 14:21:52.162
cmbdr1uoz000vz047jjrx1bv3	customers	update	TEAM	\N	2025-06-01 14:21:52.163	2025-06-01 14:21:52.163
cmbdr1up0000wz047uh9zhned	customers	delete	ALL	\N	2025-06-01 14:21:52.164	2025-06-01 14:21:52.164
cmbdr1up0000xz047woh980rb	analytics	read	ALL	\N	2025-06-01 14:21:52.165	2025-06-01 14:21:52.165
cmbdr1up1000yz0471hjoic9d	analytics	read	TEAM	\N	2025-06-01 14:21:52.166	2025-06-01 14:21:52.166
cmbdr1up2000zz047ailobycr	analytics	read	OWN	\N	2025-06-01 14:21:52.167	2025-06-01 14:21:52.167
cmbdr1up30010z04748l7ni5e	reports	create	ALL	\N	2025-06-01 14:21:52.168	2025-06-01 14:21:52.168
cmbdr1up40011z04719y0wfyk	reports	create	TEAM	\N	2025-06-01 14:21:52.169	2025-06-01 14:21:52.169
cmbdr1up50012z047fjhh81nd	reports	read	ALL	\N	2025-06-01 14:21:52.17	2025-06-01 14:21:52.17
cmbdr1up60013z047nl4ag7jv	reports	read	TEAM	\N	2025-06-01 14:21:52.171	2025-06-01 14:21:52.171
cmbdr1up70014z047ds7299p9	reports	export	ALL	\N	2025-06-01 14:21:52.172	2025-06-01 14:21:52.172
cmbdr1up80015z0479sxpyxx7	reports	export	TEAM	\N	2025-06-01 14:21:52.173	2025-06-01 14:21:52.173
cmbdr1up90016z047synjhwxr	system	configure	ALL	\N	2025-06-01 14:21:52.173	2025-06-01 14:21:52.173
cmbdr1upa0017z04754ocvlxq	system	monitor	ALL	\N	2025-06-01 14:21:52.174	2025-06-01 14:21:52.174
cmbdr1upb0018z047vxnmqvg1	audit	read	ALL	\N	2025-06-01 14:21:52.175	2025-06-01 14:21:52.175
cmbdr1upc0019z047xo5kjv6c	security	manage	ALL	\N	2025-06-01 14:21:52.176	2025-06-01 14:21:52.176
cmbdr1upd001az047m2kxtb8n	roles	create	ALL	\N	2025-06-01 14:21:52.177	2025-06-01 14:21:52.177
cmbdr1upd001bz0478lq16w7o	roles	read	ALL	\N	2025-06-01 14:21:52.178	2025-06-01 14:21:52.178
cmbdr1upe001cz0474nyxngq5	roles	update	ALL	\N	2025-06-01 14:21:52.179	2025-06-01 14:21:52.179
cmbdr1upf001dz047o94kl5j4	roles	delete	ALL	\N	2025-06-01 14:21:52.179	2025-06-01 14:21:52.179
cmbdr1upg001ez047kqv0d0mf	permissions	assign	ALL	\N	2025-06-01 14:21:52.18	2025-06-01 14:21:52.18
cmbdr1uph001fz047iu1lcnnq	permissions	revoke	ALL	\N	2025-06-01 14:21:52.181	2025-06-01 14:21:52.181
cmbdr1upi001gz047d4a6n5hi	hypotheses	create	ALL	\N	2025-06-01 14:21:52.182	2025-06-01 14:21:52.182
cmbdr1upj001hz047ayox5ki3	hypotheses	read	ALL	\N	2025-06-01 14:21:52.183	2025-06-01 14:21:52.183
cmbdr1upk001iz047xphcaub3	hypotheses	validate	ALL	\N	2025-06-01 14:21:52.184	2025-06-01 14:21:52.184
cmbdr1upk001jz0471h0jjp85	experiments	run	ALL	\N	2025-06-01 14:21:52.185	2025-06-01 14:21:52.185
cmbdr1upl001kz0473udhnu9s	experiments	analyze	ALL	\N	2025-06-01 14:21:52.186	2025-06-01 14:21:52.186
\.


--
-- Data for Name: product_relationships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_relationships (id, "sourceProductId", "targetProductId", type, quantity, condition, "validationHistory", "performanceImpact", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, description, sku, price, currency, category, tags, attributes, images, "isActive", version, "usageAnalytics", "userStoryMappings", "createdAt", "updatedAt") FROM stdin;
cmbgvm7a300016gox0dttd5yf	API Test Product	\N	API-TEST-001	99.99	USD	{testing}	{api,test}	\N	{}	t	1	\N	{}	2025-06-03 18:52:58.587	2025-06-03 18:52:58.587
\.


--
-- Data for Name: proposal_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposal_products (id, "proposalId", "productId", quantity, "unitPrice", discount, total, configuration, "selectionAnalytics", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: proposal_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposal_sections (id, "proposalId", title, content, "order", type, "validationStatus", "analyticsData", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposals (id, title, description, "customerId", "createdBy", status, version, priority, value, currency, "validUntil", "createdAt", "updatedAt", "dueDate", "submittedAt", "approvedAt", "performanceData", "userStoryTracking", "riskScore", tags, metadata) FROM stdin;
cmbgwabxa000349vb3edljfwr	Test Proposal	Test Description	cmbgvm5ww00006gox6gg0a3t4	cmbgmgsuk0000qg7l9tug8zm7	DRAFT	1	MEDIUM	10000	USD	2025-12-31 23:59:59	2025-06-03 19:11:44.349	2025-06-03 19:11:44.349	\N	\N	\N	\N	\N	\N	{test}	{"clientName": "Test Client", "projectType": "development", "clientContact": {"name": "John Doe", "email": "test@example.com", "phone": "+1-555-0123"}}
cmbgwavda000549vbw37bm6bt	234234234	This proposal provides a comprehensive solution tailored to meet the client's specific requirements and objectives.	cmbgvm5ww00006gox6gg0a3t4	cmbgmgsuk0000qg7l9tug8zm7	DRAFT	1	MEDIUM	1218	USD	2025-07-04 00:00:00	2025-06-03 19:12:09.55	2025-06-03 19:12:09.55	\N	\N	\N	\N	\N	\N	{}	{"clientName": "mmm", "projectType": "development", "clientContact": {"name": "ewe", "email": "m2d@f.bcom", "phone": "232134", "jobTitle": "healthcare"}}
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, "roleId", "permissionId", "grantedAt", "grantedBy") FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, level, "isSystem", "createdAt", "updatedAt", "parentId", "performanceExpectations") FROM stdin;
cmbdr1upm001lz047lft0zvy9	System Administrator	Full system access with all administrative capabilities	1	t	2025-06-01 14:21:52.187	2025-06-01 14:21:52.187	\N	{"responseTime": 2, "systemUptime": 99.9, "securityIncidents": 0}
cmbdr1upp001mz047jcia33jx	Executive	Executive-level access with strategic oversight capabilities	2	t	2025-06-01 14:21:52.189	2025-06-01 14:21:52.189	\N	{"teamPerformance": 90, "proposalApprovalTime": 24, "strategicDecisionQuality": 95}
cmbdr1upp001nz047bifmaldc	Proposal Manager	Comprehensive proposal management with team coordination	3	t	2025-06-01 14:21:52.19	2025-06-01 14:21:52.19	\N	{"qualityScore": 85, "teamCoordination": 90, "timelineAdherence": 88, "proposalCompletionRate": 95}
cmbdr1upq001oz047dhpyc1dh	Senior SME	Senior subject matter expert with mentoring responsibilities	4	t	2025-06-01 14:21:52.191	2025-06-01 14:21:52.191	\N	{"mentoring": 85, "responseTime": 4, "contentQuality": 90, "expertiseAccuracy": 95}
cmbdr1upr001pz04748lszoxz	SME	Subject matter expert with content creation capabilities	5	t	2025-06-01 14:21:52.192	2025-06-01 14:21:52.192	\N	{"responseTime": 6, "collaboration": 80, "contentQuality": 85}
cmbdr1ups001qz0471ughoq68	Contributor	Basic contribution access with limited proposal capabilities	6	t	2025-06-01 14:21:52.193	2025-06-01 14:21:52.193	\N	{"timeliness": 85, "qualityScore": 75, "taskCompletion": 90}
cmbdr1upt001rz047c095pewn	Viewer	Read-only access for observation and learning	7	t	2025-06-01 14:21:52.193	2025-06-01 14:21:52.193	\N	{"engagementLevel": 70}
\.


--
-- Data for Name: security_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_events (id, "userId", type, "ipAddress", details, "riskLevel", status, "timestamp") FROM stdin;
cmbe0052t0004y0zdimqa6eeu	\N	LOGIN_ATTEMPT	0.0.0.0	{"email": "test@example.com", "error": "Invalid credentials", "success": false}	MEDIUM	DETECTED	2025-06-01 18:32:28.853
cmbe5nzj40000kvm6l0fcs5xt	\N	LOGIN_ATTEMPT	0.0.0.0	{"email": "test@example.com", "error": "Invalid credentials", "success": false}	MEDIUM	DETECTED	2025-06-01 21:10:59.485
cmbe6tqtf00008pl60fvrk131	\N	LOGIN_ATTEMPT	0.0.0.0	{"email": "test@example.com", "error": "Invalid credentials", "success": false}	MEDIUM	DETECTED	2025-06-01 21:43:27.746
cmbe7whu20004s2ntiip7jmsg	\N	LOGIN_ATTEMPT	0.0.0.0	{"email": "admin@posalpro.com", "error": "Invalid credentials", "success": false}	MEDIUM	DETECTED	2025-06-01 22:13:35.69
cmbe7y2ww0009s2ntivg4r4q3	\N	LOGIN_ATTEMPT	0.0.0.0	{"email": "admin@posalpro.com", "error": "Invalid credentials", "success": false}	MEDIUM	DETECTED	2025-06-01 22:14:49.664
\.


--
-- Data for Name: security_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_responses (id, "eventId", action, "performedBy", result, notes, "timestamp") FROM stdin;
\.


--
-- Data for Name: temporary_access; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.temporary_access (id, "userId", "roleId", "grantedBy", reason, "expiresAt", status, "createdAt", "revokedAt", "revokedBy") FROM stdin;
\.


--
-- Data for Name: user_analytics_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_analytics_profiles (id, "userId", "performanceMetrics", "hypothesisContributions", "skillAssessments", "efficiencyRatings", "lastAssessment") FROM stdin;
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_permissions (id, "userId", "permissionId", "grantedAt", "grantedBy", "expiresAt", "isActive") FROM stdin;
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_preferences (id, "userId", theme, language, "analyticsConsent", "performanceTracking", "dashboardLayout", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, "userId", "roleId", "assignedAt", "assignedBy", "expiresAt", "isActive") FROM stdin;
cmbgmgsw80003qg7ly6mt0qwa	cmbgmgsuk0000qg7l9tug8zm7	cmbdr1upm001lz047lft0zvy9	2025-06-03 14:36:50.121	SYSTEM	\N	t
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (id, "userId", "sessionToken", "refreshToken", "ipAddress", "userAgent", "isActive", "createdAt", "expiresAt", "lastUsed") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, name, password, department, status, "createdAt", "updatedAt", "lastLogin") FROM stdin;
cmbgmgsuk0000qg7l9tug8zm7	admin@posalpro.com	Admin User	$2b$12$CTAyeaN3SWWkRLdbbfjaPeYtjLnUdA6x72F.NM0bBDMSVG8qzhbWC	Administration	ACTIVE	2025-06-03 14:36:50.059	2025-06-03 14:43:50.688	2025-06-03 14:43:50.687
\.


--
-- Data for Name: validation_executions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.validation_executions (id, "entityId", "entityType", "rulesExecuted", "executionTime", "issuesFound", "issuesResolved", "performanceScore", "triggeredBy", "userStoryContext", "hypothesesValidated", "timestamp") FROM stdin;
\.


--
-- Data for Name: validation_issues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.validation_issues (id, "entityId", "entityType", "ruleId", severity, message, "fixSuggestion", status, "proposalId", "proposalProductId", "detectedAt", "resolvedAt", "resolvedBy", "resolutionMethod", "performanceMetrics", "userStoryContext") FROM stdin;
\.


--
-- Data for Name: validation_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.validation_rules (id, name, description, category, "ruleType", conditions, actions, severity, "isActive", "productId", "executionStats", "userStoryMappings", "hypothesesSupported", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: workflow_stages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workflow_stages (id, "workflowId", name, description, "order", approvers, conditions, actions, "slaHours", "isParallel", "isOptional", "escalationRules", "performanceTracking", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accessibility_configurations accessibility_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessibility_configurations
    ADD CONSTRAINT accessibility_configurations_pkey PRIMARY KEY (id);


--
-- Name: accessibility_test_results accessibility_test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessibility_test_results
    ADD CONSTRAINT accessibility_test_results_pkey PRIMARY KEY (id);


--
-- Name: approval_decisions approval_decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_decisions
    ADD CONSTRAINT approval_decisions_pkey PRIMARY KEY (id);


--
-- Name: approval_executions approval_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_executions
    ADD CONSTRAINT approval_executions_pkey PRIMARY KEY (id);


--
-- Name: approval_workflows approval_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT approval_workflows_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: communication_preferences communication_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communication_preferences
    ADD CONSTRAINT communication_preferences_pkey PRIMARY KEY (id);


--
-- Name: content_access_logs content_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_access_logs
    ADD CONSTRAINT content_access_logs_pkey PRIMARY KEY (id);


--
-- Name: content content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_pkey PRIMARY KEY (id);


--
-- Name: context_rules context_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.context_rules
    ADD CONSTRAINT context_rules_pkey PRIMARY KEY (id);


--
-- Name: customer_contacts customer_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT customer_contacts_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: hypothesis_validation_events hypothesis_validation_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hypothesis_validation_events
    ADD CONSTRAINT hypothesis_validation_events_pkey PRIMARY KEY (id);


--
-- Name: notification_deliveries notification_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id);


--
-- Name: performance_trends performance_trends_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_trends
    ADD CONSTRAINT performance_trends_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: product_relationships product_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_relationships
    ADD CONSTRAINT product_relationships_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: proposal_products proposal_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_products
    ADD CONSTRAINT proposal_products_pkey PRIMARY KEY (id);


--
-- Name: proposal_sections proposal_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_sections
    ADD CONSTRAINT proposal_sections_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: security_responses security_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_responses
    ADD CONSTRAINT security_responses_pkey PRIMARY KEY (id);


--
-- Name: temporary_access temporary_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_access
    ADD CONSTRAINT temporary_access_pkey PRIMARY KEY (id);


--
-- Name: user_analytics_profiles user_analytics_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_analytics_profiles
    ADD CONSTRAINT user_analytics_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: validation_executions validation_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_executions
    ADD CONSTRAINT validation_executions_pkey PRIMARY KEY (id);


--
-- Name: validation_issues validation_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_issues
    ADD CONSTRAINT validation_issues_pkey PRIMARY KEY (id);


--
-- Name: validation_rules validation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_rules
    ADD CONSTRAINT validation_rules_pkey PRIMARY KEY (id);


--
-- Name: workflow_stages workflow_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_stages
    ADD CONSTRAINT workflow_stages_pkey PRIMARY KEY (id);


--
-- Name: _ProposalAssignees_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_ProposalAssignees_AB_unique" ON public."_ProposalAssignees" USING btree ("A", "B");


--
-- Name: _ProposalAssignees_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_ProposalAssignees_B_index" ON public."_ProposalAssignees" USING btree ("B");


--
-- Name: accessibility_configurations_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "accessibility_configurations_userId_key" ON public.accessibility_configurations USING btree ("userId");


--
-- Name: approval_decisions_approverId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "approval_decisions_approverId_idx" ON public.approval_decisions USING btree ("approverId");


--
-- Name: approval_decisions_executionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "approval_decisions_executionId_idx" ON public.approval_decisions USING btree ("executionId");


--
-- Name: approval_executions_proposalId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "approval_executions_proposalId_idx" ON public.approval_executions USING btree ("proposalId");


--
-- Name: approval_executions_workflowId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "approval_executions_workflowId_status_idx" ON public.approval_executions USING btree ("workflowId", status);


--
-- Name: approval_workflows_entityType_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "approval_workflows_entityType_isActive_idx" ON public.approval_workflows USING btree ("entityType", "isActive");


--
-- Name: audit_logs_entity_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_entity_entityId_idx" ON public.audit_logs USING btree (entity, "entityId");


--
-- Name: audit_logs_timestamp_severity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_timestamp_severity_idx ON public.audit_logs USING btree ("timestamp", severity);


--
-- Name: audit_logs_userId_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_userId_timestamp_idx" ON public.audit_logs USING btree ("userId", "timestamp");


--
-- Name: communication_preferences_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "communication_preferences_userId_key" ON public.communication_preferences USING btree ("userId");


--
-- Name: content_access_logs_contentId_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "content_access_logs_contentId_timestamp_idx" ON public.content_access_logs USING btree ("contentId", "timestamp");


--
-- Name: content_access_logs_userId_accessType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "content_access_logs_userId_accessType_idx" ON public.content_access_logs USING btree ("userId", "accessType");


--
-- Name: content_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_category_idx ON public.content USING btree (category);


--
-- Name: content_tags_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_tags_idx ON public.content USING btree (tags);


--
-- Name: content_type_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "content_type_isActive_idx" ON public.content USING btree (type, "isActive");


--
-- Name: customer_contacts_customerId_isPrimary_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "customer_contacts_customerId_isPrimary_idx" ON public.customer_contacts USING btree ("customerId", "isPrimary");


--
-- Name: customers_industry_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_industry_idx ON public.customers USING btree (industry);


--
-- Name: customers_status_tier_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_status_tier_idx ON public.customers USING btree (status, tier);


--
-- Name: hypothesis_validation_events_hypothesis_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hypothesis_validation_events_hypothesis_timestamp_idx ON public.hypothesis_validation_events USING btree (hypothesis, "timestamp");


--
-- Name: hypothesis_validation_events_userId_hypothesis_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "hypothesis_validation_events_userId_hypothesis_idx" ON public.hypothesis_validation_events USING btree ("userId", hypothesis);


--
-- Name: notification_deliveries_recipientId_readAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notification_deliveries_recipientId_readAt_idx" ON public.notification_deliveries USING btree ("recipientId", "readAt");


--
-- Name: notification_deliveries_status_sentAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notification_deliveries_status_sentAt_idx" ON public.notification_deliveries USING btree (status, "sentAt");


--
-- Name: permissions_resource_action_scope_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_resource_action_scope_key ON public.permissions USING btree (resource, action, scope);


--
-- Name: product_relationships_sourceProductId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_relationships_sourceProductId_idx" ON public.product_relationships USING btree ("sourceProductId");


--
-- Name: product_relationships_targetProductId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_relationships_targetProductId_idx" ON public.product_relationships USING btree ("targetProductId");


--
-- Name: product_relationships_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_relationships_type_idx ON public.product_relationships USING btree (type);


--
-- Name: products_isActive_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "products_isActive_category_idx" ON public.products USING btree ("isActive", category);


--
-- Name: products_sku_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_sku_idx ON public.products USING btree (sku);


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: proposal_products_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "proposal_products_productId_idx" ON public.proposal_products USING btree ("productId");


--
-- Name: proposal_products_proposalId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "proposal_products_proposalId_idx" ON public.proposal_products USING btree ("proposalId");


--
-- Name: proposal_sections_proposalId_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "proposal_sections_proposalId_order_idx" ON public.proposal_sections USING btree ("proposalId", "order");


--
-- Name: proposals_createdBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "proposals_createdBy_idx" ON public.proposals USING btree ("createdBy");


--
-- Name: proposals_customerId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "proposals_customerId_status_idx" ON public.proposals USING btree ("customerId", status);


--
-- Name: proposals_status_dueDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "proposals_status_dueDate_idx" ON public.proposals USING btree (status, "dueDate");


--
-- Name: role_permissions_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON public.role_permissions USING btree ("roleId", "permissionId");


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: security_events_timestamp_riskLevel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "security_events_timestamp_riskLevel_idx" ON public.security_events USING btree ("timestamp", "riskLevel");


--
-- Name: security_events_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX security_events_type_status_idx ON public.security_events USING btree (type, status);


--
-- Name: user_analytics_profiles_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_analytics_profiles_userId_key" ON public.user_analytics_profiles USING btree ("userId");


--
-- Name: user_permissions_userId_permissionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON public.user_permissions USING btree ("userId", "permissionId");


--
-- Name: user_preferences_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_preferences_userId_key" ON public.user_preferences USING btree ("userId");


--
-- Name: user_roles_userId_roleId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON public.user_roles USING btree ("userId", "roleId");


--
-- Name: user_sessions_refreshToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON public.user_sessions USING btree ("refreshToken");


--
-- Name: user_sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON public.user_sessions USING btree ("sessionToken");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: validation_executions_entityType_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "validation_executions_entityType_timestamp_idx" ON public.validation_executions USING btree ("entityType", "timestamp");


--
-- Name: validation_executions_triggeredBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "validation_executions_triggeredBy_idx" ON public.validation_executions USING btree ("triggeredBy");


--
-- Name: validation_issues_entityType_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "validation_issues_entityType_status_idx" ON public.validation_issues USING btree ("entityType", status);


--
-- Name: validation_issues_ruleId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "validation_issues_ruleId_status_idx" ON public.validation_issues USING btree ("ruleId", status);


--
-- Name: validation_issues_severity_detectedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "validation_issues_severity_detectedAt_idx" ON public.validation_issues USING btree (severity, "detectedAt");


--
-- Name: validation_rules_category_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "validation_rules_category_isActive_idx" ON public.validation_rules USING btree (category, "isActive");


--
-- Name: validation_rules_ruleType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "validation_rules_ruleType_idx" ON public.validation_rules USING btree ("ruleType");


--
-- Name: workflow_stages_workflowId_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "workflow_stages_workflowId_order_idx" ON public.workflow_stages USING btree ("workflowId", "order");


--
-- Name: _ProposalAssignees _ProposalAssignees_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ProposalAssignees"
    ADD CONSTRAINT "_ProposalAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ProposalAssignees _ProposalAssignees_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ProposalAssignees"
    ADD CONSTRAINT "_ProposalAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accessibility_configurations accessibility_configurations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessibility_configurations
    ADD CONSTRAINT "accessibility_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accessibility_test_results accessibility_test_results_configId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessibility_test_results
    ADD CONSTRAINT "accessibility_test_results_configId_fkey" FOREIGN KEY ("configId") REFERENCES public.accessibility_configurations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: approval_decisions approval_decisions_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_decisions
    ADD CONSTRAINT "approval_decisions_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: approval_decisions approval_decisions_executionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_decisions
    ADD CONSTRAINT "approval_decisions_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES public.approval_executions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: approval_decisions approval_decisions_stageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_decisions
    ADD CONSTRAINT "approval_decisions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES public.workflow_stages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: approval_executions approval_executions_currentStage_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_executions
    ADD CONSTRAINT "approval_executions_currentStage_fkey" FOREIGN KEY ("currentStage") REFERENCES public.workflow_stages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: approval_executions approval_executions_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_executions
    ADD CONSTRAINT "approval_executions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: approval_executions approval_executions_workflowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_executions
    ADD CONSTRAINT "approval_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES public.approval_workflows(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: approval_workflows approval_workflows_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT "approval_workflows_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: communication_preferences communication_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communication_preferences
    ADD CONSTRAINT "communication_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: content_access_logs content_access_logs_contentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_access_logs
    ADD CONSTRAINT "content_access_logs_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES public.content(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: content_access_logs content_access_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_access_logs
    ADD CONSTRAINT "content_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: content content_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT "content_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: context_rules context_rules_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.context_rules
    ADD CONSTRAINT "context_rules_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_contacts customer_contacts_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hypothesis_validation_events hypothesis_validation_events_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hypothesis_validation_events
    ADD CONSTRAINT "hypothesis_validation_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_deliveries notification_deliveries_recipientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT "notification_deliveries_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: performance_trends performance_trends_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_trends
    ADD CONSTRAINT "performance_trends_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public.user_analytics_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_relationships product_relationships_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_relationships
    ADD CONSTRAINT "product_relationships_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_relationships product_relationships_sourceProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_relationships
    ADD CONSTRAINT "product_relationships_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_relationships product_relationships_targetProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_relationships
    ADD CONSTRAINT "product_relationships_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposal_products proposal_products_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_products
    ADD CONSTRAINT "proposal_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: proposal_products proposal_products_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_products
    ADD CONSTRAINT "proposal_products_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposal_sections proposal_sections_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_sections
    ADD CONSTRAINT "proposal_sections_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposals proposals_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: proposals proposals_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles roles_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "roles_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: security_events security_events_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: security_responses security_responses_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_responses
    ADD CONSTRAINT "security_responses_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.security_events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: temporary_access temporary_access_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_access
    ADD CONSTRAINT "temporary_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_analytics_profiles user_analytics_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_analytics_profiles
    ADD CONSTRAINT "user_analytics_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: validation_executions validation_executions_triggeredBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_executions
    ADD CONSTRAINT "validation_executions_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: validation_issues validation_issues_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_issues
    ADD CONSTRAINT "validation_issues_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: validation_issues validation_issues_proposalProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_issues
    ADD CONSTRAINT "validation_issues_proposalProductId_fkey" FOREIGN KEY ("proposalProductId") REFERENCES public.proposal_products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: validation_issues validation_issues_resolvedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_issues
    ADD CONSTRAINT "validation_issues_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: validation_issues validation_issues_ruleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_issues
    ADD CONSTRAINT "validation_issues_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES public.validation_rules(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: validation_rules validation_rules_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_rules
    ADD CONSTRAINT "validation_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: validation_rules validation_rules_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_rules
    ADD CONSTRAINT "validation_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_stages workflow_stages_workflowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_stages
    ADD CONSTRAINT "workflow_stages_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES public.approval_workflows(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

