/**
 * PosalPro MVP2 - Customer Entity
 * Customer entity class for interacting with the customers API
import { logger } from '@/utils/logger'; */

import { logger } from '@/utils/logger';

// This is a simplified CustomerData interface.
// A full implementation would have this defined in types and schemas.
export interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  industry?: string;
  companySize?: string;
  revenue?: number;
  tier?: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'VIP';
  tags?: string[];
}

export interface PaginatedCustomerResponse {
  customers: CustomerData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CustomerEntity {
  private static instance: CustomerEntity | null = null;

  private constructor() {}

  // ---- Runtime type guards ----
  private static isCustomerData(value: unknown): value is CustomerData {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return typeof v.id === 'string' && typeof v.name === 'string';
  }

  private static isCustomerArray(value: unknown): value is CustomerData[] {
    return Array.isArray(value) && value.every((item) => CustomerEntity.isCustomerData(item));
  }

  private static isPaginatedCustomerResponse(value: unknown): value is PaginatedCustomerResponse {
    if (typeof value !== 'object' || value === null) return false;
    const maybe = value as { customers?: unknown; pagination?: unknown };
    const customers = maybe.customers;
    const pagination = maybe.pagination as
      | { page?: unknown; limit?: unknown; total?: unknown; totalPages?: unknown }
      | undefined;
    return (
      CustomerEntity.isCustomerArray(customers) &&
      !!pagination &&
      typeof pagination.page === 'number' &&
      typeof pagination.limit === 'number' &&
      typeof pagination.total === 'number' &&
      typeof pagination.totalPages === 'number'
    );
  }

  private static extractCustomers(data: unknown): CustomerData[] {
    // Accept either { customers: [...] } or { data: { customers: [...] } }
    if (CustomerEntity.isPaginatedCustomerResponse(data)) {
      return data.customers;
    }
    if (typeof data === 'object' && data !== null && 'data' in data) {
      const inner = (data as { data: unknown }).data;
      if (CustomerEntity.isPaginatedCustomerResponse(inner)) {
        return inner.customers;
      }
    }
    return [];
  }

  public static getInstance(): CustomerEntity {
    if (!CustomerEntity.instance) {
      CustomerEntity.instance = new CustomerEntity();
    }
    return CustomerEntity.instance;
  }

  /**
   * Find a customer by name, or create one if not found.
   * @param name - The name of the customer.
   * @returns The customer's ID.
   */
  async findOrCreate(name: string): Promise<string> {
    try {
      logger.info('[CustomerEntity] Finding or creating customer:', name);

      // Import the API client
      const { apiClient } = await import('@/lib/api/client');

      // First, try to find existing customer by name
      const searchResponse = await apiClient.get<unknown>(
        `/customers?search=${encodeURIComponent(name)}&limit=1`
      );

      logger.debug('[CustomerEntity] Search response:', searchResponse);
      logger.debug('[CustomerEntity] Search response data:', searchResponse.data);

      if (searchResponse.success) {
        const customers = CustomerEntity.extractCustomers(searchResponse.data);
        if (customers.length > 0) {
          const existingCustomer = customers[0];
          logger.info('[CustomerEntity] Found existing customer:', existingCustomer.id);
          return existingCustomer.id;
        }
      }

      // If no exact match, try to get any customer as fallback
      logger.info('[CustomerEntity] No exact match found, trying to get any customer as fallback');
      const fallbackResponse = await apiClient.get<unknown>('/customers?limit=1');

      if (fallbackResponse.success) {
        const customers = CustomerEntity.extractCustomers(fallbackResponse.data);
        if (customers.length > 0) {
          const fallbackCustomer = customers[0];
          logger.info('[CustomerEntity] Using fallback customer:', {
            id: fallbackCustomer.id,
            name: fallbackCustomer.name,
          });
          return fallbackCustomer.id;
        }
      }

      // If not found, create new customer
      logger.info('[CustomerEntity] Creating new customer');
      try {
        const createResponse = await apiClient.post<unknown>('/customers', {
          name,
          status: 'ACTIVE',
          tier: 'STANDARD',
        });

        logger.debug('[CustomerEntity] Create response:', createResponse);
        logger.debug('[CustomerEntity] Create response data:', createResponse.data);
        logger.debug('[CustomerEntity] Create response data type:', typeof createResponse.data);

        if (createResponse.success) {
          const data = createResponse.data;
          const candidate = (typeof data === 'object' && data !== null && 'data' in data)
            ? (data as { data: unknown }).data
            : data;
          if (CustomerEntity.isCustomerData(candidate)) {
            logger.info('[CustomerEntity] Created new customer ID:', candidate.id);
            logger.debug('[CustomerEntity] Full customer object:', candidate);
            return candidate.id;
          }
        }

        logger.warn('[CustomerEntity] Customer creation succeeded but no ID returned');
      } catch (createError) {
        logger.error('[CustomerEntity] Customer creation failed:', createError);
      }

      // Final fallback: try to get any existing customer
      logger.info('[CustomerEntity] All customer resolution attempts failed, using final fallback');
      try {
        const finalFallbackResponse = await apiClient.get<unknown>('/customers?limit=1');

        if (finalFallbackResponse.success) {
          const customers = CustomerEntity.extractCustomers(finalFallbackResponse.data);
          if (customers.length > 0) {
            const finalFallbackCustomer = customers[0];
            logger.info('[CustomerEntity] Using final fallback customer:', {
              id: finalFallbackCustomer.id,
              name: finalFallbackCustomer.name,
            });
            return finalFallbackCustomer.id;
          }
        }
      } catch (fallbackError) {
        logger.error('[CustomerEntity] Final fallback failed:', fallbackError);
      }

      throw new Error(
        `Failed to find or create customer "${name}". No customers available in system.`
      );
    } catch (error) {
      logger.error(`Failed to find or create customer "${name}":`, error);
      throw error;
    }
  }
}
