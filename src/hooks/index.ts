/**
 * PosalPro MVP2 - Hooks Index
 * Centralized exports for all custom hooks
 */

// Infinite Query Hooks
export * from './useInfiniteProposals';
export * from './useInfiniteCustomers';
export * from './useInfiniteProducts';

// Re-export for convenience
export { useInfiniteProposals, useInfiniteProposalsData } from './useInfiniteProposals';
export { useInfiniteCustomers, useInfiniteCustomersData } from './useInfiniteCustomers';
export { useInfiniteProducts, useInfiniteProductsData } from './useInfiniteProducts';
