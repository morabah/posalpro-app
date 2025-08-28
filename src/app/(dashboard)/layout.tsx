/**
 * PosalPro MVP2 - Dashboard Layout
 * Full provider stack scoped to authenticated dashboard area
 */

import { ToastProvider } from '@/components/feedback/Toast/ToastProvider';
import { ProtectedLayout } from '@/components/layout';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SharedAnalyticsProvider } from '@/components/providers/SharedAnalyticsProvider';
import { TTFBOptimizationProvider } from '@/components/providers/TTFBOptimizationProvider';
import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider';
import { ServiceWorkerWrapper } from '@/components/pwa/ServiceWorkerWrapper';
import { authOptions } from '@/lib/auth';
import { GlobalStateProvider } from '@/lib/bridges/StateBridge';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Provide server session to AuthProvider to prevent client-side loading stalls
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
