/**
 * PosalPro MVP2 - Virtual Scrolling Hook
 *
 * 🚀 PHASE 6 OPTIMIZATION: Virtual scrolling for memory reduction
 * Target: Reduce JS Heap from 284MB to <100MB
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface VirtualScrollingOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside viewport
  enableResizeObserver?: boolean;
}

interface VirtualScrollingState {
  startIndex: number;
  endIndex: number;
  visibleItems: number[];
  scrollTop: number;
  totalHeight: number;
  containerHeight: number;
}

export function useVirtualScrolling<T>(
  items: T[],
  options: VirtualScrollingOptions
) {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    enableResizeObserver = true,
  } = options;

  const [state, setState] = useState<VirtualScrollingState>({
    startIndex: 0,
    endIndex: Math.min(overscan * 2, items.length),
    visibleItems: [],
    scrollTop: 0,
    totalHeight: items.length * itemHeight,
    containerHeight,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);

  // ✅ CRITICAL: Calculate visible range based on scroll position
  const calculateVisibleRange = useCallback(
    (scrollTop: number, containerHeight: number) => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );

      return { startIndex, endIndex };
    },
    [itemHeight, items.length, overscan]
  );

  // ✅ CRITICAL: Update visible items when scroll position changes
  const updateVisibleItems = useCallback(
    (scrollTop: number, containerHeight: number) => {
      const { startIndex, endIndex } = calculateVisibleRange(scrollTop, containerHeight);
      const visibleItems = Array.from(
        { length: endIndex - startIndex },
        (_, i) => startIndex + i
      );

      setState(prev => ({
        ...prev,
        startIndex,
        endIndex,
        visibleItems,
        scrollTop,
        containerHeight,
      }));
    },
    [calculateVisibleRange]
  );

  // ✅ CRITICAL: Handle scroll events
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = event.currentTarget.scrollTop;
      scrollTopRef.current = scrollTop;
      updateVisibleItems(scrollTop, state.containerHeight);
    },
    [updateVisibleItems, state.containerHeight]
  );

  // ✅ CRITICAL: Scroll to specific item
  const scrollToItem = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      if (containerRef.current) {
        const scrollTop = index * itemHeight;
        containerRef.current.scrollTo({
          top: scrollTop,
          behavior,
        });
      }
    },
    [itemHeight]
  );

  // ✅ CRITICAL: Scroll to top
  const scrollToTop = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      scrollToItem(0, behavior);
    },
    [scrollToItem]
  );

  // ✅ CRITICAL: Get item at specific index
  const getItem = useCallback(
    (index: number): T | undefined => {
      return items[index];
    },
    [items]
  );

  // ✅ CRITICAL: Get visible items
  const getVisibleItems = useCallback((): T[] => {
    return state.visibleItems.map(index => items[index]).filter(Boolean);
  }, [state.visibleItems, items]);

  // ✅ CRITICAL: Update when items change
  useEffect(() => {
    const totalHeight = items.length * itemHeight;
    setState(prev => ({
      ...prev,
      totalHeight,
      endIndex: Math.min(prev.endIndex, items.length),
    }));
  }, [items.length, itemHeight]);

  // ✅ CRITICAL: Resize observer for dynamic container height
  useEffect(() => {
    if (!enableResizeObserver || !containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        if (newHeight !== state.containerHeight) {
          setState(prev => ({
            ...prev,
            containerHeight: newHeight,
          }));
          updateVisibleItems(scrollTopRef.current, newHeight);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [enableResizeObserver, state.containerHeight, updateVisibleItems]);

  // ✅ CRITICAL: Initial calculation
  useEffect(() => {
    updateVisibleItems(0, containerHeight);
  }, [updateVisibleItems, containerHeight]);

  return {
    // State
    startIndex: state.startIndex,
    endIndex: state.endIndex,
    visibleItems: state.visibleItems,
    scrollTop: state.scrollTop,
    totalHeight: state.totalHeight,
    containerHeight: state.containerHeight,

    // Refs
    containerRef,

    // Methods
    handleScroll,
    scrollToItem,
    scrollToTop,
    getItem,
    getVisibleItems,

    // Computed values
    isScrolling: scrollTopRef.current > 0,
    hasMoreItems: state.endIndex < items.length,
  };
}

/**
 * 🚀 PHASE 6: Memory-optimized virtual list component
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}) {
  const {
    startIndex,
    endIndex,
    totalHeight,
    containerRef,
    handleScroll,
  } = useVirtualScrolling(items, {
    itemHeight,
    containerHeight,
    overscan,
  });

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            left: 0,
            right: 0,
          }}
        >
          {items.slice(startIndex, endIndex).map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
