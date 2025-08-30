// __FILE_DESCRIPTION__: Service class aligned with ApiResponse pattern (like proposals)
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import { http } from '@/lib/http';
import { ApiResponse, ok } from '@/lib/api/response';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { ErrorHandlingService, ErrorCodes } from '@/lib/errors';

export class __SERVICE_NAME__Service {
  private static instance: __SERVICE_NAME__Service | null = null;
  private errorHandlingService = ErrorHandlingService.getInstance();

  static getInstance(): __SERVICE_NAME__Service {
    if (!__SERVICE_NAME__Service.instance) {
      __SERVICE_NAME__Service.instance = new __SERVICE_NAME__Service();
    }
    return __SERVICE_NAME__Service.instance;
  }

  private constructor() {}

  // List (cursor pagination)
  async getList(
    params: { search?: string; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'; cursor?: string | null } = {}
  ): Promise<ApiResponse<{ items: any[]; nextCursor: string | null }>> {
    const start = performance.now();
    logDebug('Service: getList start', { component: '__SERVICE_NAME__Service', params });
    try {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      if (params.cursor) searchParams.set('cursor', params.cursor);

      const data = await http<{ items: any[]; nextCursor: string | null }>(
        `/api/__ROUTE_RESOURCE__?${searchParams.toString()}`
      );

      logInfo('Service: getList success', {
        component: '__SERVICE_NAME__Service',
        loadTime: performance.now() - start,
        count: data.items?.length ?? 0,
      });
      return ok(data);
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch list',
        ErrorCodes.API.NETWORK_ERROR,
        { context: '__SERVICE_NAME__Service.getList' }
      );
      logError('Service: getList failed', processed, { component: '__SERVICE_NAME__Service' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  // Get by id
  async getById(id: string): Promise<ApiResponse<any>> {
    const start = performance.now();
    logDebug('Service: getById start', { component: '__SERVICE_NAME__Service', id });
    try {
      const data = await http<any>(`/api/__ROUTE_RESOURCE__/${id}`);
      logInfo('Service: getById success', { component: '__SERVICE_NAME__Service', loadTime: performance.now() - start });
      return ok(data);
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch item',
        ErrorCodes.API.NETWORK_ERROR,
        { context: '__SERVICE_NAME__Service.getById', id }
      );
      logError('Service: getById failed', processed, { component: '__SERVICE_NAME__Service' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  // Create
  async create(payload: any): Promise<ApiResponse<any>> {
    const start = performance.now();
    logDebug('Service: create start', { component: '__SERVICE_NAME__Service' });
    try {
      const data = await http<any>(`/api/__ROUTE_RESOURCE__`, { method: 'POST', body: JSON.stringify(payload) });
      logInfo('Service: create success', { component: '__SERVICE_NAME__Service', id: (data as any).id, loadTime: performance.now() - start });
      return ok(data);
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create item',
        ErrorCodes.API.NETWORK_ERROR,
        { context: '__SERVICE_NAME__Service.create' }
      );
      logError('Service: create failed', processed, { component: '__SERVICE_NAME__Service' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  // Update
  async update(id: string, payload: any): Promise<ApiResponse<any>> {
    const start = performance.now();
    logDebug('Service: update start', { component: '__SERVICE_NAME__Service', id });
    try {
      const data = await http<any>(`/api/__ROUTE_RESOURCE__/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      logInfo('Service: update success', { component: '__SERVICE_NAME__Service', id, loadTime: performance.now() - start });
      return ok(data);
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update item',
        ErrorCodes.API.NETWORK_ERROR,
        { context: '__SERVICE_NAME__Service.update', id }
      );
      logError('Service: update failed', processed, { component: '__SERVICE_NAME__Service' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }

  // Delete
  async remove(id: string): Promise<ApiResponse<null>> {
    const start = performance.now();
    logDebug('Service: delete start', { component: '__SERVICE_NAME__Service', id });
    try {
      await http<null>(`/api/__ROUTE_RESOURCE__/${id}`, { method: 'DELETE' });
      logInfo('Service: delete success', { component: '__SERVICE_NAME__Service', id, loadTime: performance.now() - start });
      return ok(null);
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete item',
        ErrorCodes.API.NETWORK_ERROR,
        { context: '__SERVICE_NAME__Service.remove', id }
      );
      logError('Service: delete failed', processed, { component: '__SERVICE_NAME__Service' });
      return { ok: false as const, code: processed.code || 'UNKNOWN_ERROR', message: processed.message };
    }
  }
}

// Singleton instance export (follow proposals pattern)
export const __SERVICE_INSTANCE__ = __SERVICE_NAME__Service.getInstance();
