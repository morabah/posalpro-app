/**
 * Server page shell for Proposal Creation. Renders client wrapper with full layout.
 */
import { ToastProvider } from '@/components/feedback/Toast/ToastProvider';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SharedAnalyticsProvider } from '@/components/providers/SharedAnalyticsProvider';
import { TTFBOptimizationProvider } from '@/components/providers/TTFBOptimizationProvider';
import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider';
import { GlobalStateProvider } from '@/lib/bridges/StateBridge';
import { Suspense } from 'react';
import ClientPage from './ClientPage';

export default function ProposalCreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <TTFBOptimizationProvider>
        <WebVitalsProvider>
          <SharedAnalyticsProvider>
            <ClientLayoutWrapper>
              <QueryProvider>
                <ToastProvider position="top-right" maxToasts={5}>
                  <AuthProvider>
                    <GlobalStateProvider>
                      <ProtectedLayout>
                        <ClientPage />
                      </ProtectedLayout>
                    </GlobalStateProvider>
                  </AuthProvider>
                </ToastProvider>
              </QueryProvider>
            </ClientLayoutWrapper>
          </SharedAnalyticsProvider>
        </WebVitalsProvider>
      </TTFBOptimizationProvider>
    </Suspense>
  );
}
