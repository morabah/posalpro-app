/**
 * PosalPro MVP2 - Service Status Service
 * Service layer for service status monitoring operations
 * Based on CORE_REQUIREMENTS.md patterns
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001
 */

import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { http } from '@/lib/http';
import { logDebug, logInfo } from '@/lib/logger';

// Import consolidated schemas and types
import type { ServiceStatusQuery, ServiceStatusResponse } from '@/features/service-status/schemas';

/**
 * Service Status Service Class
 * Stateless service class with HTTP client patterns
 */
export class ServiceStatusService {
  private baseUrl = '/api/admin/service-status';
  private errorHandlingService = ErrorHandlingService.getInstance();

  /**
   * Get comprehensive service status
   */
  async getServiceStatus(params: Partial<ServiceStatusQuery> = {}): Promise<ServiceStatusResponse> {
    const searchParams = new URLSearchParams();

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== false) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else if (typeof value === 'string' && value !== '') {
          searchParams.append(key, value);
        } else if (typeof value === 'boolean' || typeof value === 'number') {
          searchParams.append(key, String(value));
        }
      }
    });

    logDebug('Fetching service status', {
      component: 'ServiceStatusService',
      operation: 'getServiceStatus',
      params,
    });

    try {
      const response = await http.get<ServiceStatusResponse>(
        `${this.baseUrl}?${searchParams.toString()}`
      );

      logInfo('Service status fetched successfully', {
        component: 'ServiceStatusService',
        operation: 'getServiceStatus',
        serviceCount: response.services?.length || 0,
        overallStatus: response.overallStatus,
        responseTime: response.responseTime,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch service status',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ServiceStatusService',
          operation: 'getServiceStatus',
          params,
        }
      );
      throw processed;
    }
  }

  /**
   * Get service status summary (lightweight version)
   */
  async getServiceStatusSummary(): Promise<ServiceStatusResponse> {
    return this.getServiceStatus({ includeDetails: false, refresh: false });
  }

  /**
   * Refresh service status (force refresh)
   */
  async refreshServiceStatus(): Promise<ServiceStatusResponse> {
    logDebug('Refreshing service status', {
      component: 'ServiceStatusService',
      operation: 'refreshServiceStatus',
    });

    try {
      const response = await http.get<ServiceStatusResponse>(`${this.baseUrl}?refresh=true`);

      logInfo('Service status refreshed successfully', {
        component: 'ServiceStatusService',
        operation: 'refreshServiceStatus',
        overallStatus: response.overallStatus,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to refresh service status',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ServiceStatusService',
          operation: 'refreshServiceStatus',
        }
      );
      throw processed;
    }
  }
}

// ====================
// Export Default Instance
// ====================

export const serviceStatusService = new ServiceStatusService();
export default serviceStatusService;
