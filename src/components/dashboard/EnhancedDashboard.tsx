/**
 * Enhanced PosalPro Dashboard with Business-Priority Layout
 * Optimized chart types and data consistency
 * Based on business requirements analysis
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { memo, useEffect, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

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

// Enhanced KPI Card with better business context
const EnhancedKPICard = memo(({ 
  title, 
  value, 
  subtitle, 
  change, 
  icon, 
  color, 
  target,
  loading 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
  target?: number;
  loading?: boolean;
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>{icon}</div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          
          {change !== undefined && (
            <div className="flex items-center">
              {change >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        
        {target && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${colorClasses[color].includes('green') ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, (Number(value) / target) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </Card>
  );
});
EnhancedKPICard.displayName = 'EnhancedKPICard';

// Revenue Trend Chart
const RevenueTrendChart = memo(({ data, loading }: { data: RevenueData[]; loading: boolean }) => {
  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-64"></div>;
  }

  // Handle empty data or invalid values
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Revenue Trends</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No revenue data available
        </div>
      </Card>
    );
  }

  // Safely calculate max value with fallback
  const allValues = data.flatMap(d => [d.revenue || 0, d.target || 0]).filter(v => !isNaN(v) && v > 0);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100000;
  
  // Ensure we have valid data points
  const validData = data.filter(d => d.month && !isNaN(d.revenue || 0) && !isNaN(d.target || 0));
  
  if (validData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Revenue Trends</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Invalid revenue data
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Revenue Trends</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Actual</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-gray-400 rounded-full"></div>
            <span>Target</span>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <svg viewBox="0 0 400 200" className="w-full h-full">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="40"
              y1={20 + i * 40}
              x2="380"
              y2={20 + i * 40}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Revenue line */}
          {validData.length > 1 && (
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              points={validData.map((d, i) => {
                const x = 40 + (i * 340 / Math.max(1, validData.length - 1));
                const y = 180 - ((d.revenue || 0) / maxValue) * 160;
                return `${x},${y}`;
              }).join(' ')}
            />
          )}
          
          {/* Target line */}
          {validData.length > 1 && (
            <polyline
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeDasharray="5,5"
              points={validData.map((d, i) => {
                const x = 40 + (i * 340 / Math.max(1, validData.length - 1));
                const y = 180 - ((d.target || 0) / maxValue) * 160;
                return `${x},${y}`;
              }).join(' ')}
            />
          )}
          
          {/* Data points */}
          {validData.map((d, i) => {
            const x = 40 + (i * 340 / Math.max(1, validData.length - 1));
            const y = 180 - ((d.revenue || 0) / maxValue) * 160;
            
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3b82f6"
                />
                <text
                  x={x}
                  y="195"
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Card>
  );
});
RevenueTrendChart.displayName = 'RevenueTrendChart';

