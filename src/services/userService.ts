// User Service - Using Consolidated Schemas
import { ApiResponse } from '@/lib/api/response';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { http } from '@/lib/http';
import { logDebug, logInfo } from '@/lib/logger';

// Import consolidated user schemas
import {
  userEntitySchema,
  createUserSchema,
  updateUserSchema,
  userSearchSchema,
  type UserEntity,
  type CreateUserData,
  type UpdateUserData,
  type UserSearchCriteria,
} from '@/lib/validation/schemas/user';
import { UserType } from '@/types';

// Type definitions for user data transformation
interface RawUserData {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  roles?: (string | { role: string; assignedAt?: Date; assignedBy?: string })[];
  createdAt?: Date;
  [key: string]: unknown;
}

interface RoleEntry {
  role: string;
  assignedAt?: Date;
  assignedBy?: string;
}

// Re-export types for backward compatibility
export type User = UserEntity;
export type UserCreate = CreateUserData;
export type UserUpdate = UpdateUserData;
export type UserQuery = UserSearchCriteria;

// Create user list schema for API responses
import { z } from 'zod';
export const UserListSchema = z.object({
  users: z.array(userEntitySchema),
  pagination: z.object({
    hasNextPage: z.boolean(),
    nextCursor: z.string().nullable(),
    itemCount: z.number().optional(),
  }),
});

export type UserList = z.infer<typeof UserListSchema>;

// Create user query schema for API requests (based on the transformed schema)
export const UserQuerySchema = z.object({
  query: z.string().optional(),
  search: z.string().optional(),
  role: z.array(z.nativeEnum(UserType)).optional(),
  department: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  expertise: z.array(z.string()).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['name', 'email', 'department', 'createdAt', 'id']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
}).transform((data) => ({
  ...data,
  query: data.query || data.search || undefined,
}));

// Type for component usage (before transformation)
export type UserQueryParams = {
  query?: string;
  search?: string;
  role?: UserType[];
  department?: string[];
  isActive?: boolean;
  expertise?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  cursor?: string | null;
  sortBy?: 'name' | 'email' | 'department' | 'createdAt' | 'id';
  sortOrder?: 'asc' | 'desc';
};

// Service class
export class UserService {
  private baseUrl = '/api/users';
  private errorHandlingService = ErrorHandlingService.getInstance();

  /**
   * Transform user data to ensure consistent structure for components
   * This handles schema evolution and provides backward compatibility
   */
  private transformUserForComponent(user: RawUserData): UserEntity {
    // Ensure name field exists (computed from firstName + lastName)
    if (!user.name && (user.firstName || user.lastName)) {
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }

    // Ensure roles array exists and has proper structure
    if (!user.roles) {
      user.roles = [];
      // If user has a single role, convert it to roles array
      if (user.role) {
        user.roles = [{
          role: user.role,
          assignedAt: user.createdAt || new Date(),
          assignedBy: undefined,
        }];
      }
    }

    // Ensure roles is always an array with proper structure
    if (Array.isArray(user.roles)) {
      user.roles = user.roles.map((roleEntry: string | RoleEntry): RoleEntry => {
        if (typeof roleEntry === 'string') {
          // Convert simple role string to role object
          return {
            role: roleEntry,
            assignedAt: user.createdAt || new Date(),
            assignedBy: undefined,
          };
        }
        return roleEntry as RoleEntry;
      });
    }

    return user as UserEntity;
  }

  async getUsers(params: UserQueryParams): Promise<ApiResponse<UserList>> {
    const validatedParams = UserQuerySchema.parse(params);
    const searchParams = new URLSearchParams();

    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    // Add roles field to get user roles for team assignment
    searchParams.append(
      'fields',
      'id,firstName,lastName,name,email,department,status,lastLogin,createdAt,updatedAt,role,roles'
    );

    logDebug('Fetching users', {
      component: 'UserService',
      operation: 'getUsers',
      params: validatedParams,
    });

    try {
      // The HTTP client automatically unwraps the data from the API response
      const response = await http.get<UserList>(`${this.baseUrl}?${searchParams.toString()}`);

      // Transform users to ensure consistent structure
      const transformedUsers = response.users.map(user => this.transformUserForComponent(user));

      const transformedResponse = {
        ...response,
        users: transformedUsers,
      };

      logInfo('Users fetched successfully', {
        component: 'UserService',
        operation: 'getUsers',
        count: transformedResponse.users?.length || 0,
      });

      return { ok: true, data: transformedResponse };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch users',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'UserService',
          operation: 'getUsers',
        }
      );
      return { ok: false, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    logDebug('Fetching user', {
      component: 'UserService',
      operation: 'getUser',
      userId: id,
    });

    try {
      const response = await http.get<User>(`${this.baseUrl}/${id}`);

      // Transform user to ensure consistent structure
      const transformedUser = this.transformUserForComponent(response);

      logInfo('User fetched successfully', {
        component: 'UserService',
        operation: 'getUser',
        userId: id,
      });

      return { ok: true, data: transformedUser };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch user',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'UserService',
          operation: 'getUser',
          userId: id,
        }
      );
      return { ok: false, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }
}

// Export singleton instance
export const userService = new UserService();
