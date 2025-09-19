'use client';

import { ChartBarIcon, CpuChipIcon, FireIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface OverviewTabProps {
  analyticsData: any;
  isMobile: boolean;
}

export default function OverviewTab({ analyticsData, isMobile }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Hypotheses</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.hypothesesMetrics.length}
              </p>
            </div>
            <LightBulbIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {analyticsData.hypothesesMetrics.length > 0
                  ? (
                      analyticsData.hypothesesMetrics.reduce(
                        (sum: number, h: any) => sum + h.progressPercentage,
                        0
                      ) / analyticsData.hypothesesMetrics.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-green-600">
                {analyticsData.systemHealth.filter((h: any) => h.status === 'healthy').length}/
                {analyticsData.systemHealth.length}
              </p>
            </div>
            <CpuChipIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Optimization Score</p>
              <p className="text-2xl font-bold text-green-600">
                {analyticsData.optimizationScore.toFixed(0)}
              </p>
            </div>
            <FireIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
