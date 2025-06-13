/**
 * PosalPro MVP2 - Customer Entity
 * Customer entity class for interacting with the customers API
 */

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
      // Mock implementation for development
      console.log('[CustomerEntity] Using mock implementation for findOrCreate');

      // Return a mock customer ID
      const mockCustomerId = 'mock-customer-' + Date.now();
      console.log('[CustomerEntity] Created mock customer:', { id: mockCustomerId, name });
      return mockCustomerId;
    } catch (error) {
      console.error(`Failed to find or create customer "${name}":`, error);
      throw error;
    }
  }
}
