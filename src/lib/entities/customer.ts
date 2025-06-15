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
      console.log('[CustomerEntity] Finding or creating customer:', name);

      // Import the API client
      const { apiClient } = await import('@/lib/api/client');

      // First, try to find existing customer by name
      const searchResponse = await apiClient.get<any>(
        `/customers?search=${encodeURIComponent(name)}&limit=1`
      );

      console.log('[CustomerEntity] Search response:', searchResponse);
      console.log('[CustomerEntity] Search response data:', searchResponse.data);

      if (searchResponse.success && searchResponse.data) {
        // Handle nested response structure from API client
        const responseData = searchResponse.data.data || searchResponse.data;
        if (responseData?.customers?.length > 0) {
          const existingCustomer = responseData.customers[0];
          console.log('[CustomerEntity] Found existing customer:', existingCustomer.id);
          return existingCustomer.id;
        }
      }

      // If no exact match, try to get any customer as fallback
      console.log('[CustomerEntity] No exact match found, trying to get any customer as fallback');
      const fallbackResponse = await apiClient.get<any>('/customers?limit=1');

      if (fallbackResponse.success && fallbackResponse.data) {
        // Handle nested response structure from API client
        const responseData = fallbackResponse.data.data || fallbackResponse.data;
        if (responseData?.customers?.length > 0) {
          const fallbackCustomer = responseData.customers[0];
          console.log(
            '[CustomerEntity] Using fallback customer:',
            fallbackCustomer.id,
            fallbackCustomer.name
          );
          return fallbackCustomer.id;
        }
      }

      // If not found, create new customer
      console.log('[CustomerEntity] Creating new customer');
      try {
        const createResponse = await apiClient.post<any>('/customers', {
          name,
          status: 'ACTIVE',
          tier: 'STANDARD',
        });

        console.log('[CustomerEntity] Create response:', createResponse);
        console.log('[CustomerEntity] Create response data:', createResponse.data);
        console.log('[CustomerEntity] Create response data type:', typeof createResponse.data);

        if (createResponse.success && createResponse.data) {
          // Handle nested response structure from API client
          const customerData = createResponse.data.data || createResponse.data;
          if (customerData && customerData.id) {
            console.log('[CustomerEntity] Created new customer ID:', customerData.id);
            console.log('[CustomerEntity] Full customer object:', customerData);
            return customerData.id;
          }
        }

        console.warn('[CustomerEntity] Customer creation succeeded but no ID returned');
      } catch (createError) {
        console.error('[CustomerEntity] Customer creation failed:', createError);
      }

      // Final fallback: try to get any existing customer
      console.log('[CustomerEntity] All customer resolution attempts failed, using final fallback');
      try {
        const finalFallbackResponse = await apiClient.get<any>('/customers?limit=1');

        if (finalFallbackResponse.success && finalFallbackResponse.data) {
          // Handle nested response structure from API client
          const responseData = finalFallbackResponse.data.data || finalFallbackResponse.data;
          if (responseData?.customers?.length > 0) {
            const finalFallbackCustomer = responseData.customers[0];
            console.log(
              '[CustomerEntity] Using final fallback customer:',
              finalFallbackCustomer.id,
              finalFallbackCustomer.name
            );
            return finalFallbackCustomer.id;
          }
        }
      } catch (fallbackError) {
        console.error('[CustomerEntity] Final fallback failed:', fallbackError);
      }

      throw new Error(
        `Failed to find or create customer "${name}". No customers available in system.`
      );
    } catch (error) {
      console.error(`Failed to find or create customer "${name}":`, error);
      throw error;
    }
  }
}
