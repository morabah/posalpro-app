// Service Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)

import { http } from '@/lib/http';
import { z } from 'zod';

// Import domain schemas/types from feature module (MANDATORY)
// TODO: Replace __RESOURCE__ and exported identifiers with actual names
// import {
//   __ENTITY__Schema,
//   __ENTITY__ListSchema,
//   create__ENTITY__Schema,
//   update__ENTITY__Schema,
//   __ENTITY__QuerySchema,
//   type __ENTITY__,
//   type __ENTITY__List,
//   type Create__ENTITY__Data,
//   type Update__ENTITY__Data,
// } from '@/features/__RESOURCE__/schemas';

// Fallback type placeholders (remove once feature schemas are in place)
export type __ENTITY__ = any;
export type __ENTITY__List = { items: __ENTITY__[]; nextCursor: string | null };
export type Create__ENTITY__Data = Record<string, unknown>;
export type Update__ENTITY__Data = Partial<Create__ENTITY__Data>;
export type __ENTITY__Query = Partial<{
  search: string;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  cursor: string;
}>;

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

    return http<__ENTITY__List>(`/api/__RESOURCE__?${searchParams.toString()}`);
  },

  /**
   * Get single entity by ID
   */
  async get__ENTITY__(id: string): Promise<__ENTITY__> {
    return http<__ENTITY__>(`/api/__RESOURCE__/${id}`);
  },

  /**
   * Create new entity
   */
  async create__ENTITY__(data: Create__ENTITY__Data): Promise<__ENTITY__> {
    return http<__ENTITY__>('/api/__RESOURCE__', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing entity
   */
  async update__ENTITY__(id: string, data: Update__ENTITY__Data): Promise<__ENTITY__> {
    return http<__ENTITY__>(`/api/__RESOURCE__/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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
    return http<{ deleted: number }>('/api/__RESOURCE__/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
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
    return http<any>('/api/__RESOURCE__/stats');
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

    return http<__ENTITY__[]>(`/api/__RESOURCE__/search?${searchParams.toString()}`);
  },
};

// ====================
// Export Default
// ====================

export default __ENTITY__Service;
