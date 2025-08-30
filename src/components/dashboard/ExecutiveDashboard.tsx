/**
 * Executive Dashboard for PosalPro MVP2
 * High-end visualizations for managers and business owners
 * Focus on KPIs that drive business decisions
 * Enhanced modern UX/UI with accessibility and performance optimizations
 */

'use client';

import { useExecutiveDashboard } from '@/features/dashboard/hooks';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useState } from 'react';

const PDFExportButton = dynamic(() => import('./PDFExportButton'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-8 w-24" />,
});

import {
  InteractiveRevenueChart,
  PipelineHealthVisualization,
  TeamPerformanceHeatmap,
} from './sections';

// Import all types
import { ExecutiveMetrics, PipelineStage, RevenueChart, TeamPerformance } from '@/types/dashboard';

// Enhanced color palette with semantic meanings
const colorSchemes = {
  blue: {
    bg: 'bg-blue-50',
    bgHover: 'hover:bg-blue-100',
    text: 'text-blue-600',
    textHover: 'hover:text-blue-700',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-emerald-50',
    bgHover: 'hover:bg-emerald-100',
    text: 'text-emerald-600',
    textHover: 'hover:text-emerald-700',
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  purple: {
    bg: 'bg-violet-50',
    bgHover: 'hover:bg-violet-100',
    text: 'text-violet-600',
    textHover: 'hover:text-violet-700',
    icon: 'text-violet-600',
    border: 'border-violet-200',
  },
  orange: {
    bg: 'bg-amber-50',
    bgHover: 'hover:bg-amber-100',
    text: 'text-amber-600',
    textHover: 'hover:text-amber-700',
    icon: 'text-amber-600',
    border: 'border-amber-200',
  },
} as const;

type ColorScheme = keyof typeof colorSchemes;

// Loading skeleton component for better UX
const MetricCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
      <div className="w-16 h-4 bg-slate-200 rounded"></div>
    </div>
    <div className="w-20 h-8 bg-slate-200 rounded mb-1"></div>
    <div className="w-24 h-4 bg-slate-200 rounded"></div>
  </div>
);

interface ExecutiveDashboardResponse {
  success: boolean;
  data: {
    metrics: ExecutiveMetrics | null;
    revenueChart: RevenueChart[];
    teamPerformance: TeamPerformance[];
    pipelineStages: PipelineStage[];
  };
}

