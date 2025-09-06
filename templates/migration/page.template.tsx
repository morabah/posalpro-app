// Page Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)
// User Story: __USER_STORY__ (e.g., US-1.1)
// Hypothesis: __HYPOTHESIS__ (e.g., H1)
//
// ✅ FOLLOWS: MIGRATION_LESSONS.md - Page-level patterns with proper error boundaries
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - SEO optimization and accessibility standards
// ✅ ALIGNS: Analytics integration and performance monitoring
// ✅ IMPLEMENTS: Modern Next.js App Router patterns with suspense boundaries

import React from 'react';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ProtectedLayout } from '@/components/layout';
import { __ENTITY__List_new } from '@/components/__RESOURCE__s_new/__ENTITY__List_new';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logInfo } from '@/lib/logger';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Metadata } from 'next';
import { Suspense } from 'react';

// ====================
// Metadata with SEO Optimization
// ====================

export const metadata: Metadata = {
  title: '__ENTITY__s Management | PosalPro',
  description:
    'Comprehensive __RESOURCE__ management dashboard with advanced filtering, analytics, and workflow automation. Streamline your __RESOURCE__ operations with powerful tools and insights.',
  keywords: [
    '__RESOURCE__s',
    'management',
    'dashboard',
    'analytics',
    'workflow',
    'posalpro',
    'business',
    'automation',
  ],
  authors: [{ name: 'PosalPro Team' }],
  creator: 'PosalPro',
  publisher: 'PosalPro',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/__RESOURCE__s',
    title: '__ENTITY__s Management | PosalPro',
    description:
      'Comprehensive __RESOURCE__ management dashboard with advanced filtering, analytics, and workflow automation.',
    siteName: 'PosalPro',
  },
  twitter: {
    card: 'summary_large_image',
    title: '__ENTITY__s Management | PosalPro',
    description:
      'Comprehensive __RESOURCE__ management dashboard with advanced filtering, analytics, and workflow automation.',
    creator: '@posalpro',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

// ====================
// Generate Structured Data
// ====================

function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '__ENTITY__s Management',
    description:
      'Comprehensive __RESOURCE__ management dashboard with advanced filtering, analytics, and workflow automation.',
    url: '/__RESOURCE__s',
    isPartOf: {
      '@type': 'WebSite',
      name: 'PosalPro',
      url: '/',
    },
    about: {
      '@type': 'Thing',
      name: '__ENTITY__ Management',
      description: 'Business __RESOURCE__ management and workflow automation',
    },
    mainEntity: {
      '@type': 'ItemList',
      name: '__ENTITY__s',
      description: 'List of __RESOURCE__s managed in the system',
    },
  };
}

// ====================
// Page Component (Server Component)
// ====================

export default function __ENTITY__sNewPage() {
  const structuredData = generateStructuredData();

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <ClientLayoutWrapper>
        <AuthProvider>
          <ProtectedLayout>
            <div className="min-h-screen bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="mb-6">
                  <ol className="flex items-center space-x-2 text-sm text-gray-500">
                    <li>
                      <a href="/dashboard" className="hover:text-gray-700">
                        Dashboard
                      </a>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li className="text-gray-900 font-medium">__ENTITY__s</li>
                  </ol>
                </nav>

                {/* Main Content with Suspense Boundary */}
                <main>
                  <Suspense fallback={<__ENTITY__ListSkeleton />}>
                    <__ENTITY__ListClient />
                  </Suspense>
                </main>
              </div>
            </div>
          </ProtectedLayout>
        </AuthProvider>
      </ClientLayoutWrapper>
    </>
  );
}

// ====================
// Client Component with Error Boundary
// ====================

function __ENTITY__ListClient() {
  return (
    <ErrorBoundary>
      <__ENTITY__List_new
        showHeader={false} // Header is handled by page layout
        showFilters={true}
        showActions={true}
        maxHeight="auto"
      />
    </ErrorBoundary>
  );
}

// ====================
// Error Boundary Component
// ====================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logInfo('Page error boundary caught error', {
      component: '__ENTITY__sNewPage',
      error: error.message,
      errorInfo,
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <__ENTITY__Error
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

// ====================
// Enhanced Loading Component
// ====================

function __ENTITY__ListSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading __RESOURCE__ data">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="sm:w-48">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-9 bg-gray-200 rounded w-20"></div>
          <div className="h-9 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="h-9 bg-gray-200 rounded w-24"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-4"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Load More Skeleton */}
      <div className="flex justify-center mt-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

// ====================
// Enhanced Error Component
// ====================

function __ENTITY__Error({ error, onRetry }: { error: any; onRetry: () => void }) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleRetry = () => {
    analytics('__RESOURCE___page_error_retry', {
      component: '__ENTITY__sNewPage',
      error: error?.message || 'Unknown error',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
    onRetry();
  };

  const handleGoToDashboard = () => {
    analytics('__RESOURCE___page_error_dashboard_redirect', {
      component: '__ENTITY__sNewPage',
      error: error?.message || 'Unknown error',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-[400px] bg-white rounded-lg border border-gray-200 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading __ENTITY__s</h1>
        <p className="text-gray-600 mb-6">
          {error?.message || 'An unexpected error occurred while loading the __RESOURCE__ data.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Retry loading __RESOURCE__ data"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            aria-label="Return to dashboard"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================
// Export Default
// ====================

export default __ENTITY__sNewPage;
