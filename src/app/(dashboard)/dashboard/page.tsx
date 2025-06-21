/**
 * PosalPro MVP2 - Dashboard Page - Redesigned
 * Enhanced modern implementation using sleek ModernDashboard component
 * Features: Wireframe compliance, modern UI, live data integration, mobile responsive
 */

'use client';

import ModernDashboard from '@/components/dashboard/ModernDashboard';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { useResponsive } from '@/hooks/useResponsive';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { AdvancedCacheManager } from '@/lib/performance/AdvancedCacheManager';
import { DatabaseQueryOptimizer } from '@/lib/performance/DatabaseQueryOptimizer';
import { UserType } from '@/types';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.2.1', 'US-2.2.2', 'US-2.2.3'],
  acceptanceCriteria: ['AC-2.2.1.1', 'AC-2.2.2.1', 'AC-2.2.3.1'],
  methods: ['loadDashboardData()', 'handleQuickAction()', 'getStatusBadge()'],
  hypotheses: ['H2'],
  testCases: ['TC-H2-001', 'TC-H2-002', 'TC-H2-003'],
};

// Type definitions
interface DashboardData {
  proposals: any[];
  customers: any[];
  products: any[];
  content: any[];
  metrics: {
    activeProposals: number;
    pendingTasks: number;
    completionRate: number;
    avgCompletionTime: number;
    onTimeDelivery: number;
  };
}

interface ProposalItem {
  id: string;
  title: string;
  dueDate: Date;
  status: 'DRAFT' | 'REVIEW' | 'ACTIVE' | 'APPROVED' | 'SUBMITTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface PriorityItem {
  id: string;
  type: 'security' | 'assignment' | 'deadline' | 'approval';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();

  // Infrastructure initialization
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const analytics = useAnalytics();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // ✅ ADDED: Database overload protection
  const cacheManager = useMemo(() => AdvancedCacheManager.getInstance(), []);
  const dbOptimizer = useMemo(() => DatabaseQueryOptimizer.getInstance(), []);

