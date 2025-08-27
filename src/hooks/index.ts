/**
 * PosalPro MVP2 - Hooks Index
 * Centralized exports for all custom hooks
 */

// React Query Hooks
export * from './useProposals';
export * from './useProducts';
export * from './useCustomers';

// Legacy exports for backward compatibility
export { useInfiniteCustomers } from './useInfiniteCustomers';
export { useInfiniteProducts } from './useInfiniteProducts';