// Conversion Funnel Chart
const ConversionFunnelChart = memo(({ data, loading }: { data: ConversionFunnel[]; loading: boolean }) => {
  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-64"></div>;
  }

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Conversion Funnel</h3>
          <span className="text-sm text-gray-500">Lead to Win Journey</span>
        </div>
        <div className="h-32 flex items-center justify-center text-gray-500">
          No funnel data available
        </div>
      </Card>
    );
  }

  // Safely calculate max count with fallback
  const validCounts = data.map(d => d.count || 0).filter(c => !isNaN(c) && c >= 0);
  const maxCount = validCounts.length > 0 ? Math.max(...validCounts) : 1;
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Conversion Funnel</h3>
        <span className="text-sm text-gray-500">Lead to Win Journey</span>
      </div>
      
      <div className="space-y-3">
        {data.map((stage, index) => {
          const count = stage.count || 0;
          const conversionRate = stage.conversionRate || 0;
          const value = stage.value || 0;
          const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const isLast = index === data.length - 1;
          
          return (
            <div key={stage.stage || `stage-${index}`} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{stage.stage || 'Unknown Stage'}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{count}</span>
                  <span className="text-xs text-gray-500">({conversionRate.toFixed(1)}%)</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-8">
                  <div 
                    className={`h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      isLast ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(20, width)}%` }}
                  >
                    ${(value / 1000).toFixed(0)}K
                  </div>
                </div>
                
                {!isLast && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <ArrowTrendingDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
});
ConversionFunnelChart.displayName = 'ConversionFunnelChart';

// Risk Dashboard
const RiskDashboard = memo(({ risks, loading }: { risks: RiskIndicator[]; loading: boolean }) => {
  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-64"></div>;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'overdue': return <ClockIcon className="h-5 w-5" />;
      case 'at_risk': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'stalled': return <ArrowTrendingDownIcon className="h-5 w-5" />;
      default: return <ChartBarIcon className="h-5 w-5" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Risk Indicators</h3>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {risks.map((risk) => (
          <div 
            key={risk.type}
            className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getTypeIcon(risk.type)}
                <span className="font-medium capitalize">{risk.type.replace('_', ' ')}</span>
              </div>
              {risk.trend !== 0 && (
                <div className="flex items-center">
                  {risk.trend > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-xs ml-1">{Math.abs(risk.trend)}%</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold">{risk.count}</div>
            <div className="text-xs mt-1 opacity-75">
              {risk.severity.toUpperCase()} PRIORITY
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});
RiskDashboard.displayName = 'RiskDashboard';

export default function EnhancedDashboard() {
  const [kpis, setKpis] = useState<EnhancedKPIs | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [funnelData, setFunnelData] = useState<ConversionFunnel[]>([]);
  const [riskData, setRiskData] = useState<RiskIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiClient = useApiClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  useEffect(() => {
    const fetchEnhancedData = async () => {
      try {
        setLoading(true);
        setError(null);

        analytics('enhanced_dashboard_load_started', { component: 'EnhancedDashboard' }, 'low');

        // Fetch enhanced dashboard data
        const enhancedRes = await apiClient.get('/dashboard/enhanced-stats?fresh=1');

        if (enhancedRes && typeof enhancedRes === 'object' && 'success' in enhancedRes && 
            enhancedRes.success && 'data' in enhancedRes && enhancedRes.data) {
          const data = enhancedRes.data as {
            totalRevenue?: number;
            monthlyRevenue?: number;
            revenueGrowth?: number;
            totalProposals?: number;
            activeProposals?: number;
            wonProposals?: number;
            winRate?: number;
            avgProposalValue?: number;
            avgCycleTime?: number;
            overdueCount?: number;
            atRiskCount?: number;
            totalCustomers?: number;
            activeCustomers?: number;
            customerGrowth?: number;
            avgCustomerValue?: number;
            proposalGrowth?: number;
            stalledCount?: number;
            revenueHistory?: Array<{
              month?: string;
              revenue?: number;
              target?: number;
              proposals?: number;
            }>;
            conversionFunnel?: Array<{
              stage?: string;
              count?: number;
              conversionRate?: number;
              value?: number;
            }>;
          };

          // Use real enhanced KPIs from API
          const enhancedKpis: EnhancedKPIs = {
            totalRevenue: data.totalRevenue || 0,
            monthlyRevenue: data.monthlyRevenue || 0,
            revenueGrowth: data.revenueGrowth || 0,
            
            totalProposals: data.totalProposals || 0,
            activeProposals: data.activeProposals || 0,
            wonProposals: data.wonProposals || 0,
            winRate: data.winRate || 0,
            avgProposalValue: data.avgProposalValue || 0,
            
            avgCycleTime: data.avgCycleTime || 21,
            overdueCount: data.overdueCount || 0,
            atRiskCount: data.atRiskCount || 0,
            
            totalCustomers: data.totalCustomers || 0,
            activeCustomers: data.activeCustomers || 0,
            customerGrowth: data.customerGrowth || 0,
            avgCustomerValue: data.avgCustomerValue || 0,
          };

          setKpis(enhancedKpis);

          // Use real revenue history data from API
          const revenueHistory = data.revenueHistory || [];
          const revenueDataFromAPI: RevenueData[] = revenueHistory.map((item) => ({
            month: item.month || '',
            revenue: item.revenue || 0,
            target: item.target || 0,
            proposals: item.proposals || 0,
          }));
          setRevenueData(revenueDataFromAPI);

          // Use real funnel data from API
          const conversionFunnel = data.conversionFunnel || [];
          const funnelDataFromAPI: ConversionFunnel[] = conversionFunnel.map((item) => ({
            stage: item.stage || '',
            count: item.count || 0,
            conversionRate: item.conversionRate || 0,
            value: item.value || 0,
          }));
          setFunnelData(funnelDataFromAPI);

          // Use real risk data from API
          const riskDataFromAPI: RiskIndicator[] = [
            { type: 'overdue', count: enhancedKpis.overdueCount, severity: 'high', trend: data.proposalGrowth || 0 },
            { type: 'at_risk', count: enhancedKpis.atRiskCount, severity: 'medium', trend: -2 },
            { type: 'stalled', count: data.stalledCount || 0, severity: 'low', trend: 0 },
          ];
          setRiskData(riskDataFromAPI);

          analytics('enhanced_dashboard_load_success', { 
            component: 'EnhancedDashboard',
            kpiCount: Object.keys(enhancedKpis).length 
          }, 'low');
        }
      } catch (error) {
        setError('Failed to load enhanced dashboard data');
        analytics('enhanced_dashboard_load_error', { 
          component: 'EnhancedDashboard',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'medium');
      } finally {
        setLoading(false);
      }
    };

    fetchEnhancedData();
  }, [apiClient, analytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (error && !kpis) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load enhanced dashboard</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Business-Priority KPI Grid */}
      <section aria-labelledby="primary-kpis">
        <h2 id="primary-kpis" className="text-xl font-semibold mb-6">Business Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedKPICard
            title="Monthly Revenue"
            value={formatCurrency(kpis?.monthlyRevenue || 0)}
            subtitle="Current month"
            change={kpis?.revenueGrowth}
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
            color="green"
            target={kpis ? kpis.monthlyRevenue * 1.2 : undefined}
            loading={loading}
          />
          
          <EnhancedKPICard
            title="Win Rate"
            value={`${kpis?.winRate || 0}%`}
            subtitle={`${kpis?.wonProposals || 0} won proposals`}
            icon={<TrophyIcon className="h-6 w-6" />}
            color="blue"
            target={75}
            loading={loading}
          />
          
          <EnhancedKPICard
            title="Active Pipeline"
            value={kpis?.activeProposals || 0}
            subtitle={formatCurrency(kpis?.avgProposalValue || 0) + ' avg value'}
            icon={<DocumentTextIcon className="h-6 w-6" />}
            color="purple"
            loading={loading}
          />
          
          <EnhancedKPICard
            title="Risk Indicators"
            value={kpis?.overdueCount || 0}
            subtitle="Overdue proposals"
            icon={<ExclamationTriangleIcon className="h-6 w-6" />}
            color="red"
            loading={loading}
          />
        </div>
      </section>

      {/* Revenue and Performance Charts */}
      <section aria-labelledby="revenue-performance">
        <h2 id="revenue-performance" className="text-xl font-semibold mb-6">Revenue & Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueTrendChart data={revenueData} loading={loading} />
          <ConversionFunnelChart data={funnelData} loading={loading} />
        </div>
      </section>

      {/* Risk Management */}
      <section aria-labelledby="risk-management">
        <h2 id="risk-management" className="text-xl font-semibold mb-6">Risk Management</h2>
        <RiskDashboard risks={riskData} loading={loading} />
      </section>

      {/* Secondary KPIs */}
      <section aria-labelledby="operational-kpis">
        <h2 id="operational-kpis" className="text-xl font-semibold mb-6">Operational Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EnhancedKPICard
            title="Avg Cycle Time"
            value={`${kpis?.avgCycleTime || 0} days`}
            subtitle="Proposal to close"
            icon={<ClockIcon className="h-6 w-6" />}
            color="yellow"
            target={14}
            loading={loading}
          />
          
          <EnhancedKPICard
            title="Customer Growth"
            value={kpis?.customerGrowth || 0}
            subtitle={`${kpis?.activeCustomers || 0} active customers`}
            change={5}
            icon={<UsersIcon className="h-6 w-6" />}
            color="indigo"
            loading={loading}
          />
          
          <EnhancedKPICard
            title="Avg Customer Value"
            value={formatCurrency(kpis?.avgCustomerValue || 0)}
            subtitle="Lifetime value"
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
            color="green"
            loading={loading}
          />
        </div>
      </section>
    </div>
  );
}
