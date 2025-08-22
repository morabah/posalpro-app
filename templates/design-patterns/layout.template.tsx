// __FILE_DESCRIPTION__: Route-group layout template with provider stack
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logDebug } from '@/lib/logger';

// Import providers in dependency order
// import { TTFBOptimizationProvider } from '@/components/providers/TTFBOptimizationProvider';
// import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider';
// import { SharedAnalyticsProvider } from '@/components/providers/SharedAnalyticsProvider';
// import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
// import { QueryProvider } from '@/components/providers/QueryProvider';
// import { ToastProvider } from '@/components/providers/ToastProvider';
// import { AuthProvider } from '@/components/providers/AuthProvider';
// import { ProtectedLayout } from '@/components/layout/ProtectedLayout';

// Force dynamic rendering for session-dependent layouts
export const dynamic = 'force-dynamic';

export type __LAYOUT_NAME__LayoutProps = {
  children: React.ReactNode;
};

export default async function __LAYOUT_NAME__Layout({ children }: __LAYOUT_NAME__LayoutProps) {
  // Get server session to prevent client-side loading stalls
  const session = await getServerSession(authOptions);

  logDebug('Layout render', {
    component: '__LAYOUT_NAME__Layout',
    operation: 'render',
    hasSession: !!session,
    userStory: '__USER_STORY__',
    hypothesis: '__HYPOTHESIS__',
  });

  return (
    <html lang="en">
      <body>
        {/* Provider stack in dependency order per CORE_REQUIREMENTS.md */}
        {/*
        <TTFBOptimizationProvider>
          <WebVitalsProvider>
            <SharedAnalyticsProvider>
              <ClientLayoutWrapper>
                <QueryProvider>
                  <ToastProvider>
                    <AuthProvider session={session}>
                      <ProtectedLayout>
                        {children}
                      </ProtectedLayout>
                    </AuthProvider>
                  </ToastProvider>
                </QueryProvider>
              </ClientLayoutWrapper>
            </SharedAnalyticsProvider>
          </WebVitalsProvider>
        </TTFBOptimizationProvider>
        */}

        {/* Simplified version - replace with actual provider stack */}
        <div data-testid="__LAYOUT_NAME__-layout">
          {children}
        </div>
      </body>
    </html>
  );
}
