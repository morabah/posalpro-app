/**
 * Infinite Customers Hook - Re-export from main customers hook
 * User Story: US-2.1 (Customer Management)
 * Hypothesis: H3 (Customer relationship management improves proposal success)
 */

export { useInfiniteCustomers } from './useCustomers';

// Re-export types for backward compatibility
export type { CustomerQuery } from '@/services/customerService';
