// Service Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)
// User Story: __USER_STORY__ (e.g., US-1.1)
// Hypothesis: __HYPOTHESIS__ (e.g., H1)
//
// ✅ FOLLOWS: MIGRATION_LESSONS.md - Service layer patterns
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - HTTP client patterns
// ✅ ALIGNS: API route schemas for consistent data flow
// ✅ IMPLEMENTS: Modern architecture with proper separation of concerns

import { ApiResponse } from '@/lib/api/response';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { http } from '@/lib/http';
import { logDebug, logInfo } from '@/lib/logger';

// ====================
// Import consolidated schemas from features directory
// ====================

import {
  __ENTITY__CreateSchema,
  __ENTITY__QuerySchema,
  __ENTITY__UpdateSchema,
  type __ENTITY__,
  type __ENTITY__Create,
  type __ENTITY__List,
  type __ENTITY__Query,
  type __ENTITY__Update,
} from '@/features/__RESOURCE__/schemas';

// Re-export types for backward compatibility
export type {
  __ENTITY__,
  __ENTITY__Create,
  __ENTITY__List,
  __ENTITY__Query,
  __ENTITY__Update,
};

// Re-export schemas for API routes
export {
  __ENTITY__CreateSchema as Create__ENTITY__Schema,
  __ENTITY__QuerySchema as __ENTITY__QuerySchema,
  __ENTITY__UpdateSchema as Update__ENTITY__Schema,
};

// ====================
// TypeScript Types (using feature-based schemas)
// ====================

export type Create__ENTITY__Data = __ENTITY__Create;
export type Update__ENTITY__Data = __ENTITY__Update;

// ====================
// Service Class
// ====================

// TODO: Replace with singleton pattern if needed (like ProposalService)
// export class __ENTITY__Service {
//   private static instance: __ENTITY__Service | null = null;
//   private errorHandlingService = ErrorHandlingService.getInstance();
//
//   static getInstance(): __ENTITY__Service {
//     if (!__ENTITY__Service.instance) {
//       __ENTITY__Service.instance = new __ENTITY__Service();
//     }
//     return __ENTITY__Service.instance;
//   }
//
//   private constructor() {}
//
//   // ... rest of methods
// }

export class __ENTITY__Service {
  private baseUrl = '/api/__RESOURCE__';
  private errorHandlingService = ErrorHandlingService.getInstance();

