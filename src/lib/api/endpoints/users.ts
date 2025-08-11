/**
 * Users API Endpoints
 * Type-safe user management operations with live API integration
 */

import type {
  CreateUserData,
  UpdateUserData,
  UserActivityLog,
  UserPermissions,
  UserProfile,
  UserQueryOptions,
} from '@/lib/entities/user';
import { UserType } from '@/types/enums';
import { apiClient, type ApiResponse, type PaginatedResponse } from '../client';

export const usersApi = {
  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<ApiResponse<UserProfile>> {
    return apiClient.post<UserProfile>('/users', userData);
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>(`/users/${id}`);
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>(`/users/email/${encodeURIComponent(email)}`);
  },

  /**
   * Update user
   */
  async updateUser(id: string, updateData: UpdateUserData): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<UserProfile>(`/users/${id}`, updateData);
  },

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/users/${id}`);
  },

  /**
   * Query users with filtering and pagination
   */
  async queryUsers(options: UserQueryOptions = {}): Promise<PaginatedResponse<UserProfile>> {
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.set(key, String(value));
      }
    });

    return apiClient.get<UserProfile[]>(`/users?${queryParams.toString()}`) as Promise<
      PaginatedResponse<UserProfile>
    >;
  },

  /**
   * Get user permissions
   */
  async getUserPermissions(id: string): Promise<ApiResponse<UserPermissions>> {
    return apiClient.get<UserPermissions>(`/users/${id}/permissions`);
  },

  /**
   * Update user permissions
   */
  async updateUserPermissions(
    id: string,
    permissions: { roles?: UserType[]; permissions?: string[] }
  ): Promise<ApiResponse<UserPermissions>> {
    return apiClient.put<UserPermissions>(`/users/${id}/permissions`, permissions);
  },

  /**
   * Get user activity log
   */
  async getUserActivityLog(
    id: string,
    options: { page?: number; limit?: number; fromDate?: Date; toDate?: Date } = {}
  ): Promise<PaginatedResponse<UserActivityLog>> {
    const queryParams = new URLSearchParams();
    for (const key of Object.keys(options) as Array<keyof typeof options>) {
      const value = options[key];
      if (value === undefined) continue;
      if (key === 'fromDate' || key === 'toDate') {
        queryParams.set(key, (value as Date).toISOString());
      } else {
        queryParams.set(key as string, String(value));
      }
    }

    return apiClient.get<UserActivityLog[]>(
      `/users/${id}/activity?${queryParams.toString()}`
    ) as Promise<PaginatedResponse<UserActivityLog>>;
  },

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<ApiResponse<UserProfile>> {
    return apiClient.post<UserProfile>(`/users/${id}/activate`, {});
  },

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<ApiResponse<UserProfile>> {
    return apiClient.post<UserProfile>(`/users/${id}/deactivate`, {});
  },

  /**
   * Get users by department
   */
  async getUsersByDepartment(department: string): Promise<ApiResponse<UserProfile[]>> {
    return apiClient.get<UserProfile[]>(`/users/department/${encodeURIComponent(department)}`);
  },

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserType): Promise<ApiResponse<UserProfile[]>> {
    // Endpoint may return either an array or an object with `users`
    type RoleUsersPayload = UserProfile[] | { users: UserProfile[] } | { data: UserProfile[] };
    const response = await apiClient.get<RoleUsersPayload>(
      `/users?role=${encodeURIComponent(role)}`
    );

    if (!response.success) {
      return { data: [], success: false, message: 'Failed to retrieve users by role' };
    }

    const raw = response.data;
    const users: UserProfile[] = Array.isArray(raw)
      ? raw
      : 'users' in raw
      ? raw.users
      : 'data' in raw
      ? raw.data
      : [];

    return {
      data: users,
      success: true,
      message: response.message || 'Role users retrieved successfully',
    };
  },
};
