/**
 * Service Layer Index
 * Centralized exports for all data access services
 */

// Service instances
export { contentService } from './contentService';
export { customerService } from './customerService';
export { productService } from './productService';
export { proposalService } from './proposalService';

// Service types and interfaces
export type { CustomerWithContacts, CustomerWithProposals } from './customerService';

export type {
  ProposalAnalytics,
  ProposalWithCustomer,
  ProposalWithDetails,
} from './proposalService';

export type {
  ProductAnalytics,
  ProductWithRelationships,
  ProductWithValidation,
} from './productService';

export type {
  ContentAnalytics,
  ContentFilters,
  ContentSortOptions,
  ContentWithCreator,
  CreateContentData,
  UpdateContentData,
} from './contentService';

// Legacy user service functions (to be refactored)
export {
  createUser,
  getUserByEmail,
  updateLastLogin,
  type CreateUserData,
  type UserWithoutPassword,
} from './userService';