  /**
   * Get list of entities with cursor pagination
   */
  async get__ENTITY__s(params: __ENTITY__Query): Promise<ApiResponse<__ENTITY__List>> {
    const validatedParams = __ENTITY__QuerySchema.parse(params);
    const searchParams = new URLSearchParams();

    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    logDebug('Fetching __RESOURCE__', {
      component: '__ENTITY__Service',
      operation: 'get__ENTITY__s',
      params: validatedParams,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await http.get<__ENTITY__List>(`${this.baseUrl}?${searchParams.toString()}`);

      logInfo('__RESOURCE__ fetched successfully', {
        component: '__ENTITY__Service',
        operation: 'get__ENTITY__s',
        count: response?.items?.length || 0,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return { ok: true, data: response };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch __RESOURCE__',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: '__ENTITY__Service',
          operation: 'get__ENTITY__s',
        }
      );
      throw processed;
    }
  }

  /**
   * Get single entity by ID
   */
  async get__ENTITY__(id: string): Promise<ApiResponse<__ENTITY__>> {
    logDebug('Fetching __RESOURCE__ by ID', {
      component: '__ENTITY__Service',
      operation: 'get__ENTITY__',
      __RESOURCE__Id: id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await http.get<__ENTITY__>(`${this.baseUrl}/${id}`);

      logInfo('__RESOURCE__ fetched successfully', {
        component: '__ENTITY__Service',
        operation: 'get__ENTITY__',
        __RESOURCE__Id: id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return { ok: true, data: response };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch __RESOURCE__',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: '__ENTITY__Service',
          operation: 'get__ENTITY__',
          __RESOURCE__Id: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Create new entity
   */
  async create__ENTITY__(data: Create__ENTITY__Data): Promise<ApiResponse<__ENTITY__>> {
    const validatedData = __ENTITY__CreateSchema.parse(data);

    logDebug('Creating __RESOURCE__', {
      component: '__ENTITY__Service',
      operation: 'create__ENTITY__',
      __RESOURCE__Data: validatedData,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await http.post<__ENTITY__>(this.baseUrl, validatedData);

      logInfo('__RESOURCE__ created successfully', {
        component: '__ENTITY__Service',
        operation: 'create__ENTITY__',
        __RESOURCE__Id: response?.id || 'unknown',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return { ok: true, data: response };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create __RESOURCE__',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: '__ENTITY__Service',
          operation: 'create__ENTITY__',
        }
      );
      throw processed;
    }
  }

  /**
   * Update existing entity
   */
  async update__ENTITY__(id: string, data: Update__ENTITY__Data): Promise<ApiResponse<__ENTITY__>> {
    const validatedData = __ENTITY__UpdateSchema.parse(data);

    logDebug('Updating __RESOURCE__', {
      component: '__ENTITY__Service',
      operation: 'update__ENTITY__',
      __RESOURCE__Id: id,
      __RESOURCE__Data: validatedData,
      dataKeys: Object.keys(validatedData),
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await http.patch<__ENTITY__>(`${this.baseUrl}/${id}`, validatedData);

      logInfo('__RESOURCE__ updated successfully', {
        component: '__ENTITY__Service',
        operation: 'update__ENTITY__',
        __RESOURCE__Id: id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return { ok: true, data: response };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update __RESOURCE__',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: '__ENTITY__Service',
          operation: 'update__ENTITY__',
          __RESOURCE__Id: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Delete entity
   */
  async delete__ENTITY__(id: string): Promise<ApiResponse<void>> {
    logDebug('Deleting __RESOURCE__', {
      component: '__ENTITY__Service',
      operation: 'delete__ENTITY__',
      __RESOURCE__Id: id,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await http.delete(`${this.baseUrl}/${id}`);

      logInfo('__RESOURCE__ deleted successfully', {
        component: '__ENTITY__Service',
        operation: 'delete__ENTITY__',
        __RESOURCE__Id: id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return { ok: true, data: undefined };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete __RESOURCE__',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: '__ENTITY__Service',
          operation: 'delete__ENTITY__',
          __RESOURCE__Id: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Bulk delete entities
   */
  async delete__ENTITY__sBulk(ids: string[]): Promise<ApiResponse<{ deleted: number }>> {
    logDebug('Bulk deleting __RESOURCE__', {
      component: '__ENTITY__Service',
      operation: 'delete__ENTITY__sBulk',
      __RESOURCE__Ids: ids,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await http.post<{ deleted: number }>(
        `${this.baseUrl}/bulk-delete`,
        { ids }
      );

      logInfo('__RESOURCE__ bulk deleted successfully', {
        component: '__ENTITY__Service',
        operation: 'delete__ENTITY__sBulk',
        deletedCount: response?.deleted || 0,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return { ok: true, data: response };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to bulk delete __RESOURCE__',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: '__ENTITY__Service',
          operation: 'delete__ENTITY__sBulk',
        }
      );
      throw processed;
    }
  }

  /**
   * Search entities with advanced filtering
   */
  async search__ENTITY__s(query: string, limit: number = 10): Promise<ApiResponse<__ENTITY__[]>> {
    logDebug('Searching __RESOURCE__', {
      component: '__ENTITY__Service',
      operation: 'search__ENTITY__s',
      query,
      limit,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await http.get<__ENTITY__[]>(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      logInfo('__RESOURCE__ search completed', {
        component: '__ENTITY__Service',
        operation: 'search__ENTITY__s',
        query,
        resultCount: response?.length || 0,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return { ok: true, data: response };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to search __RESOURCE__',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: '__ENTITY__Service',
          operation: 'search__ENTITY__s',
          query,
        }
      );
      throw processed;
    }
  }

  /**
   * Get entity statistics/dashboard data
   */
  async get__ENTITY__Stats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    // Add entity-specific stats
  }>> {
    logDebug('Fetching __RESOURCE__ statistics', {
      component: '__ENTITY__Service',
      operation: 'get__ENTITY__Stats',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    try {
      const response = await http.get<{
        total: number;
        active: number;
        inactive: number;
      }>(`${this.baseUrl}/stats`);

      logInfo('__RESOURCE__ statistics fetched successfully', {
        component: '__ENTITY__Service',
        operation: 'get__ENTITY__Stats',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      return { ok: true, data: response };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch __RESOURCE__ statistics',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: '__ENTITY__Service',
          operation: 'get__ENTITY__Stats',
        }
      );
      throw processed;
    }
  }

  // Static schema properties for API routes
  static __ENTITY__QuerySchema = __ENTITY__QuerySchema;
  static __ENTITY__CreateSchema = __ENTITY__CreateSchema;
  static __ENTITY__UpdateSchema = __ENTITY__UpdateSchema;
}

// ====================
// Export Default Instance
// ====================

// TODO: Use singleton pattern for services that need it (like ProposalService)
// export const __RESOURCE__Service = __ENTITY__Service.getInstance();

export const __RESOURCE__Service = new __ENTITY__Service();
export default __RESOURCE__Service;
