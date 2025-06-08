/**
 * PosalPro MVP2 - Customer Entity
 * Customer entity class for interacting with the customers API
 */

import { apiClient } from '@/lib/api/client';

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
      // 1. Search for the customer by name
      const searchResponse = await apiClient.get<PaginatedCustomerResponse>(
        `/api/customers?search=${encodeURIComponent(name)}&limit=5`
      );

      if (searchResponse.success && searchResponse.data?.customers.length > 0) {
        // Find an exact match if multiple results are returned
        const exactMatch = searchResponse.data.customers.find((c: CustomerData) => c.name === name);
        if (exactMatch) {
          return exactMatch.id;
        }
      }

      // 2. If not found, create a new customer
      const createResponse = await apiClient.post<CustomerData>('/api/customers', { name });

      if (createResponse.success && createResponse.data) {
        return createResponse.data.id;
      }

      throw new Error('Failed to create or find customer.');
    } catch (error) {
      console.error(`Failed to find or create customer "${name}":`, error);
      // For now, let's rethrow. In a real app, might have more robust error handling.
      throw error;
    }
  }
}
