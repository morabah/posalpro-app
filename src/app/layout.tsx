/**
 * PosalPro MVP2 - Root Layout
 * Global layout with error boundaries and providers
 * 🚀 LCP OPTIMIZATION: Critical CSS, resource hints, font optimization
 */

// Providers moved to segment layouts (e.g., (dashboard)/layout) to reduce /auth/* bundle size
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
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
  description: 'Enterprise proposal management platform with AI-powered optimization',
  // ✅ CRITICAL: SEO and performance metadata
  keywords: ['proposal management', 'business development', 'sales', 'enterprise', 'AI'],
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
  // ✅ CRITICAL: PWA metadata
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
    shortcut: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PosalPro',
  },
  applicationName: 'PosalPro',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // ✅ CRITICAL: Mobile optimization
  themeColor: '#2563EB',
  colorScheme: 'light',
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

        {/* ✅ CRITICAL: PWA meta tags */}
        <meta name="application-name" content="PosalPro" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PosalPro" />
        <meta
          name="description"
          content="Enterprise proposal management platform with AI-powered optimization"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#2563eb" />

        {/* ✅ CRITICAL: PWA icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/icon.svg" color="#2563eb" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* ✅ CRITICAL: PWA splash screens */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
