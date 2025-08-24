// __FILE_DESCRIPTION__: Bridge-specific mobile component template with responsive design
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { use__BRIDGE_NAME__Bridge } from '@/hooks/use__BRIDGE_NAME__';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { debounce } from '@/lib/utils';
import React, { useCallback, useMemo, useState } from 'react';

// ✅ BRIDGE PATTERN: Mobile-specific types
interface __ENTITY_TYPE__MobileProps {
  className?: string;
  variant?: 'list' | 'grid' | 'compact';
  showSearch?: boolean;
  showFilters?: boolean;
  maxItems?: number;
  onItemPress?: (item: any) => void;
  onRefresh?: () => void;
}

// ✅ BRIDGE PATTERN: Mobile component with responsive design
export const __ENTITY_TYPE__Mobile: React.FC<__ENTITY_TYPE__MobileProps> = ({
  className = '',
  variant = 'list',
  showSearch = true,
  showFilters = true,
  maxItems = 20,
  onItemPress,
  onRefresh,
}) => {
  const errorHandlingService = ErrorHandlingService.getInstance();
  const { trackEvent } = useOptimizedAnalytics();
  const { handleError } = useErrorHandler();

  // ✅ BRIDGE PATTERN: Bridge integration
  const {
    __RESOURCE_NAME__,
    isLoading,
    error,
    create__ENTITY_TYPE__,
    update__ENTITY_TYPE__,
    delete__ENTITY_TYPE__,
    refetch,
  } = use__BRIDGE_NAME__Bridge();

  // ✅ BRIDGE PATTERN: Mobile state management
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // ✅ BRIDGE PATTERN: Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  // ✅ BRIDGE PATTERN: Debounced search implementation
  const debouncedSearchFunction = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
      logDebug('Mobile search updated', {
        component: '__ENTITY_TYPE__Mobile',
        operation: 'search',
        searchTerm: value,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    }, 300),
    []
  );

  // ✅ BRIDGE PATTERN: Handle search input
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      debouncedSearchFunction(value);
    },
    [debouncedSearchFunction]
  );

  // ✅ BRIDGE PATTERN: Filtered data with mobile optimizations
  const filteredData = useMemo(() => {
    if (!__RESOURCE_NAME__) return [];

    return __RESOURCE_NAME__
      .filter(item => {
        const matchesSearch =
          !debouncedSearch ||
          item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(debouncedSearch.toLowerCase()));

        const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

        return matchesSearch && matchesStatus;
      })
      .slice(0, maxItems);
  }, [__RESOURCE_NAME__, debouncedSearch, selectedStatus, maxItems]);

  // ✅ BRIDGE PATTERN: Handle item selection
  const handleItemSelect = useCallback(
    (itemId: string) => {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });

      trackEvent('__RESOURCE_NAME___mobile_item_select', {
        itemId,
        selected: !selectedItems.has(itemId),
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    },
    [selectedItems, trackEvent]
  );

  // ✅ BRIDGE PATTERN: Handle item press
  const handleItemPress = useCallback(
    (item: any) => {
      if (onItemPress) {
        onItemPress(item);
      }

      trackEvent('__RESOURCE_NAME___mobile_item_press', {
        itemId: item.id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    },
    [onItemPress, trackEvent]
  );

  // ✅ BRIDGE PATTERN: Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      logDebug('Mobile refresh start', {
        component: '__ENTITY_TYPE__Mobile',
        operation: 'refresh',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      await refetch();

      if (onRefresh) {
        onRefresh();
      }

      logInfo('Mobile refresh success', {
        component: '__ENTITY_TYPE__Mobile',
        operation: 'refresh',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    } catch (error) {
      const processed = errorHandlingService.processError(
        error,
        'Mobile refresh failed',
        'REFRESH_FAILED',
        { context: '__ENTITY_TYPE__Mobile/refresh' }
      );

      handleError(processed);

      logError('Mobile refresh failed', {
        component: '__ENTITY_TYPE__Mobile',
        operation: 'refresh',
        error: processed.message,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, onRefresh, errorHandlingService, handleError]);

  // ✅ BRIDGE PATTERN: Handle bulk operations
  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;

    try {
      logDebug('Mobile bulk delete start', {
        component: '__ENTITY_TYPE__Mobile',
        operation: 'bulkDelete',
        itemCount: selectedItems.size,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      const deletePromises = Array.from(selectedItems).map(id => delete__ENTITY_TYPE__(id));
      await Promise.all(deletePromises);

      setSelectedItems(new Set());

      logInfo('Mobile bulk delete success', {
        component: '__ENTITY_TYPE__Mobile',
        operation: 'bulkDelete',
        deletedCount: selectedItems.size,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    } catch (error) {
      const processed = errorHandlingService.processError(
        error,
        'Mobile bulk delete failed',
        'BULK_DELETE_FAILED',
        { context: '__ENTITY_TYPE__Mobile/bulkDelete' }
      );

      handleError(processed);

      logError('Mobile bulk delete failed', {
        component: '__ENTITY_TYPE__Mobile',
        operation: 'bulkDelete',
        error: processed.message,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    }
  }, [selectedItems, delete__ENTITY_TYPE__, errorHandlingService, handleError]);

  // ✅ BRIDGE PATTERN: Error state
  if (error) {
    return (
      <Card className={`p-4 ${className}`} data-testid="__RESOURCE_NAME__-mobile-error">
        <div className="text-center">
          <p className="text-red-600 mb-4">{errorHandlingService.getUserFriendlyMessage(error)}</p>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size={isMobile ? 'sm' : 'md'}
          >
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      </Card>
    );
  }

  // ✅ BRIDGE PATTERN: Loading state
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`} data-testid="__RESOURCE_NAME__-mobile-loading">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // ✅ BRIDGE PATTERN: Empty state
  if (filteredData.length === 0) {
    return (
      <Card className={`p-6 text-center ${className}`} data-testid="__RESOURCE_NAME__-mobile-empty">
        <div className="space-y-4">
          <div className="text-gray-400 text-4xl">📱</div>
          <h3 className="text-lg font-medium">No __RESOURCE_NAME__ found</h3>
          <p className="text-gray-500">
            {debouncedSearch
              ? `No results for "${debouncedSearch}"`
              : 'Get started by creating your first __ENTITY_TYPE__'}
          </p>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size={isMobile ? 'sm' : 'md'}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="__RESOURCE_NAME__-mobile-container">
      {/* ✅ BRIDGE PATTERN: Mobile search and filters */}
      {(showSearch || showFilters) && (
        <Card className="p-4 space-y-3">
          {showSearch && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search __RESOURCE_NAME__..."
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                className="pl-10"
                data-testid="__RESOURCE_NAME__-mobile-search"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          )}

          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {['all', 'active', 'inactive', 'pending', 'archived'].map(status => (
                <Badge
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedStatus(status)}
                  data-testid={`__RESOURCE_NAME__-mobile-filter-${status}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ✅ BRIDGE PATTERN: Bulk actions */}
      {selectedItems.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button onClick={() => setSelectedItems(new Set())} variant="outline" size="sm">
                Clear
              </Button>
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                data-testid="__RESOURCE_NAME__-mobile-bulk-delete"
              >
                Delete Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ✅ BRIDGE PATTERN: Mobile list/grid */}
      <div
        className={`grid gap-3 ${
          variant === 'grid'
            ? isMobile
              ? 'grid-cols-1'
              : isTablet
                ? 'grid-cols-2'
                : 'grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {filteredData.map(item => (
          <Card
            key={item.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedItems.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => handleItemPress(item)}
            data-testid={`__RESOURCE_NAME__-mobile-item-${item.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={e => {
                      e.stopPropagation();
                      handleItemSelect(item.id);
                    }}
                    className="rounded"
                    data-testid={`__RESOURCE_NAME__-mobile-checkbox-${item.id}`}
                  />
                  <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      item.status === 'active'
                        ? 'default'
                        : item.status === 'inactive'
                          ? 'secondary'
                          : item.status === 'pending'
                            ? 'outline'
                            : 'destructive'
                    }
                    className="text-xs"
                  >
                    {item.status}
                  </Badge>

                  {item.updatedAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ✅ BRIDGE PATTERN: Mobile pagination indicator */}
      {filteredData.length >= maxItems && (
        <div className="text-center text-sm text-gray-500">
          Showing {filteredData.length} of {__RESOURCE_NAME__?.length || 0} __RESOURCE_NAME__
        </div>
      )}

      {/* ✅ BRIDGE PATTERN: Mobile refresh button */}
      <div className="flex justify-center">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size={isMobile ? 'sm' : 'md'}
          data-testid="__RESOURCE_NAME__-mobile-refresh"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );
};

// ✅ BRIDGE PATTERN: Mobile-specific hook for bridge integration
export const use__ENTITY_TYPE__Mobile = () => {
  const bridge = use__BRIDGE_NAME__Bridge();

  return {
    ...bridge,
    // Mobile-specific utilities
    isMobile: useMediaQuery('(max-width: 768px)'),
    isTablet: useMediaQuery('(min-width: 769px) and (max-width: 1024px)'),
    isDesktop: useMediaQuery('(min-width: 1025px)'),
  };
};

// ✅ BRIDGE PATTERN: Mobile component export
export default __ENTITY_TYPE__Mobile;


