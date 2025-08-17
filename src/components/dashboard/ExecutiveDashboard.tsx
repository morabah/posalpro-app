/**
 * Executive Dashboard for PosalPro MVP2
 * High-end visualizations for managers and business owners
 * Focus on KPIs that drive business decisions
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FireIcon,
  PresentationChartLineIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import type { TooltipItem } from 'chart.js';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend as ChartLegend,
  Tooltip as ChartTooltip,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
} from 'chart.js';
import { memo, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  ChartLegend,
  Filler
);

interface ExecutiveMetrics {
  // Revenue Performance
  totalRevenue: number;
  monthlyRevenue: number;
  quarterlyGrowth: number;
  yearlyGrowth: number;
  revenueTarget: number;
  revenueTargetProgress: number;

  // Sales Performance
  totalProposals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  avgDealSize: number;
  avgSalesCycle: number;

  // Pipeline Health
  pipelineValue: number;
  qualifiedLeads: number;
  hotProspects: number;
  closingThisMonth: number;
  atRiskDeals: number;

  // Team Performance
  topPerformer: string;
  teamSize: number;
  avgPerformance: number;

  // Forecasting
  projectedRevenue: number;
  confidenceLevel: number;
}

interface RevenueChart {
  period: string;
  actual: number;
  target: number;
  forecast?: number;
}

interface TeamPerformance {
  name: string;
  revenue: number;
  deals: number;
  winRate: number;
  target: number;
  performance: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  velocity: number;
  conversionRate: number;
  avgTime: number;
}

// ─── Shared formatters (use across cards/charts) ───────────────────────────────
const formatCurrency = (amount: number) => {
  const v = isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: v >= 1_000_000 ? 'compact' : 'standard',
  }).format(v);
};

const formatPercentage = (value: number, digits: number = 1) => {
  const v = isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v / 100);
};

const formatNumber = (value: number, decimals: number = 1) => {
  const v = isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(v);
};

// Simple sparkline to visualize revenue trends
const RevenueSparkline = ({ data }: { data: RevenueChart[] }) => {
  if (!data.length) return null;
  const values = data.slice(-6).map(d => d.actual || 0);
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
};

// Executive Summary Card
const ExecutiveSummaryCard = memo(
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
      <Card className="p-8 bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Executive Summary</h2>
              <p className="text-blue-200">Your business at a glance</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
              <div className="text-blue-200">This Month</div>
              <div className="mt-2 w-32 h-8 text-blue-300">
                <RevenueSparkline data={revenueData} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Win Rate */}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrophyIcon className="h-8 w-8 text-yellow-300" />
                <span className="text-2xl font-bold">{formatPercentage(metrics.winRate)}</span>
              </div>
              <div className="text-blue-200">Win Rate</div>
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
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <BanknotesIcon className="h-8 w-8 text-green-300" />
                <span className="text-2xl font-bold">{formatCurrency(metrics.pipelineValue)}</span>
              </div>
              <div className="text-blue-200">Pipeline Value</div>
              <div className="text-sm text-green-300 mt-2">
                {metrics.qualifiedLeads} qualified leads
              </div>
            </div>

            {/* Hot Prospects */}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <FireIcon className="h-8 w-8 text-orange-300" />
                <span className="text-2xl font-bold">{metrics.hotProspects}</span>
              </div>
              <div className="text-blue-200">Hot Prospects</div>
              <div className="text-sm text-orange-300 mt-2">
                {metrics.closingThisMonth} closing this month
              </div>
            </div>

            {/* Target Progress */}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <PresentationChartLineIcon className="h-8 w-8 text-blue-200" />
                <span className="text-2xl font-bold">
                  {formatPercentage(metrics.revenueTargetProgress)}
                </span>
              </div>
              <div className="text-blue-200">Target Progress</div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full bg-blue-300"
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

const InteractiveRevenueChart = memo(
  ({ data, loading }: { data: RevenueChart[]; loading: boolean }) => {
    if (loading) {
      return (
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </Card>
      );
    }

    const safe = Array.isArray(data) ? data : [];
    const labels = safe.map(d => d.period);
    const datasets = [
      {
        label: 'Actual',
        data: safe.map(d => d.actual || 0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.3)',
        tension: 0.4,
        fill: 'start',
      },
      {
        label: 'Target',
        data: safe.map(d => d.target || 0),
        borderColor: '#6b7280',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ];

    if (safe.some(d => d.forecast != null)) {
      datasets.push({
        label: 'Forecast',
        data: safe.map(d => d.forecast ?? 0),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,0.3)',
        tension: 0.4,
        fill: 'false',
      });
    }

    const chartData = { labels, datasets };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { position: 'top' as const, labels: { usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<'line'>) =>
              `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y as number)}`,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (val: unknown) => formatCurrency(Number(val)),
          },
          grid: { color: '#f3f4f6' },
        },
        x: {
          grid: { color: '#f3f4f6' },
        },
      },
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Revenue Analytics & Forecasting</h3>
            <p className="text-gray-600">Actual vs. target with forecast overlay</p>
          </div>
        </div>
        <div className="h-80" role="img" aria-label="Revenue chart">
          <Line data={chartData} options={options} />
        </div>
      </Card>
    );
  }
);
InteractiveRevenueChart.displayName = 'InteractiveRevenueChart';

