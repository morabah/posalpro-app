// Customer Service - New Architecture
import { ApiResponse } from '@/lib/api/response';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { http } from '@/lib/http';
import { logDebug, logInfo } from '@/lib/logger';

// Import consolidated schemas
import {
  CustomerCreateSchema,
  CustomerQuerySchema,
  CustomerUpdateSchema,
  type Customer,
  type CustomerCreate,
  type CustomerList,
  type CustomerQuery,
  type CustomerUpdate,
} from '@/features/customers/schemas';

// Re-export types for backward compatibility
export type { Customer, CustomerCreate, CustomerList, CustomerQuery, CustomerUpdate };

// Service class
export class CustomerService {
  private baseUrl = '/api/customers';
  private errorHandlingService = ErrorHandlingService.getInstance();

  async getCustomers(params: CustomerQuery): Promise<CustomerList> {
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

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch customers',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'CustomerService',
          operation: 'getCustomers',
        }
      );
      throw processed;
    }
  }

  async getCustomer(id: string): Promise<Customer> {
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

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch customer',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'CustomerService',
          operation: 'getCustomer',
          customerId: id,
        }
      );
      throw processed;
    }
  }

  async createCustomer(data: CustomerCreate): Promise<Customer> {
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

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create customer',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: 'CustomerService',
          operation: 'createCustomer',
          customerName: validatedData.name,
        }
      );
      throw processed;
    }
  }

  async updateCustomer(id: string, data: CustomerUpdate): Promise<Customer> {
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

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update customer',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'CustomerService',
          operation: 'updateCustomer',
          customerId: id,
        }
      );
      throw processed;
    }
  }

  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
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

      return { ok: true, data: undefined };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete customer',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'CustomerService',
          operation: 'deleteCustomer',
          customerId: id,
        }
      );
      return {
        ok: false,
        message: processed.message,
        code: processed.code,
      };
    }
  }

  async deleteCustomersBulk(ids: string[]): Promise<{ deleted: number }> {
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

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete customers in bulk',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'CustomerService',
          operation: 'deleteCustomersBulk',
          customerCount: ids.length,
        }
      );
      throw processed;
    }
  }

  async searchCustomers(query: string, limit: number = 10): Promise<Customer[]> {
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

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to search customers',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'CustomerService',
          operation: 'searchCustomers',
          query,
        }
      );
      throw processed;
    }
  }
}

// Export singleton instance
export const customerService = new CustomerService();
