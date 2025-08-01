/**
 * PosalPro MVP2 - Enhanced Loading States
 * Addresses poor perceived performance identified in HTTP navigation test
 * Provides immediate visual feedback for slow-loading pages
 */

'use client';

import { memo, useEffect, useState } from 'react';
import { Card } from './Card';

// ✅ CRITICAL FIX: Loading states for slow pages (Products, Customers, etc.)

// Generic skeleton loader with animation
export const SkeletonLoader = memo(
  ({ className = '', height = 'h-4' }: { className?: string; height?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${height} ${className}`}></div>
  )
);

// Page-level loading with progress indication
export const PageLoader = memo(({ message = 'Loading...' }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-600">Please wait while we load your content...</p>
      <div className="mt-4 w-64 bg-gray-200 rounded-full h-2 mx-auto">
        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </div>
  </div>
));

// ✅ PRODUCTS PAGE: Specific loading skeleton
export const ProductsListSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Search and Filter Skeleton */}
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SkeletonLoader className="w-full max-w-md" height="h-10" />
        <SkeletonLoader className="w-32" height="h-6" />
      </div>
    </Card>

    {/* Products Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start justify-between mb-3">
            <SkeletonLoader className="w-3/4" height="h-5" />
            <SkeletonLoader className="w-16" height="h-6" />
          </div>
          <div className="space-y-2 mb-4">
            <SkeletonLoader className="w-full" height="h-3" />
            <SkeletonLoader className="w-5/6" height="h-3" />
            <SkeletonLoader className="w-4/6" height="h-3" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <SkeletonLoader className="w-12" height="h-4" />
              <SkeletonLoader className="w-20" height="h-4" />
            </div>
            <div className="flex justify-between">
              <SkeletonLoader className="w-16" height="h-4" />
              <SkeletonLoader className="w-24" height="h-4" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <SkeletonLoader className="w-16" height="h-8" />
            <SkeletonLoader className="w-16" height="h-8" />
          </div>
        </Card>
      ))}
    </div>
  </div>
));

// ✅ CUSTOMERS PAGE: Specific loading skeleton
export const CustomersListSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Search and Filter Skeleton */}
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <SkeletonLoader className="w-full max-w-md" height="h-10" />
        <div className="flex gap-2">
          <SkeletonLoader className="w-20" height="h-8" />
          <SkeletonLoader className="w-20" height="h-8" />
          <SkeletonLoader className="w-20" height="h-8" />
        </div>
        <SkeletonLoader className="w-32" height="h-6" />
      </div>
    </Card>

    {/* Customers Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <SkeletonLoader className="w-10 h-10 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonLoader className="w-24" height="h-5" />
                <SkeletonLoader className="w-32 mt-1" height="h-4" />
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <SkeletonLoader className="w-16" height="h-5" />
              <SkeletonLoader className="w-16" height="h-5" />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <SkeletonLoader className="w-16" height="h-4" />
              <SkeletonLoader className="w-20" height="h-4" />
            </div>
            <div className="flex justify-between">
              <SkeletonLoader className="w-20" height="h-4" />
              <SkeletonLoader className="w-24" height="h-4" />
            </div>
            <div className="flex justify-between">
              <SkeletonLoader className="w-18" height="h-4" />
              <SkeletonLoader className="w-28" height="h-4" />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex gap-1">
              <SkeletonLoader className="w-12" height="h-5" />
              <SkeletonLoader className="w-16" height="h-5" />
              <SkeletonLoader className="w-10" height="h-5" />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <SkeletonLoader className="w-16" height="h-8" />
            <SkeletonLoader className="w-16" height="h-8" />
          </div>
        </Card>
      ))}
    </div>
  </div>
));

// ✅ DASHBOARD: Specific loading skeleton
export const DashboardSkeleton = memo(() => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="mb-8">
      <SkeletonLoader className="w-64" height="h-8" />
      <SkeletonLoader className="w-96 mt-2" height="h-4" />
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <SkeletonLoader className="w-16" height="h-4" />
              <SkeletonLoader className="w-12 mt-2" height="h-8" />
            </div>
            <SkeletonLoader className="w-8 h-8 rounded" />
          </div>
        </Card>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <SkeletonLoader className="w-32" height="h-6" />
        <SkeletonLoader className="w-full mt-4" height="h-64" />
      </Card>
      <Card className="p-6">
        <SkeletonLoader className="w-40" height="h-6" />
        <SkeletonLoader className="w-full mt-4" height="h-64" />
      </Card>
    </div>
  </div>
));

// ✅ ANALYTICS PAGE: Specific loading skeleton
export const AnalyticsSkeleton = memo(() => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="mb-8">
      <SkeletonLoader className="w-48" height="h-8" />
      <SkeletonLoader className="w-80 mt-2" height="h-4" />
    </div>

    {/* Filter Controls */}
    <Card className="p-6">
      <div className="flex gap-4">
        <SkeletonLoader className="w-32" height="h-10" />
        <SkeletonLoader className="w-40" height="h-10" />
        <SkeletonLoader className="w-28" height="h-10" />
      </div>
    </Card>

    {/* Analytics Charts */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6">
          <SkeletonLoader className="w-40" height="h-6" />
          <SkeletonLoader className="w-full mt-4" height="h-48" />
        </Card>
      ))}
    </div>

    {/* Data Table */}
    <Card className="p-6">
      <SkeletonLoader className="w-32" height="h-6" />
      <div className="mt-6 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4">
            <SkeletonLoader height="h-4" />
            <SkeletonLoader height="h-4" />
            <SkeletonLoader height="h-4" />
            <SkeletonLoader height="h-4" />
            <SkeletonLoader height="h-4" />
          </div>
        ))}
      </div>
    </Card>
  </div>
));

// ✅ PERFORMANCE: Smart loading with timeout warnings
export const SmartLoader = memo(
  ({
    isLoading,
    children,
    skeleton: SkeletonComponent,
    timeoutWarning = 5000,
    message = 'Loading...',
  }: {
    isLoading: boolean;
    children: React.ReactNode;
    skeleton?: React.ComponentType;
    timeoutWarning?: number;
    message?: string;
  }) => {
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
      if (!isLoading) {
        setShowWarning(false);
        return;
      }

      const timer = setTimeout(() => {
        setShowWarning(true);
      }, timeoutWarning);

      return () => clearTimeout(timer);
    }, [isLoading, timeoutWarning]);

    if (!isLoading) {
      return <>{children}</>;
    }

    return (
      <div className="relative">
        {SkeletonComponent ? <SkeletonComponent /> : <PageLoader message={message} />}

        {showWarning && (
          <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex-shrink-0 animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-yellow-800">Taking longer than usual</p>
                <p className="text-xs text-yellow-600">Please check your connection</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Export all components
SkeletonLoader.displayName = 'SkeletonLoader';
PageLoader.displayName = 'PageLoader';
ProductsListSkeleton.displayName = 'ProductsListSkeleton';
CustomersListSkeleton.displayName = 'CustomersListSkeleton';
DashboardSkeleton.displayName = 'DashboardSkeleton';
AnalyticsSkeleton.displayName = 'AnalyticsSkeleton';
SmartLoader.displayName = 'SmartLoader';
