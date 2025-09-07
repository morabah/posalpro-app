/**
 * Modern PosalPro Dashboard - Market-Standard UX/UI Design
 * Elegant, clean, and informative with reduced clutter
 *
 * DESIGN PRINCIPLES:
 * - Progressive disclosure with smart information hierarchy
 * - Market-standard visual patterns (Linear, Stripe, Notion inspired)
 * - Mobile-first responsive design with touch-friendly interactions
 * - Contextual actions and data-driven insights
 *
 * COMPLIANCE STATUS:
 * ✅ Post-Bridge Migration Architecture
 * ✅ CORE_REQUIREMENTS.md compliance
 * ✅ DASHBOARD_MIGRATION_ASSESSMENT.md alignment
 * ✅ Modern UX/UI patterns with accessibility
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useExecutiveDashboard } from '@/features/dashboard/hooks';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug } from '@/lib/logger';
import { useDashboardFilters, useDashboardUIActions } from '@/lib/store/dashboardStore';
import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { memo, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

// Dynamic imports for heavy components
const InteractiveRevenueChart = dynamic(
  () => import('./sections/InteractiveRevenueChart').then(mod => ({ default: mod.InteractiveRevenueChart })),
  {
    loading: () => {
      const { SkeletonRevenueChart } = require('./DashboardSkeleton');
      return <SkeletonRevenueChart />;
    },
    ssr: false,
  }
);

const PipelineHealthVisualization = dynamic(
  () => import('./sections/PipelineHealthVisualization').then(mod => ({ default: mod.PipelineHealthVisualization })),
  {
    loading: () => {
      const { SkeletonPipelineChart } = require('./DashboardSkeleton');
      return <SkeletonPipelineChart />;
    },
    ssr: false,
  }
);

const TeamPerformanceHeatmap = dynamic(
  () => import('./sections/TeamPerformanceHeatmap').then(mod => ({ default: mod.TeamPerformanceHeatmap })),
  {
    loading: () => {
      const { SkeletonHeatmap } = require('./DashboardSkeleton');
      return <SkeletonHeatmap />;
    },
    ssr: false,
  }
);

// Enhanced KPI interfaces
interface EnhancedKPIs {
  // Primary Business Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;

  // Proposal Performance
  totalProposals: number;
  activeProposals: number;
  wonProposals: number;
  winRate: number;
  avgProposalValue: number;

  // Operational Metrics
  avgCycleTime: number;
  overdueCount: number;
  atRiskCount: number;

  // Customer Metrics
  totalCustomers: number;
  activeCustomers: number;
  customerGrowth: number;
  avgCustomerValue: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  target: number;
  proposals: number;
}

interface ConversionFunnel {
  stage: string;
  count: number;
  conversionRate: number;
  value: number;
}

interface RiskIndicator {
  type: 'overdue' | 'at_risk' | 'stalled';
  count: number;
  severity: 'high' | 'medium' | 'low';
  trend: number;
}

// Dashboard constants for consistent baselines and targets
const DASHBOARD_CONSTANTS = {
  WIN_RATE_TARGET: 75,
  WIN_RATE_BASELINE: 65,
  CYCLE_TIME_TARGET_DAYS: 14,
  REVENUE_GROWTH_TARGET: 20, // percentage
} as const;

// Market-standard formatters for consistent data presentation
const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Zod validation schemas for API responses
const TrendSchema = z.object({
  month: z.string(),
  revenue: z.number().nonnegative(),
  target: z.number().nonnegative().optional().default(0),
  proposals: z.number().int().nonnegative().optional().default(0),
});

const MetricsSchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  winRate: z.number().min(0).max(100).optional().default(0),
  avgCompletionTime: z.number().nonnegative().optional().default(21),
  overdue: z.number().int().nonnegative().optional().default(0),
});

// Modern KPI Card - Market-standard design with elegant interactions
const ModernKPICard = memo(
  ({
    title,
    value,
    subtitle,
    change,
    trend,
    icon,
    color,
    context,
    loading,
    prefix,
    suffix,
    onClick,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'slate';
    context?: string;
    loading?: boolean;
    prefix?: string;
    suffix?: string;
    onClick?: () => void;
  }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Market-standard color schemes with improved contrast and accessibility
    const colorSchemes = {
      blue: {
        bg: 'bg-blue-50/50',
        text: 'text-blue-700',
        icon: 'text-blue-600',
        border: 'border-blue-200/60',
        accent: 'bg-gradient-to-r from-blue-500 to-blue-600',
        hover: 'hover:bg-blue-50/80',
      },
      green: {
        bg: 'bg-emerald-50/50',
        text: 'text-emerald-700',
        icon: 'text-emerald-600',
        border: 'border-emerald-200/60',
        accent: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        hover: 'hover:bg-emerald-50/80',
      },
      yellow: {
        bg: 'bg-amber-50/50',
        text: 'text-amber-700',
        icon: 'text-amber-600',
        border: 'border-amber-200/60',
        accent: 'bg-gradient-to-r from-amber-500 to-amber-600',
        hover: 'hover:bg-amber-50/80',
      },
      purple: {
        bg: 'bg-violet-50/50',
        text: 'text-violet-700',
        icon: 'text-violet-600',
        border: 'border-violet-200/60',
        accent: 'bg-gradient-to-r from-violet-500 to-violet-600',
        hover: 'hover:bg-violet-50/80',
      },
      red: {
        bg: 'bg-rose-50/50',
        text: 'text-rose-700',
        icon: 'text-rose-600',
        border: 'border-rose-200/60',
        accent: 'bg-gradient-to-r from-rose-500 to-rose-600',
        hover: 'hover:bg-rose-50/80',
      },
      indigo: {
        bg: 'bg-indigo-50/50',
        text: 'text-indigo-700',
        icon: 'text-indigo-600',
        border: 'border-indigo-200/60',
        accent: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        hover: 'hover:bg-indigo-50/80',
      },
      slate: {
        bg: 'bg-slate-50/50',
        text: 'text-slate-700',
        icon: 'text-slate-600',
        border: 'border-slate-200/60',
        accent: 'bg-gradient-to-r from-slate-500 to-slate-600',
        hover: 'hover:bg-slate-50/80',
      },
    };

    const scheme = colorSchemes[color];
    const trendColor =
      trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-500';
    const trendIcon =
      trend === 'up' ? (
        <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
      ) : trend === 'down' ? (
        <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
      ) : null;

    // Format percentage values properly
    const formatValue = (val: string | number) => {
      if (typeof val === 'number') {
        if (suffix === '%') {
          return `${prefix ?? ''}${val.toFixed(1)}${suffix}`;
        }
        return `${prefix ?? ''}${numberFormatter.format(val)}${suffix ?? ''}`;
      }
      return `${prefix ?? ''}${val}${suffix ?? ''}`;
    };

    return (
      <div
        className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl border ${scheme.border} p-6
          ${onClick ? `cursor-pointer ${scheme.hover} hover:shadow-xl hover:shadow-black/5 hover:border-gray-300/80 hover:-translate-y-0.5` : 'hover:shadow-lg hover:shadow-black/5'}
          transition-all duration-300 ease-out`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
        aria-label={onClick ? `View details for ${title}` : undefined}
      >
        {/* Subtle gradient overlay */}
        <div className={`absolute inset-0 ${scheme.bg} rounded-2xl opacity-40`} />

        {/* Interactive indicator */}
        {onClick && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          </div>
        )}

        <div className="relative">
          {/* Header with enhanced icon and trend */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.icon} shadow-sm`}>{icon}</div>
            {change !== undefined && change !== null && Number.isFinite(change) && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 backdrop-blur-sm text-xs font-semibold ${trendColor}`}
              >
                {trendIcon}
                <span>
                  {change > 0 ? '+' : ''}
                  {change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Value with improved typography */}
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
              {!mounted || loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-24 rounded-lg" />
              ) : (
                formatValue(value)
              )}
            </div>

            <div className="text-sm font-semibold text-gray-700 leading-tight">{title}</div>

            {subtitle && <div className="text-xs text-gray-500 leading-relaxed">{subtitle}</div>}

            {context && (
              <div
                className={`text-xs ${scheme.text} font-medium mt-3 px-2 py-1 rounded-md ${scheme.bg} leading-tight`}
              >
                {context}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ModernKPICard.displayName = 'ModernKPICard';

// Compact Revenue Trend Component
const RevenueTrend = memo(({ data, loading }: { data: RevenueData[]; loading?: boolean }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const growth =
    previous && latest && previous.revenue > 0
      ? ((latest.revenue - previous.revenue) / previous.revenue) * 100
      : 0;

  if (!mounted || loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <ChartBarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
            <p className="text-xs text-gray-500">Last 6 months</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
          <div className="animate-pulse bg-gray-200 h-4 w-28 rounded" />
          <div className="animate-pulse bg-gray-200 h-2 w-full rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/60 p-6 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 ease-out">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50/50 text-emerald-600 rounded-xl shadow-sm">
            <ChartBarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
            <p className="text-xs text-gray-500">Last 6 months performance</p>
          </div>
        </div>
        {Number.isFinite(growth) && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 backdrop-blur-sm text-xs font-semibold ${
              growth >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {growth >= 0 ? (
              <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
            )}
            <span>
              {growth > 0 ? '+' : ''}
              {growth.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Current
            </span>
            <div className="text-xl font-bold text-gray-900">
              ${numberFormatter.format(latest?.revenue || 0)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Target
            </span>
            <div className="text-xl font-bold text-gray-900">
              ${numberFormatter.format(latest?.target || 0)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(((latest?.revenue || 0) / (latest?.target || 1)) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress to target</span>
            <span className="font-medium">{latest?.proposals || 0} proposals</span>
          </div>
        </div>
      </div>
    </div>
  );
});

RevenueTrend.displayName = 'RevenueTrend';

// Performance Insights Component
const PerformanceInsights = memo(({ data }: { data: ConversionFunnel[] }) => {
  // Handle empty data state
  if (!data?.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <TrophyIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
            <p className="text-xs text-gray-500">Conversion metrics</p>
          </div>
        </div>
        <div className="text-center py-4">
          <div className="text-purple-600 mb-2">
            <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mx-auto">
              <ChartBarIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm text-gray-600">No funnel data for this range.</p>
        </div>
      </div>
    );
  }

  const totalProposals = data.find(d => d.stage === 'Submitted')?.count || 0;
  const wonProposals = data.find(d => d.stage === 'Won')?.count || 0;
  const winRate = totalProposals > 0 ? (wonProposals / totalProposals) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <TrophyIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
            <p className="text-xs text-gray-500">Conversion metrics</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Win Rate</span>
          <span className="text-lg font-bold text-gray-900">{winRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(winRate, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{wonProposals} won</span>
          <span>{totalProposals} total</span>
        </div>
      </div>
    </div>
  );
});

PerformanceInsights.displayName = 'PerformanceInsights';

// Alerts & Issues Component
const AlertsPanel = memo(({ data, loading }: { data: RiskIndicator[]; loading?: boolean }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalIssues = data.reduce((sum, risk) => sum + risk.count, 0);
  const highPriority = data.filter(r => r.severity === 'high').reduce((sum, r) => sum + r.count, 0);

  if (!mounted || loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Alerts</h3>
            <p className="text-xs text-gray-500">Items needing attention</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="animate-pulse bg-gray-200 h-4 w-24 rounded" />
          <div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Alerts</h3>
            <p className="text-xs text-gray-500">Items needing attention</p>
          </div>
        </div>
        {totalIssues > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-red-600">{totalIssues}</span>
            {highPriority > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {highPriority} high
              </span>
            )}
          </div>
        )}
      </div>

      {totalIssues === 0 ? (
        <div className="text-center py-4">
          <div className="text-green-600 mb-2">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
          </div>
          <p className="text-sm text-gray-600">All clear</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.slice(0, 2).map((risk, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-600 capitalize">{risk.type.replace('_', ' ')}</span>
              <span
                className={`font-medium ${
                  risk.severity === 'high'
                    ? 'text-red-600'
                    : risk.severity === 'medium'
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                }`}
              >
                {risk.count}
              </span>
            </div>
          ))}
          {data.length > 2 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              +{data.length - 2} more items
            </div>
          )}
        </div>
      )}
    </div>
  );
});

AlertsPanel.displayName = 'AlertsPanel';

export default function EnhancedDashboard() {
  const [kpis, setKpis] = useState<EnhancedKPIs>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    totalProposals: 0,
    activeProposals: 0,
    wonProposals: 0,
    winRate: 0,
    avgProposalValue: 0,
    avgCycleTime: 21,
    overdueCount: 0,
    atRiskCount: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    customerGrowth: 0,
    avgCustomerValue: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [funnelData, setFunnelData] = useState<ConversionFunnel[]>([]);
  const [riskData, setRiskData] = useState<RiskIndicator[]>([]);
  const { timeRange, status: statusFilter /*, search: searchFilter*/ } = useDashboardFilters();
  const {
    data: dashboardData,
    isLoading: loading,
    error,
    refetch,
  } = useExecutiveDashboard('3M', false);
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { setFilters } = useDashboardUIActions();

  // Ensure SSR/CSR consistency for UI that depends on transient client-only states
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // (Bridge-based loader removed; using unified React Query hook instead)

  // Derive view data from unified dashboardData with proper handling
  useEffect(() => {
    if (!dashboardData) return;

    logDebug('Enhanced Dashboard: derive from unified hook', {
      component: 'EnhancedDashboard',
      operation: 'derive',
    });

    // Extract data from the consistent API response structure
    const responseData = dashboardData?.data;
    const metrics = responseData?.metrics;

    // Skip if metrics is null or undefined
    if (!metrics) {
      logDebug('dashboard_parse_error', {
        error: 'Metrics data is null or undefined',
        component: 'EnhancedDashboard',
        operation: 'data_validation',
      });
      return;
    }

    setKpis(prev => ({
      ...prev,
      totalRevenue: Number(metrics.totalRevenue || 0),
      monthlyRevenue: Number(metrics.monthlyRevenue || 0),
      revenueGrowth: Number(metrics.quarterlyGrowth || 0), // Using quarterly as revenue growth
      totalProposals: Number(metrics.totalProposals || 0),
      activeProposals: Number(metrics.closingThisMonth || 0), // Using closingThisMonth as active proposals
      wonProposals: Number(metrics.wonDeals || 0),
      winRate: Math.round(Number(metrics.winRate || 0)),
      avgProposalValue: Number(metrics.avgDealSize || 0),
      avgCycleTime: Number(metrics.avgSalesCycle || 0),
      overdueCount: Number(metrics.atRiskDeals || 0),
      atRiskCount: Number(metrics.atRiskDeals || 0),
      totalCustomers: Number(metrics.teamSize || 0), // Using teamSize as proxy for customers
      activeCustomers: Number(metrics.teamSize || 0),
      customerGrowth: Number(metrics.quarterlyGrowth || 0),
      avgCustomerValue: Number(metrics.avgDealSize || 0), // Using avgDealSize as proxy
      proposalGrowth: Number(metrics.quarterlyGrowth || 0),
    }));

    // Use revenue chart from parsed data - map period to month
    setRevenueData(
      (responseData.revenueChart || []).map((item: any) => ({
        month: String(item?.period || ''),
        revenue: Number(item?.actual || 0),
        target: Number(item?.target || 0),
        proposals: Number(metrics.totalProposals || 0), // Use total proposals since per-period data not available
      }))
    );

    // Convert pipeline stages to conversion funnel format
    const funnelData: ConversionFunnel[] = (responseData.pipelineStages || []).map(
      (stage: any) => ({
        stage: String(stage.stage || ''),
        count: Number(stage.count || 0),
        conversionRate: Number(stage.conversionRate || 0),
        value: Number(stage.value || 0),
      })
    );
    setFunnelData(funnelData);

    // Calculate risk indicators using available data
    const overdue = Number(metrics.atRiskDeals || 0);
    const atRiskCount = Number(metrics.atRiskDeals || 0);

    const riskItems: RiskIndicator[] = [];
    if (overdue > 0) {
      riskItems.push({
        type: 'overdue',
        count: overdue,
        severity: overdue > 10 ? 'high' : overdue > 3 ? 'medium' : 'low',
        trend: -5,
      });
    }
    if (atRiskCount > 0) {
      riskItems.push({
        type: 'at_risk',
        count: atRiskCount,
        severity: atRiskCount > 5 ? 'medium' : 'low',
        trend: 3,
      });
    }

    setRiskData(riskItems);

    analytics('enhanced_dashboard_derived_success', {
      component: 'EnhancedDashboard',
      userStory: 'US-1.1',
      hypothesis: 'H1',
      totalProposals: Number(metrics?.totalProposals || 0),
      totalRevenue: Number(metrics?.totalRevenue || 0),
      winRate: Number(metrics?.winRate || 0),
    });
  }, [dashboardData, analytics]);

  // Memoized KPI cards for performance
  // Apply lightweight status-based quick view filtering to derived KPIs
  const displayKpis = useMemo(() => {
    if (!statusFilter || statusFilter === 'all') return kpis;

    switch (statusFilter) {
      case 'active':
        return {
          ...kpis,
          totalProposals: kpis.activeProposals,
        };
      case 'overdue':
        return {
          ...kpis,
          totalProposals: kpis.overdueCount,
          activeProposals: kpis.overdueCount,
        };
      case 'won':
        return {
          ...kpis,
          totalProposals: kpis.wonProposals,
          activeProposals: 0,
        };
      default:
        return kpis;
    }
  }, [kpis, statusFilter]);

  const kpiCards = useMemo(
    () => [
      {
        title: 'Total Revenue',
        value: displayKpis.totalRevenue,
        change: displayKpis.revenueGrowth,
        icon: <CurrencyDollarIcon className="w-5 h-5" />,
        color: 'green' as const,
        prefix: '$',
        onClick: () => {
          // Drill-down to proposals with revenue focus
          setFilters({ search: 'high-value' });
          analytics('kpi_drilldown', { kpi: 'revenue', userStory: 'US-1.1' });
        },
      },
      {
        title: 'Active Proposals',
        value: displayKpis.activeProposals,
        subtitle: `${displayKpis.totalProposals} total`,
        change:
          displayKpis.activeProposals > 0
            ? (displayKpis.activeProposals / displayKpis.totalProposals) * 100
            : 0,
        icon: <DocumentTextIcon className="w-5 h-5" />,
        color: 'blue' as const,
        onClick: () => {
          // Drill-down to active proposals
          setFilters({ status: 'active' });
          analytics('kpi_drilldown', { kpi: 'active_proposals', userStory: 'US-1.1' });
        },
      },
      {
        title: 'Win Rate',
        value: displayKpis.winRate,
        subtitle: `${displayKpis.wonProposals} won`,
        change: displayKpis.winRate - DASHBOARD_CONSTANTS.WIN_RATE_BASELINE,
        icon: <TrophyIcon className="w-5 h-5" />,
        color: 'purple' as const,
        suffix: '%',
        onClick: () => {
          // Drill-down to won proposals
          setFilters({ status: 'won' });
          analytics('kpi_drilldown', { kpi: 'win_rate', userStory: 'US-1.1' });
        },
      },
      {
        title: 'Avg Cycle Time',
        value: displayKpis.avgCycleTime,
        subtitle: 'Proposal to close',
        change: DASHBOARD_CONSTANTS.CYCLE_TIME_TARGET_DAYS - displayKpis.avgCycleTime,
        icon: <ClockIcon className="w-5 h-5" />,
        color: 'yellow' as const,
        suffix: ' days',
        onClick: () => {
          // Drill-down to overdue proposals
          setFilters({ status: 'overdue' });
          analytics('kpi_drilldown', { kpi: 'cycle_time', userStory: 'US-1.1' });
        },
      },
      {
        title: 'Active Customers',
        value: displayKpis.activeCustomers,
        subtitle: `${displayKpis.totalCustomers} total`,
        change: displayKpis.customerGrowth,
        icon: <UsersIcon className="w-5 h-5" />,
        color: 'indigo' as const,
        onClick: () => {
          // Drill-down to customer proposals
          setFilters({ search: 'customer' });
          analytics('kpi_drilldown', { kpi: 'customers', userStory: 'US-1.1' });
        },
      },
      {
        title: 'Risk Items',
        value: displayKpis.overdueCount + displayKpis.atRiskCount,
        subtitle: 'Need attention',
        change: -(
          ((displayKpis.overdueCount + displayKpis.atRiskCount) /
            (displayKpis.totalProposals || 1)) *
          100
        ),
        icon: <ExclamationTriangleIcon className="w-5 h-5" />,
        color: 'red' as const,
        onClick: () => {
          // Drill-down to risk items
          setFilters({ status: 'overdue' });
          analytics('kpi_drilldown', { kpi: 'risk_items', userStory: 'US-1.1' });
        },
      },
    ],
    [displayKpis, analytics, setFilters]
  );

  // Status summary for quick overview
  const statusSummary = useMemo(() => {
    const issues = [];
    if (displayKpis.overdueCount > 0) issues.push(`${displayKpis.overdueCount} overdue`);
    if (displayKpis.atRiskCount > 0) issues.push(`${displayKpis.atRiskCount} at risk`);
    return issues.length > 0 ? issues.join(', ') : 'All on track';
  }, [displayKpis]);

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Modern Header - Market-standard design */}
        <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-black/5">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-violet-600/5" />
          <div className="relative p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Dashboard Overview
                </h1>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusSummary === 'All on track'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        statusSummary === 'All on track' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {statusSummary}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>Real-time insights</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    analytics('dashboard_refresh_clicked', { timeRange }, 'medium');
                    refetch();
                  }}
                  variant="outline"
                  size="sm"
                  disabled={mounted ? loading : false}
                  aria-busy={mounted ? loading : false}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 border-gray-200/60"
                >
                  <ArrowPathIcon
                    className={`w-4 h-4 ${mounted && loading ? 'animate-spin' : ''}`}
                  />
                  {mounted && loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <span className="sr-only" aria-live="polite" role="status">
                  {mounted && loading ? 'Refreshing dashboard data' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary KPI Grid - Market-standard 4-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {kpiCards.slice(0, 4).map((card, index) => (
            <ModernKPICard
              key={`primary-${index}`}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              change={card.change}
              trend={
                card.change && card.change > 0
                  ? 'up'
                  : card.change && card.change < 0
                    ? 'down'
                    : 'neutral'
              }
              icon={card.icon}
              color={card.color}
              prefix={card.prefix}
              suffix={card.suffix}
              onClick={card.onClick}
              loading={loading}
            />
          ))}
        </div>

        {/* Insights Row - Enhanced visual hierarchy */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RevenueTrend data={revenueData} loading={loading} />
          <PerformanceInsights data={funnelData} />
          <AlertsPanel data={riskData} loading={loading} />
        </div>

        {/* Secondary Metrics - Conditional display */}
        {kpiCards.length > 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Additional Metrics</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {kpiCards.slice(4).map((card, index) => (
                <ModernKPICard
                  key={`secondary-${index}`}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  change={card.change}
                  trend={
                    card.change && card.change > 0
                      ? 'up'
                      : card.change && card.change < 0
                        ? 'down'
                        : 'neutral'
                  }
                  icon={card.icon}
                  color={card.color}
                  prefix={card.prefix}
                  suffix={card.suffix}
                  onClick={card.onClick}
                  loading={loading}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
