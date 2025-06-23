/**
 * PosalPro MVP2 - Shared Utility Types and Interfaces
 * Common types used across the entire application
 * Ensures consistent data handling and API responses
 */

/**
 * Base entity interface with common fields for all database entities
 * Ensures consistent audit fields across all data models
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Standard API response wrapper for consistent response handling
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Legacy offset-based pagination interface (DEPRECATED - use cursor for new implementations)
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Cursor-based pagination parameters (RECOMMENDED for enterprise scale)
 */
export interface CursorPaginationParams {
  cursor?: string; // ID of the last item from previous page
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Legacy paginated response (for backward compatibility)
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Cursor-based paginated response (enterprise performance)
 */
export interface CursorPaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
    itemCount: number;
  };
  meta: {
    paginationType: 'cursor';
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

/**
 * Filter and search interfaces for data queries
 */
export interface FilterOptions {
  search?: string;
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
}

/**
 * Validation result interface for consistent validation responses
 */
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * File upload interface for document management
 */
export interface FileUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/**
 * Address interface for customer and user profiles
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Contact information interface
 */
export interface ContactInfo {
  email: string;
  phone?: string;
  mobile?: string;
  address?: Address;
}

/**
 * Search result interface for content search functionality
 */
export interface SearchResult {
  id: string;
  title: string;
  type: string;
  content: string;
  relevanceScore: number;
  highlights: string[];
  metadata: Record<string, any>;
}

/**
 * Notification interface for user communications
 */
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}
