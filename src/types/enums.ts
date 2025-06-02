/**
 * PosalPro MVP2 - Core Application Enumerations
 * Defines all key types used throughout the application
 * Based on wireframe analysis and data model requirements
 */

/**
 * User types representing different roles in PosalPro application
 * Based on authentication and authorization requirements from wireframes
 */
export enum UserType {
  SYSTEM_ADMINISTRATOR = 'System Administrator',
  PROPOSAL_MANAGER = 'Proposal Manager',
  SME = 'Subject Matter Expert',
  EXECUTIVE = 'Executive',
  CONTENT_MANAGER = 'Content Manager',
}

/**
 * Proposal workflow status enumeration
 * Maps to approval workflow states from APPROVAL_WORKFLOW_SCREEN.md
 */
export enum ProposalStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUBMITTED = 'submitted',
}

/**
 * Product relationship types for complex product configurations
 * Based on PRODUCT_RELATIONSHIPS_SCREEN.md wireframe
 */
export enum ProductRelationType {
  DEPENDENCY = 'dependency',
  BUNDLE = 'bundle',
  ALTERNATIVE = 'alternative',
  ADDON = 'addon',
}

/**
 * Error categorization for consistent error handling across application
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTH = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS = 'business_logic',
  SYSTEM = 'system',
}

/**
 * Cache categories for performance optimization
 */
export enum CacheCategory {
  USERS = 'users',
  PROPOSALS = 'proposals',
  PRODUCTS = 'products',
  CUSTOMERS = 'customers',
  DYNAMIC_DATA = 'dynamic_data',
  FREQUENTLY_ACCESSED = 'frequently_accessed',
}

/**
 * Notification types for user communication
 */
export enum NotificationType {
  PROPOSAL_ASSIGNED = 'proposal_assigned',
  APPROVAL_REQUIRED = 'approval_required',
  PROPOSAL_APPROVED = 'proposal_approved',
  PROPOSAL_REJECTED = 'proposal_rejected',
  DEADLINE_APPROACHING = 'deadline_approaching',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

/**
 * Document types for content management
 */
export enum DocumentType {
  PROPOSAL = 'proposal',
  TEMPLATE = 'template',
  REFERENCE = 'reference',
  ATTACHMENT = 'attachment',
  RFP = 'rfp',
}

/**
 * Priority levels for proposals and tasks
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Approval decision types
 */
export enum ApprovalDecision {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONDITIONALLY_APPROVED = 'conditionally_approved',
}
