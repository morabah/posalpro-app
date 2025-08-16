/**
 * PosalPro MVP2 - Dashboard Layout
 * Full provider stack scoped to authenticated dashboard area
 */

import { ProtectedLayout } from '@/components/layout';
import { ToastProvider } from '@/components/feedback/Toast/ToastProvider';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SharedAnalyticsProvider } from '@/components/providers/SharedAnalyticsProvider';
import { TTFBOptimizationProvider } from '@/components/providers/TTFBOptimizationProvider';
import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TTFBOptimizationProvider>
      <WebVitalsProvider>
        <SharedAnalyticsProvider>
          <ClientLayoutWrapper>
            <QueryProvider>
              <ToastProvider position="top-right" maxToasts={5}>
                <AuthProvider>
                  <ProtectedLayout>{children}</ProtectedLayout>
                </AuthProvider>
              </ToastProvider>
            </QueryProvider>
          </ClientLayoutWrapper>
        </SharedAnalyticsProvider>
      </WebVitalsProvider>
    </TTFBOptimizationProvider>
  );
}
