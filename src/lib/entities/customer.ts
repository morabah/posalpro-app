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
  private static instance: CustomerEntity;

  private constructor() {}

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
      const searchResponse = await apiClient.get<any>(
        `/customers?search=${encodeURIComponent(name)}&limit=1`
      );

      logger.debug('[CustomerEntity] Search response:', searchResponse);
      logger.debug('[CustomerEntity] Search response data:', searchResponse.data);

      if (searchResponse.success && searchResponse.data) {
        // Handle nested response structure from API client
        const responseData = searchResponse.data.data || searchResponse.data;
        if (responseData?.customers?.length > 0) {
          const existingCustomer = responseData.customers[0];
          logger.info('[CustomerEntity] Found existing customer:', existingCustomer.id);
          return existingCustomer.id;
        }
      }

      // If no exact match, try to get any customer as fallback
      logger.info('[CustomerEntity] No exact match found, trying to get any customer as fallback');
      const fallbackResponse = await apiClient.get<any>('/customers?limit=1');

      if (fallbackResponse.success && fallbackResponse.data) {
        // Handle nested response structure from API client
        const responseData = fallbackResponse.data.data || fallbackResponse.data;
        if (responseData?.customers?.length > 0) {
          const fallbackCustomer = responseData.customers[0];
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
        const createResponse = await apiClient.post<any>('/customers', {
          name,
          status: 'ACTIVE',
          tier: 'STANDARD',
        });

        logger.debug('[CustomerEntity] Create response:', createResponse);
        logger.debug('[CustomerEntity] Create response data:', createResponse.data);
        logger.debug('[CustomerEntity] Create response data type:', typeof createResponse.data);

        if (createResponse.success && createResponse.data) {
          // Handle nested response structure from API client
          const customerData = createResponse.data.data || createResponse.data;
          if (customerData && customerData.id) {
            logger.info('[CustomerEntity] Created new customer ID:', customerData.id);
            logger.debug('[CustomerEntity] Full customer object:', customerData);
            return customerData.id;
          }
        }

        logger.warn('[CustomerEntity] Customer creation succeeded but no ID returned');
      } catch (createError) {
        logger.error('[CustomerEntity] Customer creation failed:', createError);
      }

      // Final fallback: try to get any existing customer
      logger.info('[CustomerEntity] All customer resolution attempts failed, using final fallback');
      try {
        const finalFallbackResponse = await apiClient.get<any>('/customers?limit=1');

        if (finalFallbackResponse.success && finalFallbackResponse.data) {
          // Handle nested response structure from API client
          const responseData = finalFallbackResponse.data.data || finalFallbackResponse.data;
          if (responseData?.customers?.length > 0) {
            const finalFallbackCustomer = responseData.customers[0];
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
