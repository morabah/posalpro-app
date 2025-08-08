/**
 * PosalPro MVP2 - Root Layout
 * Global layout with error boundaries and providers
 * 🚀 LCP OPTIMIZATION: Critical CSS, resource hints, font optimization
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

// ✅ CRITICAL: Font optimization for LCP improvement
// Following Lesson #30: Performance Optimization - Font Loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevent font loading from blocking rendering
  preload: true, // Preload the font for faster rendering
  fallback: ['system-ui', 'arial'], // Fallback fonts
});

export const metadata: Metadata = {
  title: 'PosalPro MVP2',
  description: 'Advanced proposal management platform',
  // ✅ CRITICAL: SEO and performance metadata
  keywords: ['proposal management', 'business development', 'sales'],
  authors: [{ name: 'PosalPro Team' }],
  creator: 'PosalPro',
  publisher: 'PosalPro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // ✅ CRITICAL: Performance optimization metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // ✅ CRITICAL: Mobile optimization
  themeColor: '#2563EB',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ CRITICAL: Resource hints for LCP optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* ✅ CRITICAL: Critical CSS to prevent CLS and improve LCP */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* ✅ CRITICAL: Prevent layout shifts and improve LCP */
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }

              html {
                font-family: ${inter.style.fontFamily}, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.5;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }

              body {
                font-display: swap;
                min-height: 100vh;
                overflow-x: hidden;
              }

              /* ✅ CRITICAL: Image optimization for LCP */
              img {
                max-width: 100%;
                height: auto;
                display: block;
              }

              /* ✅ CRITICAL: Prevent layout shifts */
              .dynamic-content {
                min-height: 100px;
                min-width: 100px;
                contain: layout style paint;
              }

              /* ✅ CRITICAL: Loading states for better perceived performance */
              .loading-skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
              }

              @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }

              /* ✅ CRITICAL: Critical rendering path optimization */
              .critical-content {
                contain: layout style paint;
                will-change: transform;
              }

              /* ✅ CRITICAL: Font loading optimization */
              .font-loading {
                font-display: swap;
                font-feature-settings: 'liga' 1, 'kern' 1;
              }

              /* ✅ CRITICAL: Performance optimization for large content */
              .lcp-optimized {
                contain: layout style paint;
                transform: translateZ(0);
                backface-visibility: hidden;
              }
            `,
          }}
        />

        {/* Removed session preload to avoid duplicate /api/auth/session calls */}

        {/* ✅ CRITICAL: DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//localhost" />
        <link rel="dns-prefetch" href="//api.localhost" />
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
