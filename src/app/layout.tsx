/**
 * PosalPro MVP2 - Root Layout
 * Global layout with error boundaries and providers
 */

import { ToastProvider } from '@/components/feedback/Toast/ToastProvider';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SharedAnalyticsProvider } from '@/components/providers/SharedAnalyticsProvider';
import { TTFBOptimizationProvider } from '@/components/providers/TTFBOptimizationProvider';
import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider';
import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PosalPro MVP2',
  description: 'Advanced proposal management platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ CRITICAL: Add critical CSS to prevent CLS */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* ✅ CRITICAL: Prevent layout shifts */
              * { box-sizing: border-box; }
              body { font-display: swap; }
              img { max-width: 100%; height: auto; }
              .dynamic-content { min-height: 100px; min-width: 100px; }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <TTFBOptimizationProvider>
          <WebVitalsProvider>
            <SharedAnalyticsProvider>
              <ClientLayoutWrapper>
                <QueryProvider>
                  <ToastProvider position="top-right" maxToasts={5}>
                    <AuthProvider>{children}</AuthProvider>
                  </ToastProvider>
                </QueryProvider>
              </ClientLayoutWrapper>
            </SharedAnalyticsProvider>
          </WebVitalsProvider>
        </TTFBOptimizationProvider>
      </body>
    </html>
  );
}
