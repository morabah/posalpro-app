/**
 * PosalPro MVP2 - Customers Hooks Index
 * Centralized exports for customer-related React Query hooks
 * Standardized structure for consistency across feature modules
 * All hooks are now implemented locally within the features module
 */
export {
  useInfiniteCustomers,
  useCustomer,
  useCustomerSearch,
  useCustomersByIds,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useDeleteCustomersBulk,
} from './useCustomers';
