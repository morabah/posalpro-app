// Customer Service - New Architecture
import { ApiResponse } from '@/lib/api/response';
import { http } from '@/lib/http';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// Zod schemas for validation
export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  revenue: z.number().optional().or(z.null()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CustomerCreateSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CustomerUpdateSchema = CustomerCreateSchema.partial();

export const CustomerQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['createdAt', 'name', 'status', 'revenue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).optional(),
  industry: z.string().optional(),
});

export const CustomerListSchema = z.object({
  items: z.array(CustomerSchema),
  nextCursor: z.string().nullable(),
});

// Type exports
export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;
export type CustomerQuery = z.infer<typeof CustomerQuerySchema>;
export type CustomerList = z.infer<typeof CustomerListSchema>;

// Service class
export class CustomerService {
  private baseUrl = '/api/customers';

  async getCustomers(params: CustomerQuery): Promise<ApiResponse<CustomerList>> {
    const validatedParams = CustomerQuerySchema.parse(params);
    const searchParams = new URLSearchParams();

    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    logDebug('Fetching customers', {
      component: 'CustomerService',
      operation: 'getCustomers',
      params: validatedParams,
    });

    try {
      const response = await http.get<CustomerList>(`${this.baseUrl}?${searchParams.toString()}`);

      logInfo('Customers fetched successfully', {
        component: 'CustomerService',
        operation: 'getCustomers',
        count: response.items?.length || 0,
      });

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to fetch customers', {
        component: 'CustomerService',
        operation: 'getCustomers',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    logDebug('Fetching customer', {
      component: 'CustomerService',
      operation: 'getCustomer',
      customerId: id,
    });

    try {
      const response = await http.get<Customer>(`${this.baseUrl}/${id}`);

      logInfo('Customer fetched successfully', {
        component: 'CustomerService',
        operation: 'getCustomer',
        customerId: id,
      });

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to fetch customer', {
        component: 'CustomerService',
        operation: 'getCustomer',
        customerId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async createCustomer(data: CustomerCreate): Promise<ApiResponse<Customer>> {
    const validatedData = CustomerCreateSchema.parse(data);

    logDebug('Creating customer', {
      component: 'CustomerService',
      operation: 'createCustomer',
      customerName: validatedData.name,
    });

    try {
      const response = await http.post<Customer>(this.baseUrl, validatedData);

      logInfo('Customer created successfully', {
        component: 'CustomerService',
        operation: 'createCustomer',
        customerId: response.id,
        customerName: validatedData.name,
      });

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to create customer', {
        component: 'CustomerService',
        operation: 'createCustomer',
        customerName: validatedData.name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async updateCustomer(id: string, data: CustomerUpdate): Promise<ApiResponse<Customer>> {
    const validatedData = CustomerUpdateSchema.parse(data);

    logDebug('Updating customer', {
      component: 'CustomerService',
      operation: 'updateCustomer',
      customerId: id,
    });

    try {
      const response = await http.put<Customer>(`${this.baseUrl}/${id}`, validatedData);

      logInfo('Customer updated successfully', {
        component: 'CustomerService',
        operation: 'updateCustomer',
        customerId: id,
      });

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to update customer', {
        component: 'CustomerService',
        operation: 'updateCustomer',
        customerId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<ApiResponse<null>> {
    logDebug('Deleting customer', {
      component: 'CustomerService',
      operation: 'deleteCustomer',
      customerId: id,
    });

    try {
      const response = await http.delete(`${this.baseUrl}/${id}`);

      logInfo('Customer deleted successfully', {
        component: 'CustomerService',
        operation: 'deleteCustomer',
        customerId: id,
      });

      return { ok: true, data: null };
    } catch (error) {
      logError('Failed to delete customer', {
        component: 'CustomerService',
        operation: 'deleteCustomer',
        customerId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async deleteCustomersBulk(ids: string[]): Promise<ApiResponse<{ deleted: number }>> {
    logDebug('Deleting customers in bulk', {
      component: 'CustomerService',
      operation: 'deleteCustomersBulk',
      customerCount: ids.length,
    });

    try {
      const response = await http.post<{ deleted: number }>(`${this.baseUrl}/bulk-delete`, { ids });

      logInfo('Customers deleted in bulk successfully', {
        component: 'CustomerService',
        operation: 'deleteCustomersBulk',
        deletedCount: response.deleted || 0,
      });

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to delete customers in bulk', {
        component: 'CustomerService',
        operation: 'deleteCustomersBulk',
        customerCount: ids.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async searchCustomers(query: string, limit: number = 10): Promise<ApiResponse<Customer[]>> {
    logDebug('Searching customers', {
      component: 'CustomerService',
      operation: 'searchCustomers',
      query,
      limit,
    });

    try {
      const response = await http.get<Customer[]>(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      logInfo('Customer search completed', {
        component: 'CustomerService',
        operation: 'searchCustomers',
        query,
        resultCount: response.length || 0,
      });

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to search customers', {
        component: 'CustomerService',
        operation: 'searchCustomers',
        query,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const customerService = new CustomerService();
