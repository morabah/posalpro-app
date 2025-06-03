/**
 * Users API Endpoints
 * Type-safe user management operations with enhanced API client integration
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

// Mock data for development
const generateMockUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: `user-${Math.random().toString(36).substring(2)}`,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@posalpro.com',
  phone: '+1 (555) 123-4567',
  jobTitle: 'Senior Proposal Manager',
  department: 'Business Development',
  role: UserType.PROPOSAL_MANAGER,
  profileCompleteness: 85,
  isActive: true,
  emailVerified: true,
  phoneVerified: false,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-03-15'),
  ...overrides,
});

const generateMockUserList = (count: number = 10): UserProfile[] => {
  const roles = Object.values(UserType);
  const departments = ['Business Development', 'Marketing', 'Operations', 'Engineering', 'Sales'];
  const users: UserProfile[] = [];

  for (let i = 0; i < count; i++) {
    users.push(
      generateMockUser({
        id: `user-${i + 1}`,
        firstName: ['John', 'Jane', 'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank'][i % 8],
        lastName: ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Taylor'][
          i % 8
        ],
        email: `user${i + 1}@posalpro.com`,
        role: roles[i % roles.length],
        department: departments[i % departments.length],
        isActive: Math.random() > 0.1, // 90% active
        profileCompleteness: Math.floor(Math.random() * 40) + 60, // 60-100%
      })
    );
  }

  return users;
};

export const usersApi = {
  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<ApiResponse<UserProfile>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const newUser = generateMockUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        jobTitle: userData.jobTitle,
        department: userData.department,
        phone: userData.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        data: newUser,
        success: true,
        message: 'User created successfully',
      };
    }

    return apiClient.post<UserProfile>('/users', userData);
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<UserProfile>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));

      const user = generateMockUser({ id });
      return {
        data: user,
        success: true,
        message: 'User retrieved successfully',
      };
    }

    return apiClient.get<UserProfile>(`/users/${id}`);
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<ApiResponse<UserProfile>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 600));

      const user = generateMockUser({ email });
      return {
        data: user,
        success: true,
        message: 'User retrieved successfully',
      };
    }

    return apiClient.get<UserProfile>(`/users/email/${encodeURIComponent(email)}`);
  },

  /**
   * Update user
   */
  async updateUser(id: string, updateData: UpdateUserData): Promise<ApiResponse<UserProfile>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedUser = generateMockUser({
        ...updateData,
        id,
        updatedAt: new Date(),
      });

      return {
        data: updatedUser,
        success: true,
        message: 'User updated successfully',
      };
    }

    return apiClient.put<UserProfile>(`/users/${id}`, updateData);
  },

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 700));

      return {
        data: { message: 'User deleted successfully' },
        success: true,
        message: 'User deleted successfully',
      };
    }

    return apiClient.delete<{ message: string }>(`/users/${id}`);
  },

  /**
   * Query users with filtering and pagination
   */
  async queryUsers(options: UserQueryOptions = {}): Promise<PaginatedResponse<UserProfile>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 900));

      let users = generateMockUserList(50);

      // Apply filters
      if (options.search) {
        const search = options.search.toLowerCase();
        users = users.filter(
          user =>
            user.firstName.toLowerCase().includes(search) ||
            user.lastName.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search)
        );
      }

      if (options.department) {
        users = users.filter(user => user.department === options.department);
      }

      if (options.role) {
        users = users.filter(user => user.role === options.role);
      }

      if (options.isActive !== undefined) {
        users = users.filter(user => user.isActive === options.isActive);
      }

      // Apply sorting
      if (options.sortBy) {
        users.sort((a, b) => {
          let aVal: any, bVal: any;

          switch (options.sortBy) {
            case 'name':
              aVal = `${a.firstName} ${a.lastName}`;
              bVal = `${b.firstName} ${b.lastName}`;
              break;
            case 'email':
              aVal = a.email;
              bVal = b.email;
              break;
            case 'createdAt':
              aVal = a.createdAt.getTime();
              bVal = b.createdAt.getTime();
              break;
            case 'lastActivity':
              aVal = a.updatedAt.getTime();
              bVal = b.updatedAt.getTime();
              break;
            default:
              return 0;
          }

          if (options.sortOrder === 'desc') {
            return aVal < bVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      return {
        data: paginatedUsers,
        success: true,
        message: 'Users retrieved successfully',
        pagination: {
          page,
          limit,
          total: users.length,
          totalPages: Math.ceil(users.length / limit),
        },
      };
    }

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
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 400));

      const mockPermissions: UserPermissions = {
        userId: id,
        permissions: ['read', 'write', 'approve', 'manage_team'],
        roles: [UserType.PROPOSAL_MANAGER],
        inheritedPermissions: ['read', 'write'],
        effectivePermissions: ['read', 'write', 'approve', 'manage_team'],
      };

      return {
        data: mockPermissions,
        success: true,
        message: 'User permissions retrieved successfully',
      };
    }

    return apiClient.get<UserPermissions>(`/users/${id}/permissions`);
  },

  /**
   * Update user permissions
   */
  async updateUserPermissions(
    id: string,
    permissions: { roles?: UserType[]; permissions?: string[] }
  ): Promise<ApiResponse<UserPermissions>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedPermissions: UserPermissions = {
        userId: id,
        permissions: permissions.permissions || ['read', 'write'],
        roles: permissions.roles || [UserType.PROPOSAL_MANAGER],
        inheritedPermissions: ['read'],
        effectivePermissions: [...(permissions.permissions || []), 'read'],
      };

      return {
        data: updatedPermissions,
        success: true,
        message: 'User permissions updated successfully',
      };
    }

    return apiClient.put<UserPermissions>(`/users/${id}/permissions`, permissions);
  },

  /**
   * Get user activity log
   */
  async getUserActivityLog(
    id: string,
    options: { page?: number; limit?: number; fromDate?: Date; toDate?: Date } = {}
  ): Promise<PaginatedResponse<UserActivityLog>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 600));

      const mockActivities: UserActivityLog[] = Array.from({ length: 20 }, (_, i) => ({
        id: `activity-${i + 1}`,
        userId: id,
        action: ['login', 'logout', 'create_proposal', 'update_profile', 'view_dashboard'][i % 5],
        timestamp: new Date(Date.now() - i * 3600000), // Each hour back
        details: { page: '/dashboard', duration: Math.floor(Math.random() * 30) + 1 },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      }));

      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedActivities = mockActivities.slice(startIndex, endIndex);

      return {
        data: paginatedActivities,
        success: true,
        message: 'User activity retrieved successfully',
        pagination: {
          page,
          limit,
          total: mockActivities.length,
          totalPages: Math.ceil(mockActivities.length / limit),
        },
      };
    }

    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof Date) {
          queryParams.set(key, value.toISOString());
        } else {
          queryParams.set(key, String(value));
        }
      }
    });

    return apiClient.get<UserActivityLog[]>(
      `/users/${id}/activity?${queryParams.toString()}`
    ) as Promise<PaginatedResponse<UserActivityLog>>;
  },

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<ApiResponse<UserProfile>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));

      const user = generateMockUser({ id, isActive: true });
      return {
        data: user,
        success: true,
        message: 'User activated successfully',
      };
    }

    return apiClient.post<UserProfile>(`/users/${id}/activate`, {});
  },

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<ApiResponse<UserProfile>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));

      const user = generateMockUser({ id, isActive: false });
      return {
        data: user,
        success: true,
        message: 'User deactivated successfully',
      };
    }

    return apiClient.post<UserProfile>(`/users/${id}/deactivate`, {});
  },

  /**
   * Get users by department
   */
  async getUsersByDepartment(department: string): Promise<ApiResponse<UserProfile[]>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 700));

      const users = generateMockUserList(15).filter(user => user.department === department);
      return {
        data: users,
        success: true,
        message: 'Department users retrieved successfully',
      };
    }

    return apiClient.get<UserProfile[]>(`/users/department/${encodeURIComponent(department)}`);
  },

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserType): Promise<ApiResponse<UserProfile[]>> {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 600));

      const users = generateMockUserList(12).filter(user => user.role === role);
      return {
        data: users,
        success: true,
        message: 'Role users retrieved successfully',
      };
    }

    return apiClient.get<UserProfile[]>(`/users/role/${encodeURIComponent(role)}`);
  },
};
