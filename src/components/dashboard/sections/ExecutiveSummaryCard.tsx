/**
 * Executive Summary Card Component
 * High-level overview of key business metrics
 */

import { Card } from '@/components/ui/Card';
import { ExecutiveMetrics, RevenueChart } from '@/types/dashboard';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  FireIcon,
  PresentationChartLineIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { memo } from 'react';
import { formatCurrency, formatPercentage, RevenueSparkline } from '../design';

// Executive Summary Card
export const ExecutiveSummaryCard = memo(
  ({
    metrics,
    revenueData,
    loading,
  }: {
    metrics: ExecutiveMetrics | null;
    revenueData: RevenueChart[];
    loading: boolean;
  }) => {
    if (loading || !metrics) {
      return (
        <Card className="p-8 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-blue-700 rounded w-1/2"></div>
            <div className="h-12 bg-blue-700 rounded w-3/4"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-blue-700 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6 bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Executive Summary</h2>
              <p className="text-blue-200 text-sm">Your business at a glance</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
              <div className="text-blue-200 text-sm">This Month</div>
              <div className="mt-2 w-24 h-6 text-blue-300">
                <RevenueSparkline data={revenueData} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Win Rate */}
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <TrophyIcon className="h-6 w-6 text-yellow-300" />
                <span className="text-xl font-bold">{formatPercentage(metrics.winRate)}</span>
              </div>
              <div className="text-blue-200 text-sm">Win Rate</div>
              {(() => {
                const growth = metrics.quarterlyGrowth;
                const positive = growth >= 0;
                return (
                  <div className="flex items-center mt-2">
                    {positive ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1 text-green-300" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1 text-red-300" />
                    )}
                    <span className={`text-sm ${positive ? 'text-green-300' : 'text-red-300'}`}>
                      {formatPercentage(Math.abs(growth))} QoQ
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Pipeline Value */}
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <BanknotesIcon className="h-6 w-6 text-green-300" />
                <span className="text-xl font-bold">{formatCurrency(metrics.pipelineValue)}</span>
              </div>
              <div className="text-blue-200 text-sm">Pipeline Value</div>
              <div className="text-xs text-green-300 mt-1">
                {metrics.qualifiedLeads} qualified leads
              </div>
            </div>

            {/* Hot Prospects */}
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <FireIcon className="h-6 w-6 text-orange-300" />
                <span className="text-xl font-bold">{metrics.hotProspects}</span>
              </div>
              <div className="text-blue-200 text-sm">Hot Prospects</div>
              <div className="text-xs text-orange-300 mt-1">
                {metrics.closingThisMonth} closing this month
              </div>
            </div>

            {/* Target Progress */}
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <PresentationChartLineIcon className="h-6 w-6 text-blue-200" />
                <span className="text-xl font-bold">
                  {formatPercentage(metrics.revenueTargetProgress)}
                </span>
              </div>
              <div className="text-blue-200 text-sm">Target Progress</div>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                <div
                  className="h-1.5 rounded-full bg-blue-300"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.revenueTargetProgress))}%` }}
                />
              </div>
              <div className="text-xs text-blue-200 mt-1">
                {formatCurrency(metrics.totalRevenue)} / {formatCurrency(metrics.revenueTarget)}
              </div>
            </div>
          </div>

          {metrics.atRiskDeals > 0 && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-300 mr-2" />
                <span className="text-red-100">
                  <strong>{metrics.atRiskDeals}</strong> deals at risk - Requires immediate
                  attention
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

ExecutiveSummaryCard.displayName = 'ExecutiveSummaryCard';
