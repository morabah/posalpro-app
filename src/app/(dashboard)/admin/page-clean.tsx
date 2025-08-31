/**
 * PosalPro MVP2 - Admin System Interface (Modern Migration)
 * Based on ADMIN_SCREEN.md wireframe specifications and ADMIN_MIGRATION_ASSESSMENT.md
 * Modern implementation using feature-based architecture and Zustand state management
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 *
 * Reference Documents:
 * - CORE_REQUIREMENTS.md: Non-negotiable standards and patterns
 * - MIGRATION_LESSONS.md: Real-world patterns and anti-patterns
 * - ADMIN_MIGRATION_ASSESSMENT.md: Complete implementation blueprint
 * - PROJECT_REFERENCE.md: Platform engineering standards
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { AdminSystemClient } from './AdminSystemClient';

// ====================
// Metadata with SEO Optimization
// ====================

export const metadata: Metadata = {
  title: 'Admin System | PosalPro',
  description:
    'Comprehensive admin dashboard with user management, system monitoring, and configuration tools. Advanced analytics, role-based access control, and real-time performance insights.',
  keywords: [
    'admin',
    'dashboard',
    'user management',
    'system monitoring',
    'analytics',
    'rbac',
    'configuration',
    'posalpro',
    'enterprise',
    'administration',
  ],
  authors: [{ name: 'PosalPro Team' }],
  creator: 'PosalPro',
  publisher: 'PosalPro',
  robots: {
    index: false, // Admin pages should not be indexed
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/admin',
    title: 'Admin System | PosalPro',
    description:
      'Comprehensive admin dashboard with user management, system monitoring, and configuration tools.',
    siteName: 'PosalPro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admin System | PosalPro',
    description:
      'Comprehensive admin dashboard with user management, system monitoring, and configuration tools.',
    creator: '@posalpro',
  },
};

// ====================
// Viewport Configuration (Next.js 15+)
// ====================

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// ====================
// Generate Structured Data
// ====================

function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Admin System',
    description:
      'Comprehensive admin dashboard with user management, system monitoring, and configuration tools.',
    url: '/admin',
    isPartOf: {
      '@type': 'WebSite',
      name: 'PosalPro',
      url: '/',
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Admin Functions',
      description: 'Administrative functions and system management tools',
    },
  };
}

// ====================
// Enhanced Loading Skeleton
// ====================

function AdminSystemSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading admin dashboard">
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

      {/* Tabs Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="flex space-x-8">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
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
    </div>
  );
}

// ====================
// Server Component (Admin Page)
// ====================

export default function AdminSystem() {
  const structuredData = generateStructuredData();

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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
              <li className="text-gray-900 font-medium">Admin System</li>
            </ol>
          </nav>

          {/* Main Content with Suspense Boundary */}
          <Suspense fallback={<AdminSystemSkeleton />}>
            <AdminSystemClient />
          </Suspense>
        </div>
      </div>
    </>
  );
}
