/**
 * PosalPro MVP2 - Advanced Performance Dashboard Page
 * Showcases comprehensive performance monitoring and optimization
 *
 * Phase 7 Implementation: Advanced Performance Infrastructure
 */

import AdvancedPerformanceDashboard from '@/components/performance/AdvancedPerformanceDashboard';
import { Metadata } from 'next';

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
