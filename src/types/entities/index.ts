/**
 * PosalPro MVP2 - Entity Type Definitions
 * Comprehensive entity interfaces for all business objects
 */

// Re-export proposal types only (avoiding conflicts)
export type * from '../proposals';

// Base entity interface - using export type for isolated modules
export type { BaseEntity } from '../shared';

// Entity union type for type guards and utility functions
export type EntityType = 'proposal' | 'customer' | 'product' | 'user' | 'role' | 'deadline';
