'use client';

import { Card } from '@/components/ui/Card';
import { Suspense, lazy, useEffect, useState } from 'react';
import FeatureGate from '@/components/entitlements/FeatureGate';

// ✅ PERFORMANCE: Lazy load heavy analytics components
const AnalyticsDashboardLazy = lazy(() =>
  import('@/components/analytics/AnalyticsDashboard').then(module => ({
    default: module.AnalyticsDashboard,
  }))
);
const HypothesisTrackingDashboardLazy = lazy(() =>
  import('@/components/analytics/HypothesisTrackingDashboard').then(module => ({
    default: module.HypothesisTrackingDashboard,
  }))
);

// ✅ PERFORMANCE: Fast loading skeleton components
function AnalyticsHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Monitor performance metrics, user stories, and hypothesis validation
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </Card>
  );
}

function HypothesisSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    </Card>
  );
}

// ✅ PERFORMANCE: Track page load time
function usePageLoadTime() {
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const timer = setTimeout(() => {
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return loadTime;
}

export default function AnalyticsPage() {
  const loadTime = usePageLoadTime();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="space-y-8">
      {/* ✅ PERFORMANCE: Fast-loading header loads immediately */}
      <AnalyticsHeader />

      {/* ✅ PERFORMANCE: Show load time for monitoring */}
      {loadTime && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
          ⚡ Page shell loaded in {loadTime.toFixed(0)}ms
        </div>
      )}

      {/* ✅ PERFORMANCE: Only render analytics components on client-side */}
      {isClient && (
        <>
          {/* ✅ PERFORMANCE: Lazy load main analytics dashboard */}
          <FeatureGate
            featureKey="feature.analytics.dashboard"
            bannerTitle="Analytics Dashboard Locked"
            bannerDescription="Upgrade your plan to access the analytics dashboard."
            bannerCtaLabel="View plans"
            bannerHref="/pricing"
          >
            <Suspense fallback={<DashboardSkeleton />}>
              <AnalyticsDashboardLazy />
            </Suspense>
          </FeatureGate>

          {/* ✅ PERFORMANCE: Lazy load hypothesis tracking */}
          <FeatureGate
            featureKey="feature.analytics.insights"
            bannerTitle="Insights Locked"
            bannerDescription="Enable Insights to unlock hypothesis tracking and recent activity."
            bannerCtaLabel="Contact admin"
            bannerHref="/support"
          >
            <Suspense fallback={<HypothesisSkeleton />}>
              <HypothesisTrackingDashboardLazy />
            </Suspense>
          </FeatureGate>
        </>
      )}
    </div>
  );
}