// Main Executive Dashboard Component
const ExecutiveDashboard = memo(() => {
  const { handleAsyncError } = useErrorHandler();

  // State Management
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueChart[]>([]);
  const [teamData, setTeamData] = useState<TeamPerformance[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [timeframe, setTimeframe] = useState<'3M' | '6M' | '1Y'>('3M');
  const [includeForecasts, setIncludeForecasts] = useState(true);

  // Mobile and Accessibility State
  const [isMobile, setIsMobile] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(false);

  const { data, isLoading } = useExecutiveDashboard(timeframe, includeForecasts);
  useEffect(() => {
    if (data) {
      setMetrics(data.metrics);
      setRevenueData(data.revenueChart);
      setTeamData(data.teamPerformance);
      setPipelineStages(data.pipelineStages);
    }
  }, [data]);

  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Event Handlers
  const handleTimeframeChange = useCallback((newTimeframe: '3M' | '6M' | '1Y') => {
    setTimeframe(newTimeframe);
  }, []);

  const handleRefreshPredictions = useCallback(async () => {
    try {
      // React Query will auto-refetch when key changes; toggle includeForecasts to refetch
      setIncludeForecasts(prev => !prev);
      setTimeout(() => setIncludeForecasts(prev => !prev), 0);
    } catch (error) {
      handleAsyncError(error, 'Failed to refresh predictions');
    }
  }, [handleAsyncError]);

  // Main Render
  return (
    <div className="space-y-6 isolate">
      {/* Controls Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Executive Dashboard</h2>
            <p className="text-sm text-slate-600">Real-time business insights</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <PDFExportButton
            targetId="dashboard-content"
            filename="executive-dashboard"
            variant="outline"
            size="sm"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
            {(['3M', '6M', '1Y'] as const).map(period => (
              <button
                key={period}
                onClick={() => handleTimeframeChange(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  timeframe === period
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Live Updates Toggle */}
          <button
            onClick={() => setLiveUpdatesEnabled(!liveUpdatesEnabled)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              liveUpdatesEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${liveUpdatesEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}
            />
            <span>{liveUpdatesEnabled ? 'Live' : 'Offline'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefreshPredictions}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all duration-200"
            title="Refresh data"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Welcome Section - Clean */}
        <div className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-slate-900">Welcome back</h1>
              <p className="text-slate-600 text-base lg:text-lg">
                Here's what's happening with your business today.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                <svg
                  className="w-8 h-8 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {isLoading
            ? // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => <MetricCardSkeleton key={index} />)
            : [
      {
        title: 'Total Revenue',
        value: `$${new Intl.NumberFormat('en-US').format(metrics?.totalRevenue || 0)}`,
                  change: '+12.5%',
                  changeType: 'positive',
                  icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
                  color: 'blue' as ColorScheme,
                  description: 'Total revenue generated in the selected period',
                },
      {
        title: 'Total Proposals',
        value: new Intl.NumberFormat('en-US').format(metrics?.totalProposals || 0),
                  change: '+8.2%',
                  changeType: 'positive',
                  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                  color: 'green' as ColorScheme,
                  description: 'Total number of proposals created',
                },
                {
                  title: 'Win Rate',
                  value: metrics?.winRate ? `${metrics.winRate.toFixed(1)}%` : '0%',
                  change: '+2.1%',
                  changeType: 'positive',
                  icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                  color: 'purple' as ColorScheme,
                  description: 'Percentage of won proposals',
                },
                {
                  title: 'Active Deals',
                  value: '24',
                  change: '+3',
                  changeType: 'positive',
                  icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
                  color: 'orange' as ColorScheme,
                  description: 'Deals currently in the active pipeline',
                },
              ].map(metric => (
                <div
                  key={metric.title}
                  className={cn(
                    'group bg-white rounded-2xl p-6 lg:p-7 shadow-sm border border-slate-200/60 hover:shadow-md transition-colors'
                  )}
                  aria-label={`${metric.title}: ${metric.value}, ${metric.description}`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg',
                        colorSchemes[metric.color].bg,
                        colorSchemes[metric.color].border,
                        'border'
                      )}
                    >
                      <svg
                        className={cn(
                          'w-6 h-6 transition-colors duration-300',
                          colorSchemes[metric.color].icon
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d={metric.icon}
                        />
                      </svg>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={cn(
                          'flex items-center space-x-2 text-sm font-semibold px-3 py-1.5 rounded-full',
                          metric.changeType === 'positive'
                            ? 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                            : 'text-red-700 bg-red-100 border border-red-200'
                        )}
                      >
                        <svg
                          className={cn(
                            'w-5 h-5',
                            metric.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        <span>{metric.change}</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                    {metric.value}
                  </h3>
                  <p className="text-slate-900 font-medium text-base">{metric.title}</p>
                  <p className="text-slate-500 text-sm">{metric.description}</p>
                </div>
              ))}
        </div>

        {/* Main Dashboard Sections (vertical flow to avoid any overlap) */}
        <div className="space-y-6">
          {/* Revenue Chart Section */}
          <div>
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Revenue Performance</h2>
                  <p className="text-slate-600 font-medium">Track revenue trends and forecasts</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Revenue</span>
                </div>
              </div>
              <div className="h-80 lg:h-96">
                <InteractiveRevenueChart data={revenueData} loading={isLoading} />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Team Performance</h3>
                <p className="text-slate-600 font-medium">Individual and team metrics overview</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-violet-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="h-80 lg:h-96">
              <TeamPerformanceHeatmap data={teamData} loading={isLoading} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pipeline Health</h3>
                <p className="text-slate-600 font-medium">Sales pipeline stage analysis</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <div className="h-80 lg:h-96">
              <PipelineHealthVisualization stages={pipelineStages} loading={isLoading} />
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-slate-900 rounded-3xl p-8 lg:p-12 text-white overflow-hidden relative">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="text-slate-300 text-xs font-bold tracking-wide uppercase">
                    AI-Powered Insights
                  </span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
                  Intelligent Analytics
                </h2>
                <p className="text-slate-300 text-lg font-medium">
                  Advanced predictions and recommendations for your business
                </p>
              </div>
              <div className="hidden lg:flex items-center justify-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                  <svg
                    className="w-8 h-8 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  title: 'Revenue Forecast',
                  insight: 'Strong upward trajectory expected based on current pipeline momentum',
                  confidence: '95%',
                  trend: 'up',
                  icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
                },
                {
                  title: 'Team Performance',
                  insight: 'Sales team consistently exceeding targets across all key metrics',
                  confidence: '88%',
                  trend: 'up',
                  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
                },
                {
                  title: 'Market Opportunity',
                  insight: 'Emerging market segment presents significant growth potential',
                  confidence: '92%',
                  trend: 'up',
                  icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6',
                },
              ].map((insight, index) => (
                <div
                  key={insight.title}
                  className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors duration-300 hover:shadow-xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-xl flex items-center justify-center border border-white/20">
                      <svg
                        className="w-6 h-6 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d={insight.icon}
                        />
                      </svg>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs text-emerald-400 font-bold uppercase tracking-wide">
                        Live
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-white group-hover:text-emerald-100 transition-colors">
                      {insight.title}
                    </h4>
                    <p className="text-slate-300 text-sm font-medium leading-relaxed">
                      {insight.insight}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                          Confidence
                        </span>
                        <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-1000"
                            style={{ width: insight.confidence }}
                          />
                        </div>
                      </div>
                      <span className="text-lg font-bold text-emerald-400">
                        {insight.confidence}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="mt-8 flex justify-center">
              <button className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 rounded-2xl font-bold text-white shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-500/50">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <span>Generate Advanced Insights</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ExecutiveDashboard.displayName = 'ExecutiveDashboard';

export default ExecutiveDashboard;
