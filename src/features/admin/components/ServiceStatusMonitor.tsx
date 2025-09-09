/**
 * PosalPro MVP2 - Service Status Monitor Component
 * Comprehensive service status monitoring for admin dashboard
 * Based on CORE_REQUIREMENTS.md patterns and accessibility standards
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useMemo } from 'react';

// Service Status Feature
import { useServiceStatusSummary } from '@/features/service-status/hooks/useServiceStatus';
import type { ServiceStatus } from '@/features/service-status/schemas';

// Logging
import { logDebug } from '@/lib/logger';

// Analytics
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';

// UI Components
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudIcon,
  CogIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// Status color and icon mapping
const getStatusConfig = (status: ServiceStatus['status']) => {
  switch (status) {
    case 'online':
      return {
        icon: CheckCircleIcon,
        color: 'text-green-600 bg-green-50 border-green-200',
        textColor: 'text-green-800',
        label: 'Online',
      };
    case 'offline':
      return {
        icon: XCircleIcon,
        color: 'text-red-600 bg-red-50 border-red-200',
        textColor: 'text-red-800',
        label: 'Offline',
      };
    case 'degraded':
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-800',
        label: 'Degraded',
      };
    case 'maintenance':
      return {
        icon: CogIcon,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        textColor: 'text-blue-800',
        label: 'Maintenance',
      };
    default:
      return {
        icon: CogIcon,
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        textColor: 'text-gray-800',
        label: 'Unknown',
      };
  }
};

// Service type icons
const getServiceIcon = (serviceName: string) => {
  if (serviceName.includes('Node.js')) return ServerIcon;
  if (serviceName.includes('Database')) return ServerIcon;
  if (serviceName.includes('Python')) return CpuChipIcon;
  if (serviceName.includes('Redis')) return CloudIcon;
  return ServerIcon;
};

interface ServiceStatusMonitorProps {
  className?: string;
}

/**
 * Service Status Monitor Component
 */
export function ServiceStatusMonitor({ className = '' }: ServiceStatusMonitorProps) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Fetch service status summary
  const {
    data: serviceStatus,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useServiceStatusSummary();

  // Memoize overall status for performance
  const overallStatus = useMemo(() => {
    if (!serviceStatus) return null;

    const statusCounts = serviceStatus.services.reduce(
      (acc, service) => {
        acc[service.status] = (acc[service.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      status: serviceStatus.overallStatus,
      total: serviceStatus.services.length,
      online: statusCounts.online || 0,
      offline: statusCounts.offline || 0,
      degraded: statusCounts.degraded || 0,
      maintenance: statusCounts.maintenance || 0,
    };
  }, [serviceStatus]);

  // Handle refresh
  const handleRefresh = () => {
    logDebug('Service status refresh requested', {
      component: 'ServiceStatusMonitor',
      operation: 'handleRefresh',
      userStory: 'US-8.1',
      hypothesis: 'H8',
    });

    analytics('service_status_refresh_clicked', {
      component: 'ServiceStatusMonitor',
      userStory: 'US-8.1',
      hypothesis: 'H8',
    });

    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
            <p className="text-sm text-gray-600">Monitoring system services and dependencies</p>
          </div>
          <Button variant="outline" size="sm" disabled aria-label="Loading service status">
            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
            <p className="text-sm text-gray-600">Monitoring system services and dependencies</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefetching}>
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-red-800 mb-2">Failed to Load Service Status</h4>
            <p className="text-sm text-red-600 mb-4">
              {error.message || 'Unable to fetch service status information'}
            </p>
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefetching}>
              {isRefetching ? 'Retrying...' : 'Try Again'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // No data state
  if (!serviceStatus || !serviceStatus.services.length) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
            <p className="text-sm text-gray-600">Monitoring system services and dependencies</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefetching}>
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">No Service Data Available</h4>
            <p className="text-sm text-gray-600">
              Service monitoring data is not available at this time.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const overallStatusConfig = getStatusConfig(
    serviceStatus.overallStatus as ServiceStatus['status']
  );

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
          <p className="text-sm text-gray-600">Monitoring system services and dependencies</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Overall Status Indicator */}
          <div
            className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${overallStatusConfig.color}`}
          >
            <overallStatusConfig.icon className="h-4 w-4 mr-2" />
            {overallStatusConfig.label}
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefetching}
            aria-label="Refresh service status"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      {overallStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{overallStatus.total}</div>
            <div className="text-sm text-gray-600">Total Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{overallStatus.online}</div>
            <div className="text-sm text-gray-600">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{overallStatus.offline}</div>
            <div className="text-sm text-gray-600">Offline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{overallStatus.degraded}</div>
            <div className="text-sm text-gray-600">Degraded</div>
          </div>
        </div>
      )}

      {/* Service List */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
          Service Details
        </h4>

        <div className="space-y-3">
          {serviceStatus.services.map((service, index) => {
            const statusConfig = getStatusConfig(service.status);
            const ServiceIcon = getServiceIcon(service.name);

            return (
              <div
                key={`${service.name}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* Service Icon */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-gray-200">
                      <ServiceIcon className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h5 className="text-sm font-medium text-gray-900 truncate">{service.name}</h5>
                      <div
                        className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                      >
                        <statusConfig.icon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                      {service.version && <span>v{service.version}</span>}
                      {service.latency !== undefined && service.latency !== null && (
                        <span className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {service.latency}ms
                        </span>
                      )}
                      {service.uptime && (
                        <span>
                          Uptime: {Math.floor(service.uptime / 3600)}h{' '}
                          {Math.floor((service.uptime % 3600) / 60)}m
                        </span>
                      )}
                    </div>

                    {/* Error Message */}
                    {service.error && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                        {service.error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Checked */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-gray-500">
                    {new Date(service.lastChecked).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date(serviceStatus.timestamp).toLocaleString()}</span>
          <span>Response time: {serviceStatus.responseTime}ms</span>
        </div>
      </div>
    </Card>
  );
}

export default ServiceStatusMonitor;
