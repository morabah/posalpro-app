/**
 * PosalPro MVP2 - Infinite Scroll List Component
 * Reusable component for infinite scrolling with React Query infinite queries
 * Includes loading states, error handling, and intersection observer
 */

import React, { useEffect, useRef } from 'react';
import { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';

interface PageData<T> {
  items: T[];
  nextCursor: string | null;
}

interface InfiniteScrollListProps<T> {
  query: UseInfiniteQueryResult<InfiniteData<PageData<T>, unknown>, Error>;
  renderItem: (item: T, index: number) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  loadMoreThreshold?: number; // Distance from bottom to trigger load more (in pixels)
}

export function InfiniteScrollList<T>({
  query,
  renderItem,
  loadingComponent,
  errorComponent,
  emptyComponent,
  className = '',
  itemClassName = '',
  loadMoreThreshold = 200,
}: InfiniteScrollListProps<T>) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = query;

  const items: T[] = data?.pages.flatMap((page: PageData<T>) => page.items) ?? [];

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          fetchNextPage();
        }
      },
      {
        rootMargin: `${loadMoreThreshold}px`,
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, loadMoreThreshold]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`infinite-scroll-list ${className}`}>
        {loadingComponent || (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`infinite-scroll-list ${className}`}>
        {errorComponent || (
          <div className="flex items-center justify-center py-8 text-red-600">
            <span>Error: {error?.message || 'Failed to load data'}</span>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={`infinite-scroll-list ${className}`}>
        {emptyComponent || (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <span>No items found</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`infinite-scroll-list ${className}`}>
      {/* Render items */}
      {items.map((item: T, index: number) => (
        <div key={`item-${index}`} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="load-more-trigger">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading more...</span>
          </div>
        )}
        {!hasNextPage && items.length > 0 && (
          <div className="text-center py-4 text-gray-500">
            No more items to load
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for manual load more (alternative to intersection observer)
export function useManualLoadMore<T>(
  query: UseInfiniteQueryResult<InfiniteData<PageData<T>, unknown>, Error>
) {
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    loadMore,
    canLoadMore: hasNextPage && !isFetchingNextPage,
    isLoading: isFetchingNextPage,
  };
}