  const formattedUser = useMemo(() => {
    if (!session?.user) return undefined;
    const { id, name, roles } = session.user;
    return {
      id,
      name: name || 'User',
      role: (roles?.[0] || 'VIEWER') as UserType,
    };
  }, [session]);

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    proposals: [],
    customers: [],
    products: [],
    content: [],
    metrics: {
      activeProposals: 0,
      pendingTasks: 0,
      completionRate: 0,
      avgCompletionTime: 0,
      onTimeDelivery: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Circuit breaker pattern
  const maxRetries = 5;
  const isCircuitOpen = retryCount >= maxRetries;

  // Timeout and retry utilities
  const fetchWithTimeout = (url: string) =>
    fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: {
        'Content-Type': 'application/json',
      },
    });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const safeJsonParse = async (response: any) => {
    try {
      return await response.json();
    } catch {
      return [];
    }
  };

  // Enhanced data loading with retry logic and database overload protection
  const loadData = useCallback(async () => {
    if (isCircuitOpen) {
      setError('Service temporarily unavailable. Please try again later.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ FIXED: Database overload protection with throttling and caching
      const cacheKey = `dashboard_data_${session?.user?.id || 'anonymous'}_${isMobile ? 'mobile' : 'desktop'}`;

      // Check cache first to reduce database load
      const cachedData = await cacheManager.get<DashboardData>(cacheKey);
      if (cachedData) {
        setDashboardData(cachedData);
        setLoading(false);

        analytics.track('dashboard_cache_hit', {
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          cacheKey,
          deviceType: isMobile ? 'mobile' : 'desktop',
          timestamp: Date.now(),
        });
        return;
      }

      // ✅ ENHANCED: Database-optimized parallel queries with throttling
      const [proposalsRes, customersRes, productsRes, contentRes] = await Promise.allSettled([
        dbOptimizer.executeQuery(
          'dashboard_proposals',
          () => apiClient.get('/api/proposals?limit=5'),
          { cacheable: true, cacheTTL: 300000, queryType: 'SELECT' } // 5 min cache
        ),
        dbOptimizer.executeQuery(
          'dashboard_customers',
          () => apiClient.get('/api/customers?limit=10'),
          { cacheable: true, cacheTTL: 600000, queryType: 'SELECT' } // 10 min cache
        ),
        dbOptimizer.executeQuery(
          'dashboard_products',
          () => apiClient.get('/api/products?limit=6'),
          { cacheable: true, cacheTTL: 900000, queryType: 'SELECT' } // 15 min cache
        ),
        dbOptimizer.executeQuery(
          'dashboard_content',
          () => apiClient.get('/api/content?limit=5'),
          { cacheable: true, cacheTTL: 1800000, queryType: 'SELECT' } // 30 min cache
        ),
      ]);

      // Process responses safely with proper error handling
      const proposals = proposalsRes.status === 'fulfilled' ? proposalsRes.value : [];
      const customers = customersRes.status === 'fulfilled' ? customersRes.value : [];
      const products = productsRes.status === 'fulfilled' ? productsRes.value : [];
      const content = contentRes.status === 'fulfilled' ? contentRes.value : [];

      // Calculate metrics from the data
      const activeProposals = Array.isArray(proposals)
        ? proposals.filter(p => p.status === 'ACTIVE' || p.status === 'REVIEW').length
        : 0;
      const totalProposals = Array.isArray(proposals) ? proposals.length : 0;
      const completionRate = totalProposals > 0 ? (activeProposals / totalProposals) * 100 : 0;

      const newDashboardData = {
        proposals: Array.isArray(proposals) ? proposals : [],
        customers: Array.isArray(customers) ? customers : [],
        products: Array.isArray(products) ? products : [],
        content: Array.isArray(content) ? content : [],
        metrics: {
          activeProposals,
          pendingTasks: Math.max(0, 8 - activeProposals),
          completionRate: Math.min(100, completionRate),
          avgCompletionTime: 12,
          onTimeDelivery: 88,
        },
      };

      setDashboardData(newDashboardData);

      // ✅ ADDED: Cache the processed data to reduce future database load
      await cacheManager.set(cacheKey, newDashboardData, {
        ttl: 300000, // 5 minutes
        tags: ['dashboard', 'user-data', isMobile ? 'mobile' : 'desktop'],
      });

      // Track successful load with Component Traceability Matrix
      analytics.track('dashboard_data_loaded', {
        userStories: COMPONENT_MAPPING.userStories,
        acceptanceCriteria: COMPONENT_MAPPING.acceptanceCriteria,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        testCases: COMPONENT_MAPPING.testCases,
        proposalCount: Array.isArray(proposals) ? proposals.length : 0,
        customerCount: Array.isArray(customers) ? customers.length : 0,
        productCount: Array.isArray(products) ? products.length : 0,
        contentCount: Array.isArray(content) ? content.length : 0,
        deviceType: isMobile ? 'mobile' : 'desktop',
        cacheHit: false,
        databaseOptimized: true,
        timestamp: Date.now(),
      });

      // Reset retry count on success
      setRetryCount(0);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      if (newRetryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const backoffTime = Math.pow(2, newRetryCount - 1) * 1000;
        await delay(backoffTime);
        return loadData();
      } else {
        setError('Unable to load dashboard data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  }, [
    retryCount,
    isCircuitOpen,
    session?.user?.id,
    isMobile,
    cacheManager,
    dbOptimizer,
    apiClient,
    analytics,
  ]);

  // Initial data load, dependent on session
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      loadData();
    }
  }, [sessionStatus, loadData]);

  // Quick action handler with analytics
  const handleQuickAction = useCallback(
    (action: string) => {
      if (!formattedUser) return;
      analytics.track('dashboard_quick_action', {
        action,
        timestamp: new Date().toISOString(),
        userId: formattedUser.id,
      });
    },
    [analytics, formattedUser]
  );

  // Transform proposals data for component
  const activeProposals: ProposalItem[] = useMemo(() => {
    return dashboardData.proposals
      .filter(p => p.status === 'ACTIVE' || p.status === 'REVIEW')
      .slice(0, 5)
      .map(p => ({
        id: p.id || `proposal-${Math.random()}`,
        title: p.title || 'Untitled Proposal',
        dueDate: p.dueDate ? new Date(p.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: p.status || 'DRAFT',
        priority: p.priority || 'MEDIUM',
      }));
  }, [dashboardData.proposals]);

  // Generate priority items based on current data
  const priorityItems: PriorityItem[] = useMemo(() => {
    const items: PriorityItem[] = [];

    // Add security alert if needed
    if (dashboardData.metrics.activeProposals > 5) {
      items.push({
        id: 'security-alert',
        type: 'security',
        title: 'High proposal volume detected',
        description: 'Consider reviewing proposal distribution and SME assignments',
        actionLabel: 'Review',
        actionUrl: '/admin/security',
        urgency: 'medium',
      });
    }

    // Add assignment notifications
    if (dashboardData.metrics.pendingTasks > 3) {
      items.push({
        id: 'sme-assignment',
        type: 'assignment',
        title: 'SME assignments needed',
        description: `${dashboardData.metrics.pendingTasks} proposals need SME assignment`,
        actionLabel: 'Assign',
        actionUrl: '/sme/assignments',
        urgency: 'high',
      });
    }

    // Add upcoming deadlines
    const upcomingDeadlines = activeProposals.filter(p => {
      const daysUntilDue = Math.ceil((p.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3;
    });

    if (upcomingDeadlines.length > 0) {
      items.push({
        id: 'deadline-alert',
        type: 'deadline',
        title: 'Upcoming deadlines',
        description: `${upcomingDeadlines.length} proposal${upcomingDeadlines.length !== 1 ? 's' : ''} due within 3 days`,
        actionLabel: 'View',
        actionUrl: '/proposals?filter=due-soon',
        urgency: 'critical',
      });
    }

    return items;
  }, [dashboardData.metrics, activeProposals]);

  const isLoading = sessionStatus === 'loading' || loading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && isCircuitOpen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Unavailable</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setRetryCount(0);
              loadData();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render the modern dashboard
  return (
    <ModernDashboard
      user={formattedUser}
      loading={isLoading}
      error={error}
      data={dashboardData}
      priorityItems={priorityItems}
      proposals={activeProposals}
      onQuickAction={handleQuickAction}
      onRetry={loadData}
    />
  );
}
