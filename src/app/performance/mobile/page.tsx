/**
 * PosalPro MVP2 - Mobile Performance Monitoring Dashboard
 * Phase 10: Advanced Mobile Responsiveness & Performance Monitoring
 * Component Traceability Matrix: US-8.1, US-8.2, US-8.3, H9, H11
 *
 * FEATURES:
 * - Real-time mobile performance analytics
 * - Touch interaction optimization metrics
 * - Viewport adaptation monitoring
 * - Progressive enhancement tracking
 * - Mobile-specific Web Vitals analysis
 */

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ProtectedLayout } from '@/components/layout';

// ✅ Dynamic import to prevent SSR issues
const MobileResponsivenessEnhancer = dynamic(
  () => import('@/components/mobile/MobileResponsivenessEnhancer'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 h-64 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading Mobile Performance Dashboard...</p>
      </div>
    )
  });

const MobilePerformanceDashboard = dynamic(() => import('./MobilePerformanceDashboard'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Performance Analytics...</p>
      </div>
    </div>
  )
});

export default function MobilePerformancePage() {
  const [isClient, setIsClient] = useState(false);

  // ✅ Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ Show loading state during hydration
  if (!isClient) {
    return (
      <ClientLayoutWrapper>
        <AuthProvider>
          <ProtectedLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Initializing Mobile Performance Dashboard...</p>
              </div>
            </div>
          </ProtectedLayout>
        </AuthProvider>
      </ClientLayoutWrapper>
    );
  }

  return (
    <ClientLayoutWrapper>
      <AuthProvider>
        <ProtectedLayout>
          <MobilePerformanceDashboard />
        </ProtectedLayout>
      </AuthProvider>
    </ClientLayoutWrapper>
  );
}
