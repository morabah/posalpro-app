// Layout Template for Migration from Bridge Pattern (aligned with dashboard)
// Provider Stack Order (CRITICAL)

import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { TTFBOptimizationProvider } from '@/components/providers/TTFBOptimizationProvider';
import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider';
import { SharedAnalyticsProvider } from '@/components/providers/SharedAnalyticsProvider';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { ToastProvider } from '@/components/feedback/Toast/ToastProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { ServiceWorkerWrapper } from '@/components/pwa/ServiceWorkerWrapper';
import { GlobalStateProvider } from '@/lib/bridges/StateBridge';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <TTFBOptimizationProvider>
      <WebVitalsProvider>
        <SharedAnalyticsProvider>
          <ClientLayoutWrapper>
            <ToastProvider position="top-right" maxToasts={5}>
              <AuthProvider session={session}>
                <GlobalStateProvider>
                  <ProtectedLayout>{children}</ProtectedLayout>
                </GlobalStateProvider>
              </AuthProvider>
            </ToastProvider>
          </ClientLayoutWrapper>
        </SharedAnalyticsProvider>
      </WebVitalsProvider>
      <ServiceWorkerWrapper />
    </TTFBOptimizationProvider>
  );
}
