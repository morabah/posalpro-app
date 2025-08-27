// User Service - New Architecture
import { ApiResponse } from '@/lib/api/response';
import { http } from '@/lib/http';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// Zod schemas for validation
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  department: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
  roles: z
    .array(
      z.object({
        role: z.object({
          name: z.string(),
        }),
      })
    )
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UserListSchema = z.object({
  users: z.array(UserSchema),
  pagination: z.object({
    hasNextPage: z.boolean(),
    nextCursor: z.string().nullable(),
    itemCount: z.number().optional(),
  }),
});

export const UserQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['name', 'email', 'department', 'createdAt', 'id']).default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  role: z.string().optional(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type UserList = z.infer<typeof UserListSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;

// Service class
export class UserService {
  private baseUrl = '/api/users';

  async getUsers(params: UserQuery): Promise<ApiResponse<UserList>> {
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
      'id,name,email,department,status,lastLogin,createdAt,updatedAt,roles'
    );

    logDebug('Fetching users', {
      component: 'UserService',
      operation: 'getUsers',
      params: validatedParams,
    });

    try {
      // The HTTP client automatically unwraps the data from the API response
      const response = await http.get<UserList>(`${this.baseUrl}?${searchParams.toString()}`);

      logInfo('Users fetched successfully', {
        component: 'UserService',
        operation: 'getUsers',
        count: response?.users?.length || 0,
      });

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to fetch users', {
        component: 'UserService',
        operation: 'getUsers',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
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

      logInfo('User fetched successfully', {
        component: 'UserService',
        operation: 'getUser',
        userId: id,
      });

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to fetch user', {
        component: 'UserService',
        operation: 'getUser',
        userId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
