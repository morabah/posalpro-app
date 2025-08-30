// __FILE_DESCRIPTION__: Route-group layout template aligned with dashboard provider stack
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logDebug } from '@/lib/logger';

// Provider stack (match src/app/(dashboard)/layout.tsx)
import { TTFBOptimizationProvider } from '@/components/providers/TTFBOptimizationProvider';
import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider';
import { SharedAnalyticsProvider } from '@/components/providers/SharedAnalyticsProvider';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { ToastProvider } from '@/components/feedback/Toast/ToastProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { ServiceWorkerWrapper } from '@/components/pwa/ServiceWorkerWrapper';
import { GlobalStateProvider } from '@/lib/bridges/StateBridge';

// Force dynamic rendering for session-dependent layouts
export const dynamic = 'force-dynamic';

export type __LAYOUT_NAME__LayoutProps = {
  children: React.ReactNode;
};

export default async function __LAYOUT_NAME__Layout({ children }: __LAYOUT_NAME__LayoutProps) {
  const session = await getServerSession(authOptions);

  logDebug('Layout render', {
    component: '__LAYOUT_NAME__Layout',
    operation: 'render',
    hasSession: !!session,
    userStory: '__USER_STORY__',
    hypothesis: '__HYPOTHESIS__',
  });

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
