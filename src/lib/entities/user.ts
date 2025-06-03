/**
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
  details?: Record<string, any>;
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

/**
 * User Entity Class
 * Provides comprehensive user management with CRUD operations
 */
export class UserEntity {
  private static instance: UserEntity;
  private cache = new Map<string, UserProfile>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
        // Cache the new user
        this.setCache(response.data.id, response.data);

        // Track user creation event
        trackAuthEvent('user_created', {
          userId: response.data.id,
          role: response.data.role,
          department: response.data.department,
        });
      }

      return response;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<ApiResponse<UserProfile | null>> {
    try {
      // Check cache first
      const cached = this.getFromCache(id);
      if (cached) {
        return {
          data: cached,
          success: true,
          message: 'User retrieved from cache',
        };
      }

      // Fetch from API
      const response = await apiClient.get<UserProfile>(`/users/${id}`);

      if (response.success && response.data) {
        this.setCache(id, response.data);
      }

      return response;
    } catch (error) {
      console.error(`Failed to find user ${id}:`, error);
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
        this.setCache(response.data.id, response.data);
      }

      return response;
    } catch (error) {
      console.error(`Failed to find user by email ${email}:`, error);
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
        // Update cache
        this.setCache(id, response.data);

        // Track user update event
        trackAuthEvent('user_updated', {
          userId: id,
          updatedFields: Object.keys(updateData),
        });
      }

      return response;
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
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
        // Remove from cache
        this.cache.delete(id);
        this.cacheExpiry.delete(id);

        // Track user deletion event
        trackAuthEvent('user_deleted', { userId: id });
      }

      return response;
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Query users with filtering and pagination
   */
  async query(options: UserQueryOptions = {}): Promise<PaginatedResponse<UserProfile>> {
    try {
      const queryParams = new URLSearchParams();

      if (options.search) queryParams.set('search', options.search);
      if (options.department) queryParams.set('department', options.department);
      if (options.role) queryParams.set('role', options.role);
      if (options.isActive !== undefined) queryParams.set('isActive', String(options.isActive));
      if (options.page) queryParams.set('page', String(options.page));
      if (options.limit) queryParams.set('limit', String(options.limit));
      if (options.sortBy) queryParams.set('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.set('sortOrder', options.sortOrder);

      const response = await apiClient.get<UserProfile[]>(`/users?${queryParams.toString()}`);

      // Cache results
      if (response.success && response.data) {
        response.data.forEach(user => this.setCache(user.id, user));
      }

      return response as PaginatedResponse<UserProfile>;
    } catch (error) {
      console.error('Failed to query users:', error);
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
      console.error(`Failed to get permissions for user ${id}:`, error);
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
      console.error(`Failed to update permissions for user ${id}:`, error);
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
      console.error(`Failed to get activity log for user ${id}:`, error);
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
        this.setCache(id, response.data);
        trackAuthEvent('user_activated', { userId: id });
      }

      return response;
    } catch (error) {
      console.error(`Failed to activate user ${id}:`, error);
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
        this.setCache(id, response.data);
        trackAuthEvent('user_deactivated', { userId: id });
      }

      return response;
    } catch (error) {
      console.error(`Failed to deactivate user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Clear user cache
   */
  clearCache(id?: string): void {
    if (id) {
      this.cache.delete(id);
      this.cacheExpiry.delete(id);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  // Private cache methods
  private getFromCache(id: string): UserProfile | null {
    const expiry = this.cacheExpiry.get(id);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(id);
      this.cacheExpiry.delete(id);
      return null;
    }
    return this.cache.get(id) || null;
  }

  private setCache(id: string, user: UserProfile): void {
    this.cache.set(id, user);
    this.cacheExpiry.set(id, Date.now() + this.CACHE_TTL);
  }
}

// Export singleton instance
export const userEntity = UserEntity.getInstance();
