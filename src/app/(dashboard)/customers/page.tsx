'use client';

import { CustomersListSkeleton } from '@/components/ui/LoadingStates';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { Button } from '@/components/ui/forms/Button';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';

// ✅ PERFORMANCE: Lazy load heavy CustomerList component
const CustomerListLazy = lazy(() => import('@/components/customers/CustomerList'));
const CustomerCreationSidebar = dynamic(
  () => import('@/components/customers/CustomerCreationSidebar').then(m => ({ default: m.CustomerCreationSidebar })),
  { ssr: false }
);

// ✅ PERFORMANCE: Fast loading skeleton component
function FastCustomersHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
      <p className="text-gray-600 mt-2">Manage your customer relationships and data</p>
    </div>
  );
}

// ✅ PERFORMANCE: Track page load time
function usePageLoadTime() {
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();

    const timer = setTimeout(() => {
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return loadTime;
}

export default function CustomersPage() {
  const loadTime = usePageLoadTime();
  const { isDesktop } = useResponsive();
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const hasInitializedView = useRef(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasInitializedView.current) {
      setViewMode(isDesktop ? 'list' : 'cards');
      hasInitializedView.current = true;
    }
  }, [isDesktop]);

  return (
    <div className="space-y-6">
      {/* ✅ PERFORMANCE: Fast-loading header loads immediately */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <FastCustomersHeader />
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">Create Customer</Button>
        </div>
      </div>

      {/* ✅ PERFORMANCE: Show load time for monitoring */}
      {loadTime && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
          ⚡ Page shell loaded in {loadTime.toFixed(0)}ms
        </div>
      )}

      {/* View mode toggle */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden" role="group" aria-label="View mode">
          <button
            type="button"
            className={`px-3 py-2 text-sm min-h-[44px] ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'}`}
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            aria-label="List view"
          >
            List
          </button>
          <button
            type="button"
            className={`px-3 py-2 text-sm min-h-[44px] border-l border-gray-300 ${viewMode === 'cards' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'}`}
            onClick={() => setViewMode('cards')}
            aria-pressed={viewMode === 'cards'}
            aria-label="Cards view"
          >
            Cards
          </button>
        </div>
      </div>

      {/* ✅ PERFORMANCE: Lazy load heavy component with fallback */}
      <Suspense fallback={<CustomersListSkeleton />}>
        <CustomerListLazy viewMode={viewMode} />
      </Suspense>

      <CustomerCreationSidebar
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={async () => {
          setIsCreateOpen(false);
          await queryClient.invalidateQueries({ queryKey: ['customers'] });
        }}
      />
    </div>
  );
}
