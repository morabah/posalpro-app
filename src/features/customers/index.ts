/**
 * Customers Feature Module
 * User Story: US-1.1 (Customer Management), US-1.2 (Customer Profile)
 * Hypothesis: H1 (Customer Experience)
 *
 * ✅ SINGLE FEATURE EXPORT FILE - Follows CORE_REQUIREMENTS.md standards
 * ✅ CENTRALIZED EXPORTS - All customer-related functionality in one place
 * ✅ CLEAN ARCHITECTURE - Separation of concerns with hooks, schemas, and keys
 */

// ====================
// Feature Keys
// ====================

export { qk as customerKeys } from './keys';

// ====================
// Feature Schemas
// ====================

export type {
  CompanySize,
  Customer,
  CustomerAnalytics,
  CustomerBulkDelete,
  CustomerBulkOperation,
  CustomerBulkUpdate,
  CustomerBusinessMetrics,
  CustomerContact,
  CustomerContactCreate,
  CustomerContactUpdate,
  CustomerCoordination,
  CustomerCreate,
  CustomerHealthMetrics,
  CustomerIndustry,
  CustomerInteraction,
  CustomerInteractionCreate,
  CustomerList,
  CustomerOpportunity,
  CustomerOpportunityCreate,
  CustomerProposalsQuery,
  CustomerQuery,
  CustomerSearch,
  CustomerSearchApi,
  CustomerSearchResponse,
  CustomerSegmentation,
  CustomerStatus,
  CustomerTier,
  CustomerUpdate,
} from './schemas';

export {
  CompanySizeSchema,
  CustomerAnalyticsSchema,
  CustomerBulkDeleteSchema,
  CustomerBulkOperationSchema,
  CustomerBulkUpdateSchema,
  CustomerBusinessMetricsSchema,
  CustomerContactCreateSchema,
  CustomerContactSchema,
  CustomerContactUpdateSchema,
  CustomerCoordinationSchema,
  CustomerCreateSchema,
  CustomerHealthMetricsSchema,
  CustomerIndustrySchema,
  CustomerInteractionCreateSchema,
  CustomerInteractionSchema,
  CustomerListSchema,
  BrandNameSchema,
  CustomerOpportunityCreateSchema,
  CustomerOpportunitySchema,
  CustomerProposalsQuerySchema,
  CustomerQuerySchema,
  CustomerSchema,
  CustomerSearchApiSchema,
  CustomerSearchResponseSchema,
  CustomerSearchSchema,
  CustomerSegmentationSchema,
  CustomerStatusSchema,
  CustomerTierSchema,
  CustomerUpdateSchema,
  EmailValidationSchema,
} from './schemas';

// ====================
// Feature Hooks
// ====================

export {
  useCustomer,
  useCustomersByIds,
  useCreateCustomer,
  useCustomerSearch,
  useDeleteCustomer,
  useDeleteCustomersBulk,
  useInfiniteCustomers,
  useUpdateCustomer,
  useCustomerStats,
  useUnifiedCustomerData,
} from './hooks';

// Advanced caching and enhanced hooks
export { useCustomerCache } from './hooks/useCustomerCache';
export { useCustomerEnhanced } from './hooks/useCustomerEnhanced';