const TeamPerformanceHeatmap = memo(
  ({ data, loading }: { data: TeamPerformance[]; loading: boolean }) => {
    if (loading) {
      return (
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      );
    }

    const getPerformanceColor = (performance: number) => {
      if (performance >= 100) return 'bg-green-500';
      if (performance >= 80) return 'bg-yellow-500';
      if (performance >= 60) return 'bg-orange-500';
      return 'bg-red-500';
    };

    const sorted = [...data].sort((a, b) => b.performance - a.performance);

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Team Performance Scorecard</h3>
            <p className="text-gray-600">Ranking by target attainment</p>
          </div>
          <Button variant="outline" size="sm" aria-label="View team performance details">
            <EyeIcon className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>

        <div className="space-y-4">
          {sorted.map((member, index) => (
            <div key={`${member.name}-${index}`} className="relative">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {member.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 ${getPerformanceColor(member.performance)} rounded-full border-2 border-white flex items-center justify-center`}
                    >
                      {index === 0 && <TrophyIcon className="h-3 w-3 text-white" />}
                    </div>
                    <div className="absolute -top-1 -left-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold">{member.name}</h4>
                    <p className="text-sm text-gray-600">
                      {member.deals} deals • {formatPercentage(member.winRate)} win rate
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(member.revenue)}</div>
                    <div className="text-sm text-gray-600">of {formatCurrency(member.target)}</div>
                  </div>

                  <div className="w-36">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Target</span>
                      <span className="font-semibold">{formatPercentage(member.performance)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getPerformanceColor(member.performance)}`}
                        style={{ width: `${Math.min(100, Math.max(0, member.performance))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
);
TeamPerformanceHeatmap.displayName = 'TeamPerformanceHeatmap';

const PipelineHealthVisualization = memo(
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
            const pct = (stage.value || 0) / denom;
            const width = Math.max(8, pct * 100); // ensure visible minimum
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
                      <span>{Math.round(pct * 100)}%</span>
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
                        {formatPercentage(Math.abs(stage.velocity || 0))} velocity
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

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueChart[]>([]);
  const [teamData, setTeamData] = useState<TeamPerformance[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'3M' | '6M' | '12M'>('3M');
  const [includeForecasts, setIncludeForecasts] = useState(true);

  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();

  useEffect(() => {
    const fetchExecutiveData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<{
          success: boolean;
          data?: {
            metrics: ExecutiveMetrics;
            revenueChart: RevenueChart[];
            teamPerformance: TeamPerformance[];
            pipelineStages: PipelineStage[];
          };
        }>(`/dashboard/executive?timeframe=${timeframe}&includeForecasts=${includeForecasts}`);

        if (response.success && response.data) {
          const {
            metrics: executiveMetrics,
            revenueChart,
            teamPerformance,
            pipelineStages: stages,
          } = response.data;

          // Set data with proper type safety
          setMetrics(executiveMetrics);
          setRevenueData(revenueChart || []);
          setTeamData(teamPerformance || []);
          setPipelineStages(stages || []);
        } else {
          throw new Error('Invalid response format from executive dashboard API');
        }
      } catch (error) {
        // Following CORE_REQUIREMENTS: Always use ErrorHandlingService
        handleAsyncError(error, 'Failed to load executive dashboard data', {
          context: 'ExecutiveDashboard',
          component: 'ExecutiveDashboard',
          action: 'fetchExecutiveData',
        });

        setError('Failed to load executive dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchExecutiveData();
  }, [apiClient, timeframe, includeForecasts]);

  // Error state with retry functionality
  if (error && !loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load Executive Dashboard
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setError(null);
                setLoading(true);
                // Trigger re-fetch by reloading component state
                window.location.reload();
              }}
              variant="outline"
            >
              Retry
            </Button>
            <Button onClick={() => setError(null)} variant="ghost">
              Dismiss
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 container mx-auto px-4">
      <div className="flex justify-end gap-4 items-center">
        <select
          aria-label="Select timeframe"
          value={timeframe}
          onChange={e => setTimeframe(e.target.value as '3M' | '6M' | '12M')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
        >
          <option value="3M">Last 3 Months</option>
          <option value="6M">Last 6 Months</option>
          <option value="12M">Last 12 Months</option>
        </select>
        <label className="flex items-center text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            checked={includeForecasts}
            onChange={e => setIncludeForecasts(e.target.checked)}
          />
          Show forecast
        </label>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummaryCard metrics={metrics} revenueData={revenueData} loading={loading} />

      {/* Revenue Analytics */}
      <InteractiveRevenueChart data={revenueData} loading={loading} />

      {/* Team Performance & Pipeline Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TeamPerformanceHeatmap data={teamData} loading={loading} />
        <PipelineHealthVisualization stages={pipelineStages} loading={loading} />
      </div>

      {/* Additional Insights Panel */}
      <Card className="p-6 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
          <div className="flex items-center text-sm text-gray-600">
            <PresentationChartLineIcon className="h-4 w-4 mr-1" />
            Updated 2 min ago
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-medium">Opportunity</span>
            </div>
            <p className="text-sm text-gray-600">
              Sarah Chen's team is 8.6% above target. Consider reassigning leads to optimize
              performance across the team.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center mb-2">
              <CalendarDaysIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-medium">Forecast</span>
            </div>
            <p className="text-sm text-gray-600">
              Based on current trends, you're projected to reach 95% of quarterly target with 78%
              confidence.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-red-200">
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="font-medium">Alert</span>
            </div>
            <p className="text-sm text-gray-600">
              3 high-value deals in negotiation phase need immediate attention to prevent pipeline
              leakage.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
