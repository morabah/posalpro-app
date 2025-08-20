'use client';

import { ProductCreationForm } from '@/components/products/ProductCreationForm';
import { Button } from '@/components/ui/forms/Button';
import { ProductsListSkeleton } from '@/components/ui/LoadingStates';
import { useCreateProduct } from '@/hooks/useProducts';
import { useResponsive } from '@/hooks/useResponsive';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Lazy load components for better performance
const ProductList = dynamic(() => import('@/components/products/ProductList'), {
  loading: () => <ProductsListSkeleton />,
});

const ProductFilters = dynamic(() => import('@/components/products/ProductFilters'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>,
});

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    tags: [] as string[],
    priceRange: { min: null as number | null, max: null as number | null },
    isActive: undefined as boolean | undefined,
  });
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const hasInitializedView = useRef(false);

  // Default: list on desktop, cards on mobile/tablet
  useEffect(() => {
    if (!hasInitializedView.current) {
      setViewMode(isDesktop ? 'list' : 'cards');
      hasInitializedView.current = true;
    }
  }, [isDesktop]);

  const onFiltersChange = useCallback(
    (f: {
      categories: string[];
      status: string[];
      priceRange: { min: number | null; max: number | null };
      tags: string[];
    }) => {
      // Map status -> isActive
      const includesActive = f.status.includes('active');
      const includesInactive = f.status.includes('inactive');
      const mappedIsActive =
        includesActive && !includesInactive
          ? true
          : includesInactive && !includesActive
            ? false
            : undefined;

      setFilters({
        categories: f.categories,
        tags: f.tags,
        priceRange: { min: f.priceRange.min, max: f.priceRange.max },
        isActive: mappedIsActive,
      });
    },
    []
  );

  const categoryParam = useMemo(
    () => (filters.categories.length ? filters.categories : undefined),
    [filters.categories]
  );
  const tagsParam = useMemo(() => (filters.tags.length ? filters.tags : undefined), [filters.tags]);
  const priceRangeParam = useMemo(() => {
    const { min, max } = filters.priceRange;
    return min !== null && max !== null ? { min, max } : undefined;
  }, [filters.priceRange]);

  const handleCreateSubmit = useCallback(
    async (data: {
      name: string;
      description?: string;
      sku: string;
      price: number;
      currency?: string;
      category?: string[];
      tags?: string[];
      attributes?: Record<string, unknown>;
      images?: string[];
      userStoryMappings?: string[];
    }) => {
      await createProduct.mutateAsync(data);
      setIsCreateOpen(false);
      // Invalidate products queries to refresh list
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      // Optional soft UX confirmation (non-blocking)
      // toast.success('Product created successfully');
    },
    [createProduct, queryClient]
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search products"
            />
          </div>
          {/* Sort controls */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              aria-label="Sort by"
            >
              <option value="createdAt">Newest</option>
              <option value="updatedAt">Recently updated</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              aria-label="Sort order"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
          {/* View toggle */}
          <div
            className="inline-flex rounded-lg border border-gray-300 overflow-hidden"
            role="group"
            aria-label="View mode"
          >
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
          <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            Create Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>}>
              <ProductFilters onFiltersChange={onFiltersChange} />
            </Suspense>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Suspense fallback={<ProductsListSkeleton />}>
            <ProductList
              search={search || undefined}
              categories={categoryParam}
              tags={tagsParam}
              priceRange={priceRangeParam}
              isActive={filters.isActive}
              sortBy={sortBy}
              sortOrder={sortOrder}
              showSearch={false}
              viewMode={viewMode}
              onView={id => router.push(`/products/management?id=${id}`)}
              onEdit={() => setIsCreateOpen(true)}
            />
          </Suspense>
        </div>
      </div>

      {/* Creation Modal */}
      <ProductCreationForm
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
}
