/**
 * PosalPro MVP2 - Performance Metrics Component
 * Displays performance baseline and measurement data
 */

'use client';

import { Card } from '@/components/ui/Card';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface PerformanceMetricsProps {
  data: any;
  timeRange: string;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data, timeRange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
        <p className="text-sm text-gray-600 mb-6">
          Baseline measurements and current performance tracking for the {timeRange} period.
        </p>
      </div>

      <Card>
        <div className="p-6 text-center">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Metrics</h3>
          <p className="text-gray-600">
            Performance baseline tracking will be displayed here when data is available.
          </p>
        </div>
      </Card>
    </div>
  );
};
