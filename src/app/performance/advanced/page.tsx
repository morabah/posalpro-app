/**
 * PosalPro MVP2 - Advanced Performance Dashboard Page
 * Showcases comprehensive performance monitoring and optimization
 *
 * Phase 7 Implementation: Advanced Performance Infrastructure
 */

import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamic import for heavy performance dashboard
const AdvancedPerformanceDashboard = dynamic(
  () => import('@/components/performance/AdvancedPerformanceDashboard'),
  {
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Performance Dashboard...</p>
        </div>
      </div>
    )
  }
);

export const metadata: Metadata = {
  title: 'Advanced Performance Dashboard | PosalPro MVP2',
  description:
    'Comprehensive performance monitoring, optimization, and analytics dashboard with real-time metrics and mobile optimization.',
  keywords: [
    'performance',
    'optimization',
    'monitoring',
    'analytics',
    'dashboard',
    'web vitals',
    'bundle analysis',
  ],
};

export default function AdvancedPerformancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdvancedPerformanceDashboard
        showAdvancedMetrics={true}
        enableRealTimeUpdates={true}
        refreshInterval={15000}
        userRole="developer"
        enableMobileOptimization={true}
        enableAutomaticOptimization={false}
        className="w-full"
      />
    </div>
  );
}
