/**
 * PosalPro MVP2 - Entity Type Definitions
 * Comprehensive entity interfaces for all business objects
 */

// Re-export new entity types (avoiding conflicts with existing types)
export * from './customer';
export * from './product';

// Selectively export proposal types to avoid conflicts
export type {
  ComponentUsage,
  CreateProposalData,
  CreateProposalProductData,
  CreateProposalSectionData,
  ProductSelectionAnalytics,
  ProposalComponentMapping,
  ProposalPerformanceMetrics,
  ProposalValidationResult,
  ProposalWithCustomer,
  ProposalWithDetails,
  SectionAnalytics,
  TestResult,
  UpdateProposalData,
  UserStoryTracking,
} from './proposal';

// Re-export existing types for backward compatibility
export type * from '../proposals';
export type { BaseEntity } from '../shared';

// Entity union type for type guards and utility functions
export type EntityType =
  | 'proposal'
  | 'customer'
  | 'product'
  | 'user'
  | 'role'
  | 'content'
  | 'validation_rule'
  | 'approval_workflow'
  | 'proposal_section'
  | 'proposal_product'
  | 'product_relationship';
