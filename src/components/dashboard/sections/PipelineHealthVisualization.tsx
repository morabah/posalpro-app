/**
 * Pipeline Health Visualization Component
 * Visual representation of pipeline stages with health indicators
 */

import { Card } from '@/components/ui/Card';
import { PipelineStage } from '@/types/dashboard';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';
import { formatCurrency, formatNumber } from '../design';

export const PipelineHealthVisualization = memo(
  ({ stages, loading }: { stages: PipelineStage[]; loading: boolean }) => {
    if (loading) {
      return (
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </Card>
      );
    }

    if (!stages || stages.length === 0) {
      return (
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">No pipeline data available</p>
          </div>
        </Card>
      );
    }

    const totalValueRaw = stages.reduce((sum, stage) => sum + (stage.value || 0), 0);
    const denom = totalValueRaw === 0 ? 1 : totalValueRaw; // avoid division by zero

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Pipeline Health Monitor</h3>
            <p className="text-gray-600">Stage distribution, velocity, and conversion</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalValueRaw)}</div>
            <div className="text-sm text-gray-600">Total Pipeline</div>
          </div>
        </div>

        <div className="space-y-6">
          {stages.map(stage => {
            // Fix: Cap percentage at 100% and use count-based calculation instead of value-based
            const totalDeals = stages.reduce((sum, s) => sum + (s.count || 0), 0);
            const dealPct = totalDeals > 0 ? (stage.count || 0) / totalDeals : 0;
            const width = Math.min(100, Math.max(8, dealPct * 100)); // Cap at 100%, ensure minimum visibility
            const isHealthy = (stage.velocity || 0) > 0 && (stage.conversionRate || 0) > 10;

            return (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'}`}
                    ></div>
                    <span className="font-semibold">{stage.stage}</span>
                    <span className="text-sm text-gray-600">({stage.count} deals)</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{formatCurrency(stage.value)}</span>
                    <span className="text-gray-500">•</span>
                    <span>{formatNumber(stage.conversionRate, 1)}% conversion</span>
                    <span className="text-gray-500">•</span>
                    <span>{formatNumber(stage.avgTime, 1)} days avg</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div
                      className={`h-8 rounded-full flex items-center justify-between px-4 text-white font-medium ${
                        isHealthy
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                      }`}
                      style={{ width: `${width}%` }}
                    >
                      <span>{stage.count}</span>
                      <span>{Math.round(dealPct * 100)}%</span>
                    </div>
                  </div>

                  {(stage.velocity || 0) !== 0 && (
                    <div className="absolute right-0 top-full mt-1 flex items-center text-xs">
                      {(stage.velocity || 0) > 0 ? (
                        <ArrowTrendingUpIcon className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span
                        className={(stage.velocity || 0) > 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {formatNumber(Math.abs(stage.velocity || 0), 1)} velocity
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }
);

PipelineHealthVisualization.displayName = 'PipelineHealthVisualization';
