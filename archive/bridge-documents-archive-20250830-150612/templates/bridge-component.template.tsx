// __FILE_DESCRIPTION__: Component template using bridge pattern with full CORE_REQUIREMENTS.md compliance
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

'use client';

/**
 * __COMPONENT_NAME__ - Bridge Pattern Component
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: __USER_STORY__
 * - Acceptance Criteria: AC-X.X.X (Bridge integration, Error handling, Performance optimization)
 * - Hypotheses: __HYPOTHESIS__ (Bridge pattern improves maintainability and performance)
 *
 * COMPLIANCE STATUS:
 * ✅ Bridge Pattern implementation
 * ✅ Error Handling with ErrorHandlingService
 * ✅ Analytics with userStory and hypothesis tracking
 * ✅ Structured Logging with metadata
 * ✅ TypeScript Type Safety (no any types)
 * ✅ Performance Optimization with useCallback/useMemo
 * ✅ Accessibility (WCAG 2.1 AA)
 * ✅ Mobile responsiveness (44px touch targets)
 */

import { use__BRIDGE_NAME__Bridge } from '@/components/bridges/__BRIDGE_NAME__ManagementBridge';
import { useAuth } from '@/components/providers/AuthProvider';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import {
  use__BRIDGE_NAME__Create,
  use__BRIDGE_NAME__Delete,
  use__BRIDGE_NAME__List,
  use__BRIDGE_NAME__Update,
} from '@/hooks/use__BRIDGE_NAME__';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { type __ENTITY_TYPE__ } from '@/lib/bridges/__BRIDGE_NAME__ApiBridge';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { debounce } from '@/lib/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// ====================
// TypeScript Interfaces
// ====================

export interface __COMPONENT_NAME__Props {
  initialFilters?: Record<string, unknown>;
  showCreateForm?: boolean;
  showActions?: boolean;
  maxItems?: number;
  onEntitySelect?: (entity: __ENTITY_TYPE__) => void;
  onEntityCreate?: (entity: __ENTITY_TYPE__) => void;
  onEntityUpdate?: (entity: __ENTITY_TYPE__) => void;
  onEntityDelete?: (id: string) => void;
  'data-testid'?: string;
}

interface __ENTITY_TYPE__FormData {
  name: string;
  status: string;
  // Add form-specific fields
}

interface FilterState {
  search: string;
  status: string[];
  // Add filter-specific fields
}

// ====================
// Main Component
// ====================

