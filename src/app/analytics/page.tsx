/**
 * PosalPro MVP2 - Analytics Dashboard Page
 * Real-time hypothesis tracking and performance visualization
 * Component Traceability: US-5.1, US-5.2, H1, H4, H7, H8
 */

import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Analytics Dashboard - PosalPro',
  description: 'Real-time hypothesis validation tracking and performance analytics',
};

/**
 * Component Traceability Matrix:
 * - User Stories: US-5.1 (Analytics Dashboard), US-5.2 (Hypothesis Tracking)
 * - Acceptance Criteria: AC-5.1.1, AC-5.1.2, AC-5.2.1, AC-5.2.2
 * - Hypotheses: H1 (Content Search), H4 (Coordination), H7 (Timeline), H8 (Validation)
 * - Methods: trackHypothesisValidation(), measurePerformanceBaseline(), validateUserStory()
 * - Test Cases: TC-H1-001, TC-H4-001, TC-H7-001, TC-H8-001
 */
export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Real-time hypothesis validation tracking and performance measurement
          </p>
        </div>

        {/* Analytics Dashboard */}
        <Suspense fallback={<DashboardSkeleton />}>
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </div>
  );
}
