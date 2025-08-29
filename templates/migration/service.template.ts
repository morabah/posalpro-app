// Service Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)

import { http } from '@/lib/http';
import { z } from 'zod';

// ====================
// Zod Schemas
// ====================

export const __ENTITY__Schema = z.object({
  id: z.string(),
  // Add entity-specific fields here
  // Example for Customer:
  // name: z.string().min(1, 'Name is required'),
  // email: z.string().email('Invalid email format'),
  // phone: z.string().optional(),
  // status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
  // createdAt: z.string().datetime(),
  // updatedAt: z.string().datetime(),
});

export const __ENTITY__ListSchema = z.object({
  items: z.array(__ENTITY__Schema),
  nextCursor: z.string().nullable(),
});

export const create__ENTITY__Schema = z.object({
  // Add entity-specific fields here
  // Example for Customer:
  // name: z.string().min(1, 'Name is required'),
  // email: z.string().email('Invalid email format'),
  // phone: z.string().optional(),
});

export const update__ENTITY__Schema = create__ENTITY__Schema.partial();

export const __ENTITY__QuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  cursor: z.string().optional(),
});

// ====================
// TypeScript Types
// ====================

export type __ENTITY__ = z.infer<typeof __ENTITY__Schema>;
export type __ENTITY__List = z.infer<typeof __ENTITY__ListSchema>;
export type Create__ENTITY__Data = z.infer<typeof create__ENTITY__Schema>;
export type Update__ENTITY__Data = z.infer<typeof update__ENTITY__Schema>;
export type __ENTITY__Query = z.infer<typeof __ENTITY__QuerySchema>;

// ====================
// Service Functions
// ====================

export const __ENTITY__Service = {
  /**
   * Get list of entities with cursor pagination
   */
  async get__ENTITY__s(params: __ENTITY__Query = {}): Promise<__ENTITY__List> {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.append('search', params.search);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.cursor) searchParams.append('cursor', params.cursor);

    const response = await http<{ ok: true; data: __ENTITY__List }>(
      `/api/__RESOURCE__?${searchParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get single entity by ID
   */
  async get__ENTITY__(id: string): Promise<__ENTITY__> {
    const response = await http<{ ok: true; data: __ENTITY__ }>(`/api/__RESOURCE__/${id}`);
    return response.data;
  },

  /**
   * Create new entity
   */
  async create__ENTITY__(data: Create__ENTITY__Data): Promise<__ENTITY__> {
    const response = await http<{ ok: true; data: __ENTITY__ }>('/api/__RESOURCE__', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Update existing entity
   */
  async update__ENTITY__(id: string, data: Update__ENTITY__Data): Promise<__ENTITY__> {
    const response = await http<{ ok: true; data: __ENTITY__ }>(`/api/__RESOURCE__/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Delete entity
   */
  async delete__ENTITY__(id: string): Promise<void> {
    await http(`/api/__RESOURCE__/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Bulk delete entities
   */
  async delete__ENTITY__sBulk(ids: string[]): Promise<{ deleted: number }> {
    const response = await http<{ ok: true; data: { deleted: number } }>(
      '/api/__RESOURCE__/bulk-delete',
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }
    );
    return response.data;
  },

  /**
   * Get entity statistics/dashboard data
   */
  async get__ENTITY__Stats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    // Add entity-specific stats
  }> {
    const response = await http<{ ok: true; data: any }>('/api/__RESOURCE__/stats');
    return response.data;
  },

  /**
   * Search entities with advanced filtering
   */
  async search__ENTITY__s(query: string, filters?: Record<string, any>): Promise<__ENTITY__[]> {
    const searchParams = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await http<{ ok: true; data: __ENTITY__[] }>(
      `/api/__RESOURCE__/search?${searchParams.toString()}`
    );
    return response.data;
  },
};

// ====================
// Export Default
// ====================

export default __ENTITY__Service;