export function __COMPONENT_NAME__({
  initialFilters = {},
  showCreateForm = true,
  showActions = true,
  maxItems = 50,
  onEntitySelect,
  onEntityCreate,
  onEntityUpdate,
  onEntityDelete,
  'data-testid': dataTestId = '__COMPONENT_NAME__',
}: __COMPONENT_NAME__Props) {
  // ✅ SECURITY: Authentication check
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // ✅ SECURITY: Protected route wrapper
  if (!isAuthenticated || authLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access this feature.</p>
        </div>
      </Card>
    );
  }
  // ====================
  // Hooks and State
  // ====================

  const bridge = use__BRIDGE_NAME__Bridge();
  const { handleAsyncError } = useErrorHandler();

  // Local state for UI interactions
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    ...initialFilters,
  });

  const [selectedEntity, setSelectedEntity] = useState<__ENTITY_TYPE__ | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<__ENTITY_TYPE__FormData>({
    name: '',
    status: 'active',
  });

  // ✅ DEBOUNCED SEARCH: 300ms debounce per CORE_REQUIREMENTS
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const debouncedSearchFunction = useCallback(
    debounce((searchTerm: string) => {
      setDebouncedSearch(searchTerm);
    }, 300),
    []
  );

  // Bridge hooks for data operations
  const {
    data: entities = [],
    isLoading,
    error,
    refetch,
  } = use__BRIDGE_NAME__List({
    params: {
      search: debouncedSearch || undefined, // ✅ Use debounced search
      status: filters.status.length > 0 ? filters.status : undefined,
      limit: maxItems,
      fields: 'id,name,status,updatedAt', // Minimal fields per CORE_REQUIREMENTS
    },
    enabled: true,
  });

  const createMutation = use__BRIDGE_NAME__Create();
  const updateMutation = use__BRIDGE_NAME__Update();
  const deleteMutation = use__BRIDGE_NAME__Delete();

  // ====================
  // Component Lifecycle
  // ====================

  useEffect(() => {
    logDebug('__COMPONENT_NAME__ mounted', {
      component: '__COMPONENT_NAME__',
      operation: 'mount',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
      initialFilters,
      showCreateForm,
      showActions,
    });

    // Track page view
    bridge.trackPageView('__COMPONENT_NAME__');

    return () => {
      logDebug('__COMPONENT_NAME__ unmounted', {
        component: '__COMPONENT_NAME__',
        operation: 'unmount',
      });
    };
  }, [bridge, initialFilters, showCreateForm, showActions]);

  // ====================
  // Event Handlers
  // ====================

  const handleSearch = useCallback(
    (searchValue: string) => {
      setFilters(prev => ({ ...prev, search: searchValue }));

      // ✅ DEBOUNCED SEARCH: Trigger debounced search
      debouncedSearchFunction(searchValue);

      bridge.trackAction('search', {
        component: '__COMPONENT_NAME__',
        operation: 'search',
        searchLength: searchValue.length,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      logDebug('__COMPONENT_NAME__ search triggered', {
        component: '__COMPONENT_NAME__',
        operation: 'search',
        searchValue: searchValue.substring(0, 20), // Truncate for privacy
      });
    },
    [bridge, debouncedSearchFunction]
  );

  const handleStatusFilter = useCallback(
    (status: string[]) => {
      setFilters(prev => ({ ...prev, status }));

      bridge.trackAction('filter_status', {
        component: '__COMPONENT_NAME__',
        operation: 'filter',
        statusCount: status.length,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });
    },
    [bridge]
  );

  const handleEntityClick = useCallback(
    (entity: __ENTITY_TYPE__) => {
      setSelectedEntity(entity);
      onEntitySelect?.(entity);

      bridge.trackAction('entity_selected', {
        component: '__COMPONENT_NAME__',
        operation: 'select',
        entityId: entity.id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      logInfo('__COMPONENT_NAME__ entity selected', {
        component: '__COMPONENT_NAME__',
        operation: 'select',
        entityId: entity.id,
      });
    },
    [bridge, onEntitySelect]
  );

  const handleCreateSubmit = useCallback(async () => {
    try {
      logDebug('__COMPONENT_NAME__ create submit', {
        component: '__COMPONENT_NAME__',
        operation: 'create_submit',
        formDataKeys: Object.keys(formData),
      });

      const newEntity = await createMutation.mutateAsync(formData);

      // Reset form
      setFormData({ name: '', status: 'active' });
      setShowForm(false);

      onEntityCreate?.(newEntity);

      bridge.trackAction('entity_created', {
        component: '__COMPONENT_NAME__',
        operation: 'create',
        entityId: newEntity.id,
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      logInfo('__COMPONENT_NAME__ entity created', {
        component: '__COMPONENT_NAME__',
        operation: 'create',
        entityId: newEntity.id,
      });
    } catch (error) {
      const processedError = handleAsyncError(error, '__COMPONENT_NAME__ create');

      logError('__COMPONENT_NAME__ create failed', {
        component: '__COMPONENT_NAME__',
        operation: 'create',
        error: processedError.message,
      });
    }
  }, [formData, createMutation, onEntityCreate, bridge, handleAsyncError]);

  const handleUpdateSubmit = useCallback(
    async (id: string, updates: Partial<__ENTITY_TYPE__FormData>) => {
      try {
        logDebug('__COMPONENT_NAME__ update submit', {
          component: '__COMPONENT_NAME__',
          operation: 'update_submit',
          entityId: id,
          updateKeys: Object.keys(updates),
        });

        const updatedEntity = await updateMutation.mutateAsync({ id, payload: updates });

        onEntityUpdate?.(updatedEntity);

        bridge.trackAction('entity_updated', {
          component: '__COMPONENT_NAME__',
          operation: 'update',
          entityId: id,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        logInfo('__COMPONENT_NAME__ entity updated', {
          component: '__COMPONENT_NAME__',
          operation: 'update',
          entityId: id,
        });
      } catch (error) {
        const processedError = handleAsyncError(error, '__COMPONENT_NAME__ update');

        logError('__COMPONENT_NAME__ update failed', {
          component: '__COMPONENT_NAME__',
          operation: 'update',
          entityId: id,
          error: processedError.message,
        });
      }
    },
    [updateMutation, onEntityUpdate, bridge, handleAsyncError]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        logDebug('__COMPONENT_NAME__ delete', {
          component: '__COMPONENT_NAME__',
          operation: 'delete',
          entityId: id,
        });

        await deleteMutation.mutateAsync(id);

        // Clear selection if deleted entity was selected
        if (selectedEntity?.id === id) {
          setSelectedEntity(null);
        }

        onEntityDelete?.(id);

        bridge.trackAction('entity_deleted', {
          component: '__COMPONENT_NAME__',
          operation: 'delete',
          entityId: id,
          userStory: '__USER_STORY__',
          hypothesis: '__HYPOTHESIS__',
        });

        logInfo('__COMPONENT_NAME__ entity deleted', {
          component: '__COMPONENT_NAME__',
          operation: 'delete',
          entityId: id,
        });
      } catch (error) {
        const processedError = handleAsyncError(error, '__COMPONENT_NAME__ delete');

        logError('__COMPONENT_NAME__ delete failed', {
          component: '__COMPONENT_NAME__',
          operation: 'delete',
          entityId: id,
          error: processedError.message,
        });
      }
    },
    [deleteMutation, selectedEntity, onEntityDelete, bridge, handleAsyncError]
  );

  const handleRefresh = useCallback(async () => {
    try {
      logDebug('__COMPONENT_NAME__ refresh', {
        component: '__COMPONENT_NAME__',
        operation: 'refresh',
      });

      await refetch();

      bridge.trackAction('data_refreshed', {
        component: '__COMPONENT_NAME__',
        operation: 'refresh',
        userStory: '__USER_STORY__',
        hypothesis: '__HYPOTHESIS__',
      });

      logInfo('__COMPONENT_NAME__ data refreshed', {
        component: '__COMPONENT_NAME__',
        operation: 'refresh',
      });
    } catch (error) {
      handleAsyncError(error, '__COMPONENT_NAME__ refresh');
    }
  }, [refetch, bridge, handleAsyncError]);

  // ====================
  // Computed Values
  // ====================

  const filteredEntities = useMemo(() => {
    return entities.slice(0, maxItems);
  }, [entities, maxItems]);

  const statusOptions = useMemo(
    () => [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Pending' },
    ],
    []
  );

  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0;
  }, [formData]);

  // ====================
  // Loading and Error States
  // ====================

  if (error) {
    return (
      <Card data-testid={`${dataTestId}-error`} className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error.message || 'An unexpected error occurred'}</p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="md"
            className="min-h-[44px]" // 44px touch target
            data-testid={`${dataTestId}-retry-button`}
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // ====================
  // Render
  // ====================

  return (
    <div data-testid={dataTestId} className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" data-testid={`${dataTestId}-title`}>
            __ENTITY_TYPE__ Management
          </h2>
          <p className="text-sm text-gray-600">Manage __RESOURCE_NAME__ using the bridge pattern</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="md"
            disabled={isLoading}
            className="min-h-[44px]" // 44px touch target
            data-testid={`${dataTestId}-refresh-button`}
            aria-label="Refresh data"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>

          {showCreateForm && (
            <Button
              onClick={() => setShowForm(true)}
              size="md"
              className="min-h-[44px]" // 44px touch target
              data-testid={`${dataTestId}-create-button`}
            >
              Create New
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <Card data-testid={`${dataTestId}-filters`} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium mb-2">
              Search
            </label>
            <Input
              id="search"
              type="text"
              value={filters.search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search __RESOURCE_NAME__..."
              className="w-full"
              data-testid={`${dataTestId}-search-input`}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Status Filter
            </label>
            <select
              id="status"
              value={filters.status.join(',')}
              onChange={e => handleStatusFilter(e.target.value.split(',').filter(Boolean))}
              className="w-full p-2 border border-gray-300 rounded-md min-h-[44px]" // 44px touch target
              data-testid={`${dataTestId}-status-filter`}
            >
              <option value="">All Statuses</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Create Form Modal */}
      {showForm && showCreateForm && (
        <Card data-testid={`${dataTestId}-create-form`} className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New __ENTITY_TYPE__</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name..."
                required
                className="w-full"
                data-testid={`${dataTestId}-form-name`}
              />
            </div>

            <div>
              <label htmlFor="form-status" className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                id="form-status"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md min-h-[44px]" // 44px touch target
                data-testid={`${dataTestId}-form-status`}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                size="md"
                className="min-h-[44px]" // 44px touch target
                data-testid={`${dataTestId}-form-cancel`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={!isFormValid || createMutation.isPending}
                size="md"
                className="min-h-[44px]" // 44px touch target
                data-testid={`${dataTestId}-form-submit`}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Entities List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card data-testid={`${dataTestId}-loading`} className="p-6">
            <div className="text-center text-gray-600">Loading __RESOURCE_NAME__...</div>
          </Card>
        ) : filteredEntities.length === 0 ? (
          <Card data-testid={`${dataTestId}-empty`} className="p-6">
            <div className="text-center text-gray-600">
              No __RESOURCE_NAME__ found. {showCreateForm && 'Create one to get started.'}
            </div>
          </Card>
        ) : (
          filteredEntities.map(entity => (
            <Card
              key={entity.id}
              data-testid={`${dataTestId}-entity-${entity.id}`}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedEntity?.id === entity.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleEntityClick(entity)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEntityClick(entity);
                }
              }}
              aria-label={`Select ${entity.name}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3
                    className="font-medium"
                    data-testid={`${dataTestId}-entity-name-${entity.id}`}
                  >
                    {entity.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={entity.status === 'active' ? 'success' : 'secondary'}
                      data-testid={`${dataTestId}-entity-status-${entity.id}`}
                    >
                      {entity.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Updated: {new Date(entity.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {showActions && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        handleUpdateSubmit(entity.id, { name: `${entity.name} (Updated)` });
                      }}
                      variant="outline"
                      size="sm"
                      disabled={updateMutation.isPending}
                      className="min-h-[44px] min-w-[44px]" // 44px touch target
                      data-testid={`${dataTestId}-update-${entity.id}`}
                      aria-label={`Update ${entity.name}`}
                    >
                      Update
                    </Button>
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(entity.id);
                      }}
                      variant="outline"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      className="min-h-[44px] min-w-[44px] text-red-600 hover:text-red-700" // 44px touch target
                      data-testid={`${dataTestId}-delete-${entity.id}`}
                      aria-label={`Delete ${entity.name}`}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Entity Count */}
      <div className="text-sm text-gray-600 text-center" data-testid={`${dataTestId}-count`}>
        Showing {filteredEntities.length} of {entities.length} __RESOURCE_NAME__
      </div>
    </div>
  );
}

// Add displayName for debugging and React DevTools
__COMPONENT_NAME__.displayName = '__COMPONENT_NAME__';
