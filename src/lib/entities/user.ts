import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - User Entity
 * User entity class with CRUD operations and business logic
 * Integrates with existing validation schemas and API client
 */

import { apiClient, type ApiResponse, type PaginatedResponse } from '@/lib/api/client';
import { trackAuthEvent } from '@/lib/store/authStore';
import { createUserSchema, updateUserSchema, userProfileSchema } from '@/lib/validation';
import { UserType } from '@/types/enums';
import { z } from 'zod';

// Infer types from validation schemas
export type UserProfile = z.infer<typeof userProfileSchema>;
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;

export interface UserQueryOptions {
  search?: string;
  department?: string;
  role?: UserType;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
}

export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserPermissions {
  userId: string;
  permissions: string[];
  roles: UserType[];
  inheritedPermissions: string[];
  effectivePermissions: string[];
}

interface UserQueryResponse {
  users: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiUserResponse {
  success: boolean;
  data: UserQueryResponse;
  message: string;
}

/**
 * User Entity Class
 * Provides comprehensive user management with CRUD operations
 */
export class UserEntity {
  private static instance: UserEntity;
  // Removed custom caching - using apiClient built-in caching per CORE_REQUIREMENTS.md

  private constructor() {}

  public static getInstance(): UserEntity {
    if (!UserEntity.instance) {
      UserEntity.instance = new UserEntity();
    }
    return UserEntity.instance;
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<ApiResponse<UserProfile>> {
    try {
      // Validate input data
      const validatedData = createUserSchema.parse(userData);

      // Create user via API
      const response = await apiClient.post<UserProfile>('/users', validatedData);

      if (response.success && response.data) {
        // User created successfully - apiClient handles caching automatically
        // Track user creation event
        trackAuthEvent('user_created', {
          userId: response.data.id,
          role: response.data.role,
          department: response.data.department,
        });
      }

      return response;
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<ApiResponse<UserProfile | null>> {
    try {
      // Fetch from API - apiClient handles caching automatically
      const response = await apiClient.get<UserProfile>(`/users/${id}`);
      return response;
    } catch (error) {
      logger.error(`Failed to find user ${id}:`, error);
      return {
        data: null,
        success: false,
        message: 'User not found',
      };
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<ApiResponse<UserProfile | null>> {
    try {
      const response = await apiClient.get<UserProfile>(
        `/users/email/${encodeURIComponent(email)}`
      );

      if (response.success && response.data) {
        // User updated successfully - apiClient handles caching automatically
      }

      return response;
    } catch (error) {
      logger.error(`Failed to find user by email ${email}:`, error);
      return {
        data: null,
        success: false,
        message: 'User not found',
      };
    }
  }

  /**
   * Update user data
   */
  async update(id: string, updateData: UpdateUserData): Promise<ApiResponse<UserProfile>> {
    try {
      // Validate input data
      const validatedData = updateUserSchema.parse(updateData);

      // Update via API
      const response = await apiClient.put<UserProfile>(`/users/${id}`, validatedData);

      if (response.success && response.data) {
        // User updated successfully - apiClient handles caching automatically

        // Track user update event
        trackAuthEvent('user_updated', {
          userId: id,
          updatedFields: Object.keys(updateData),
        });
      }

      return response;
    } catch (error) {
      logger.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/users/${id}`);

      if (response.success) {
        // User deleted successfully - apiClient handles cache invalidation automatically
        
        // Track user deletion event
        trackAuthEvent('user_deleted', { userId: id });
      }

      return response;
    } catch (error) {
      logger.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Query users with filtering and pagination
   */
  async query(options: UserQueryOptions = {}): Promise<ApiUserResponse> {
    try {
      // Import usersApi dynamically to avoid circular dependency
      const { usersApi } = await import('@/lib/api/endpoints/users');

      const response = await usersApi.queryUsers(options);

      // Results cached automatically by apiClient

      // Transform response to expected format
      const users = Array.isArray(response.data)
        ? response.data
        : (response.data && typeof response.data === 'object' && 'users' in response.data && Array.isArray((response.data as { users: unknown[] }).users))
        ? (response.data as { users: UserProfile[] }).users
        : [];
      const pagination = Array.isArray(response.data)
        ? {
            page: options.page || 1,
            limit: options.limit || 10,
            total: response.data.length,
            totalPages: Math.ceil(response.data.length / (options.limit || 10)),
          }
        : (response.data && typeof response.data === 'object' && 'pagination' in response.data) 
        ? (response.data as { pagination: unknown }).pagination 
        : {
            page: options.page || 1,
            limit: options.limit || 10,
            total: 0,
            totalPages: 0,
          };

      return {
        success: response.success,
        data: {
          users,
          pagination: pagination as { page: number; limit: number; total: number; totalPages: number },
        },
        message: response.message || 'No users found',
      };
    } catch (error) {
      logger.error('Failed to query users:', error);
      throw error;
    }
  }

  /**
   * Get user permissions and roles
   */
  async getPermissions(id: string): Promise<ApiResponse<UserPermissions>> {
    try {
      const response = await apiClient.get<UserPermissions>(`/users/${id}/permissions`);
      return response;
    } catch (error) {
      logger.error(`Failed to get permissions for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update user permissions
   */
  async updatePermissions(
    id: string,
    permissions: { roles?: UserType[]; permissions?: string[] }
  ): Promise<ApiResponse<UserPermissions>> {
    try {
      const response = await apiClient.put<UserPermissions>(
        `/users/${id}/permissions`,
        permissions
      );

      if (response.success) {
        // Track permission change
        trackAuthEvent('user_permissions_updated', {
          userId: id,
          newRoles: permissions.roles,
          newPermissions: permissions.permissions,
        });
      }

      return response;
    } catch (error) {
      logger.error(`Failed to update permissions for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user activity log
   */
  async getActivityLog(
    id: string,
    options: { page?: number; limit?: number; fromDate?: Date; toDate?: Date } = {}
  ): Promise<PaginatedResponse<UserActivityLog>> {
    try {
      const queryParams = new URLSearchParams();
      if (options.page) queryParams.set('page', String(options.page));
      if (options.limit) queryParams.set('limit', String(options.limit));
      if (options.fromDate) queryParams.set('fromDate', options.fromDate.toISOString());
      if (options.toDate) queryParams.set('toDate', options.toDate.toISOString());

      const response = await apiClient.get<UserActivityLog[]>(
        `/users/${id}/activity?${queryParams.toString()}`
      );

      return response as PaginatedResponse<UserActivityLog>;
    } catch (error) {
      logger.error(`Failed to get activity log for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Activate user account
   */
  async activate(id: string): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiClient.post<UserProfile>(`/users/${id}/activate`, {});

      if (response.success && response.data) {
        // User activated successfully - apiClient handles caching automatically
        trackAuthEvent('user_activated', { userId: id });
      }

      return response;
    } catch (error) {
      logger.error(`Failed to activate user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivate(id: string): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiClient.post<UserProfile>(`/users/${id}/deactivate`, {});

      if (response.success && response.data) {
        // User deactivated successfully - apiClient handles caching automatically
        trackAuthEvent('user_deactivated', { userId: id });
      }

      return response;
    } catch (error) {
      logger.error(`Failed to deactivate user ${id}:`, error);
      throw error;
    }
  }

  // Cache methods removed - using apiClient built-in caching per CORE_REQUIREMENTS.md
}

// Export singleton instance
export const userEntity = UserEntity.getInstance();
