'use client';

/**
 * PosalPro MVP2 - Version History Zustand Store
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ FOLLOWS: MIGRATION_LESSONS.md - Zustand patterns with persistence and middleware
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - State management best practices
 * ✅ ALIGNS: Feature-based organization with proper separation of concerns
 * ✅ IMPLEMENTS: UI state management for version history feature
 *
 * This store manages UI state only (filters, view preferences, interactions).
 * Server state is managed by React Query hooks.
 */

import { logDebug, logInfo } from '@/lib/logger';
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// ====================
// Types and Interfaces
// ====================

export interface VersionHistoryFilters {
  searchText: string;
  timeRange: '7d' | '30d' | '90d' | 'all';
  changeTypeFilters: Array<
    'create' | 'update' | 'delete' | 'batch_import' | 'rollback' | 'status_change'
  >;
  userFilter: string;
  proposalIdFilter: string;
}

export interface VersionHistoryViewPreferences {
  showExpandedDetails: boolean;
  showTechnicalColumns: boolean;
  defaultSortField: 'createdAt' | 'version' | 'changeType' | 'createdByName';
  defaultSortDirection: 'asc' | 'desc';
  itemsPerPage: 20 | 50 | 100;
  visibleColumns: Record<string, boolean>;
}

export interface VersionHistoryUIState {
  // Filter states
  filters: VersionHistoryFilters;

  // Interaction states
  expandedEntryIds: string[];
  selectedEntryIds: string[];
  lastSelectedEntryId: string | null;

  // View preferences
  preferences: VersionHistoryViewPreferences;

  // Form states
  isExportDialogOpen: boolean;
  isBulkDeleteDialogOpen: boolean;
  isFilterDialogOpen: boolean;

  // Loading states
  isRefreshing: boolean;
  isExporting: boolean;

  // Navigation states
  currentViewMode: 'list' | 'grid' | 'timeline';
  activeTab: 'all' | 'recent' | 'important';
}

export interface VersionHistoryActions {
  // Filter actions
  setSearchText: (text: string) => void;
  setTimeRange: (range: VersionHistoryFilters['timeRange']) => void;
  setChangeTypeFilters: (filters: VersionHistoryFilters['changeTypeFilters']) => void;
  toggleChangeTypeFilter: (filter: VersionHistoryFilters['changeTypeFilters'][0]) => void;
  setUserFilter: (user: string) => void;
  setProposalIdFilter: (proposalId: string) => void;
  clearAllFilters: () => void;
  resetFilters: () => void;

  // Interaction actions
  toggleEntryExpansion: (entryId: string) => void;
  expandEntry: (entryId: string) => void;
  collapseEntry: (entryId: string) => void;
  collapseAllEntries: () => void;
  toggleEntrySelection: (entryId: string) => void;
  selectEntry: (entryId: string) => void;
  deselectEntry: (entryId: string) => void;
  selectAllEntries: (entryIds: string[]) => void;
  clearSelection: () => void;

  // View preference actions
  setShowExpandedDetails: (show: boolean) => void;
  setShowTechnicalColumns: (show: boolean) => void;
  setDefaultSortField: (field: VersionHistoryViewPreferences['defaultSortField']) => void;
  setDefaultSortDirection: (
    direction: VersionHistoryViewPreferences['defaultSortDirection']
  ) => void;
  setItemsPerPage: (count: VersionHistoryViewPreferences['itemsPerPage']) => void;
  toggleColumnVisibility: (column: string) => void;
  setColumnVisibility: (column: string, visible: boolean) => void;

  // Form actions
  openExportDialog: () => void;
  closeExportDialog: () => void;
  openBulkDeleteDialog: () => void;
  closeBulkDeleteDialog: () => void;
  openFilterDialog: () => void;
  closeFilterDialog: () => void;

  // Loading actions
  setIsRefreshing: (refreshing: boolean) => void;
  setIsExporting: (exporting: boolean) => void;

  // Navigation actions
  setCurrentViewMode: (mode: VersionHistoryUIState['currentViewMode']) => void;
  setActiveTab: (tab: VersionHistoryUIState['activeTab']) => void;

  // Utility actions
  resetToDefaults: () => void;
  getActiveFiltersCount: () => number;
  hasActiveFilters: () => boolean;
}

// ====================
// Default Values
// ====================

const defaultFilters: VersionHistoryFilters = {
  searchText: '',
  timeRange: '30d',
  changeTypeFilters: [],
  userFilter: '',
  proposalIdFilter: '',
};

const defaultPreferences: VersionHistoryViewPreferences = {
  showExpandedDetails: false,
  showTechnicalColumns: false,
  defaultSortField: 'createdAt',
  defaultSortDirection: 'desc',
  itemsPerPage: 20,
  visibleColumns: {
    id: false,
    proposalId: true,
    version: true,
    changeType: true,
    changesSummary: true,
    totalValue: true,
    createdByName: true,
    createdAt: true,
    actions: true,
  },
};

const initialState: VersionHistoryUIState = {
  filters: { ...defaultFilters },
  expandedEntryIds: [],
  selectedEntryIds: [],
  lastSelectedEntryId: null,
  preferences: { ...defaultPreferences },
  isExportDialogOpen: false,
  isBulkDeleteDialogOpen: false,
  isFilterDialogOpen: false,
  isRefreshing: false,
  isExporting: false,
  currentViewMode: 'list',
  activeTab: 'all',
};

// ====================
// Store Implementation
// ====================

export const useVersionHistoryStore = create<VersionHistoryUIState & VersionHistoryActions>()(
  persist(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // ====================
      // Filter Actions
      // ====================

      setSearchText: (text: string) => {
        set(state => ({
          ...state,
          filters: {
            ...state.filters,
            searchText: text,
          },
        }));
        logDebug('Version history search text updated', {
          component: 'VersionHistoryStore',
          operation: 'setSearchText',
          searchText: text,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      setTimeRange: (range: VersionHistoryFilters['timeRange']) => {
        set(state => ({
          ...state,
          filters: {
            ...state.filters,
            timeRange: range,
          },
        }));
        logDebug('Version history time range updated', {
          component: 'VersionHistoryStore',
          operation: 'setTimeRange',
          timeRange: range,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      setChangeTypeFilters: (filters: VersionHistoryFilters['changeTypeFilters']) => {
        set(state => ({
          ...state,
          filters: {
            ...state.filters,
            changeTypeFilters: filters,
          },
        }));
        logDebug('Version history change type filters updated', {
          component: 'VersionHistoryStore',
          operation: 'setChangeTypeFilters',
          filters,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      toggleChangeTypeFilter: (filter: VersionHistoryFilters['changeTypeFilters'][0]) => {
        set(state => {
          const index = state.filters.changeTypeFilters.indexOf(filter);
          const newFilters = [...state.filters.changeTypeFilters];
          if (index === -1) {
            newFilters.push(filter);
          } else {
            newFilters.splice(index, 1);
          }
          return {
            ...state,
            filters: {
              ...state.filters,
              changeTypeFilters: newFilters,
            },
          };
        });
        const { filters } = get();
        logDebug('Version history change type filter toggled', {
          component: 'VersionHistoryStore',
          operation: 'toggleChangeTypeFilter',
          filter,
          activeFilters: filters.changeTypeFilters,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      setUserFilter: (user: string) => {
        set(state => ({
          ...state,
          filters: {
            ...state.filters,
            userFilter: user,
          },
        }));
        logDebug('Version history user filter updated', {
          component: 'VersionHistoryStore',
          operation: 'setUserFilter',
          userFilter: user,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      setProposalIdFilter: (proposalId: string) => {
        set(state => ({
          ...state,
          filters: {
            ...state.filters,
            proposalIdFilter: proposalId,
          },
        }));
        logDebug('Version history proposal ID filter updated', {
          component: 'VersionHistoryStore',
          operation: 'setProposalIdFilter',
          proposalId,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      clearAllFilters: () => {
        set(state => ({
          ...state,
          filters: { ...defaultFilters },
        }));
        logInfo('Version history filters cleared', {
          component: 'VersionHistoryStore',
          operation: 'clearAllFilters',
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      resetFilters: () => {
        set(state => ({
          ...state,
          filters: { ...defaultFilters },
        }));
      },

      // ====================
      // Interaction Actions
      // ====================

      toggleEntryExpansion: (entryId: string) => {
        set(state => {
          const index = state.expandedEntryIds.indexOf(entryId);
          const newExpandedIds = [...state.expandedEntryIds];
          if (index === -1) {
            newExpandedIds.push(entryId);
          } else {
            newExpandedIds.splice(index, 1);
          }
          return {
            ...state,
            expandedEntryIds: newExpandedIds,
          };
        });
        const { expandedEntryIds } = get();
        logDebug('Version history entry expansion toggled', {
          component: 'VersionHistoryStore',
          operation: 'toggleEntryExpansion',
          entryId,
          isExpanded: expandedEntryIds.includes(entryId),
          expandedCount: expandedEntryIds.length,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      expandEntry: (entryId: string) => {
        set(state => ({
          ...state,
          expandedEntryIds: state.expandedEntryIds.includes(entryId)
            ? state.expandedEntryIds
            : [...state.expandedEntryIds, entryId],
        }));
      },

      collapseEntry: (entryId: string) => {
        set(state => ({
          ...state,
          expandedEntryIds: state.expandedEntryIds.filter(id => id !== entryId),
        }));
      },

      collapseAllEntries: () => {
        set(state => ({
          ...state,
          expandedEntryIds: [],
        }));
        logDebug('All version history entries collapsed', {
          component: 'VersionHistoryStore',
          operation: 'collapseAllEntries',
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      toggleEntrySelection: (entryId: string) => {
        set(state => {
          const index = state.selectedEntryIds.indexOf(entryId);
          const newSelectedIds = [...state.selectedEntryIds];
          if (index === -1) {
            newSelectedIds.push(entryId);
            return {
              ...state,
              selectedEntryIds: newSelectedIds,
              lastSelectedEntryId: entryId,
            };
          } else {
            newSelectedIds.splice(index, 1);
            return {
              ...state,
              selectedEntryIds: newSelectedIds,
              lastSelectedEntryId: null,
            };
          }
        });
        const { selectedEntryIds } = get();
        logDebug('Version history entry selection toggled', {
          component: 'VersionHistoryStore',
          operation: 'toggleEntrySelection',
          entryId,
          isSelected: selectedEntryIds.includes(entryId),
          selectedCount: selectedEntryIds.length,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      selectEntry: (entryId: string) => {
        set(state => ({
          ...state,
          selectedEntryIds: state.selectedEntryIds.includes(entryId)
            ? state.selectedEntryIds
            : [...state.selectedEntryIds, entryId],
          lastSelectedEntryId: entryId,
        }));
      },

      deselectEntry: (entryId: string) => {
        set(state => ({
          ...state,
          selectedEntryIds: state.selectedEntryIds.filter(id => id !== entryId),
          lastSelectedEntryId:
            state.lastSelectedEntryId === entryId ? null : state.lastSelectedEntryId,
        }));
      },

      selectAllEntries: (entryIds: string[]) => {
        set(state => ({
          ...state,
          selectedEntryIds: [...entryIds],
          lastSelectedEntryId: entryIds.length > 0 ? entryIds[entryIds.length - 1] : null,
        }));
        logDebug('All version history entries selected', {
          component: 'VersionHistoryStore',
          operation: 'selectAllEntries',
          selectedCount: entryIds.length,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      clearSelection: () => {
        set(state => ({
          ...state,
          selectedEntryIds: [],
          lastSelectedEntryId: null,
        }));
        logDebug('Version history entry selection cleared', {
          component: 'VersionHistoryStore',
          operation: 'clearSelection',
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      // ====================
      // View Preference Actions
      // ====================

      setShowExpandedDetails: (show: boolean) => {
        set(state => ({
          ...state,
          preferences: {
            ...state.preferences,
            showExpandedDetails: show,
          },
        }));
      },

      setShowTechnicalColumns: (show: boolean) => {
        set(state => ({
          ...state,
          preferences: {
            ...state.preferences,
            showTechnicalColumns: show,
          },
        }));
      },

      setDefaultSortField: (field: VersionHistoryViewPreferences['defaultSortField']) => {
        set(state => ({
          ...state,
          preferences: {
            ...state.preferences,
            defaultSortField: field,
          },
        }));
      },

      setDefaultSortDirection: (
        direction: VersionHistoryViewPreferences['defaultSortDirection']
      ) => {
        set(state => ({
          ...state,
          preferences: {
            ...state.preferences,
            defaultSortDirection: direction,
          },
        }));
      },

      setItemsPerPage: (count: VersionHistoryViewPreferences['itemsPerPage']) => {
        set(state => ({
          ...state,
          preferences: {
            ...state.preferences,
            itemsPerPage: count,
          },
        }));
      },

      toggleColumnVisibility: (column: string) => {
        set(state => ({
          ...state,
          preferences: {
            ...state.preferences,
            visibleColumns: {
              ...state.preferences.visibleColumns,
              [column]: !state.preferences.visibleColumns[column],
            },
          },
        }));
      },

      setColumnVisibility: (column: string, visible: boolean) => {
        set(state => ({
          ...state,
          preferences: {
            ...state.preferences,
            visibleColumns: {
              ...state.preferences.visibleColumns,
              [column]: visible,
            },
          },
        }));
      },

      // ====================
      // Form Actions
      // ====================

      openExportDialog: () => {
        set(state => ({
          ...state,
          isExportDialogOpen: true,
        }));
      },

      closeExportDialog: () => {
        set(state => ({
          ...state,
          isExportDialogOpen: false,
        }));
      },

      openBulkDeleteDialog: () => {
        set(state => ({
          ...state,
          isBulkDeleteDialogOpen: true,
        }));
      },

      closeBulkDeleteDialog: () => {
        set(state => ({
          ...state,
          isBulkDeleteDialogOpen: false,
        }));
      },

      openFilterDialog: () => {
        set(state => ({
          ...state,
          isFilterDialogOpen: true,
        }));
      },

      closeFilterDialog: () => {
        set(state => ({
          ...state,
          isFilterDialogOpen: false,
        }));
      },

      // ====================
      // Loading Actions
      // ====================

      setIsRefreshing: (refreshing: boolean) => {
        set(state => ({
          ...state,
          isRefreshing: refreshing,
        }));
      },

      setIsExporting: (exporting: boolean) => {
        set(state => ({
          ...state,
          isExporting: exporting,
        }));
      },

      // ====================
      // Navigation Actions
      // ====================

      setCurrentViewMode: (mode: VersionHistoryUIState['currentViewMode']) => {
        set(state => ({
          ...state,
          currentViewMode: mode,
        }));
      },

      setActiveTab: (tab: VersionHistoryUIState['activeTab']) => {
        set(state => ({
          ...state,
          activeTab: tab,
        }));
      },

      // ====================
      // Utility Actions
      // ====================

      resetToDefaults: () => {
        set(state => ({
          ...state,
          filters: { ...defaultFilters },
          preferences: { ...defaultPreferences },
          expandedEntryIds: [],
          selectedEntryIds: [],
          lastSelectedEntryId: null,
        }));
        logInfo('Version history store reset to defaults', {
          component: 'VersionHistoryStore',
          operation: 'resetToDefaults',
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
      },

      getActiveFiltersCount: () => {
        const { filters } = get();
        let count = 0;
        if (filters.searchText.trim()) count++;
        if (filters.timeRange !== 'all') count++;
        if (filters.changeTypeFilters.length > 0) count++;
        if (filters.userFilter.trim()) count++;
        if (filters.proposalIdFilter.trim()) count++;
        return count;
      },

      hasActiveFilters: () => {
        return get().getActiveFiltersCount() > 0;
      },
    })),
    {
      name: 'version-history-store',
      version: 1,
      // Only persist preferences and filters, not interaction states
      partialize: state => ({
        filters: state.filters,
        preferences: state.preferences,
        currentViewMode: state.currentViewMode,
        activeTab: state.activeTab,
      }),
    }
  )
);

// ====================
// Optimized Selectors
// ====================

// Filter selectors
export const useVersionHistoryFilters = () => useVersionHistoryStore(state => state.filters);

export const useVersionHistorySearchText = () =>
  useVersionHistoryStore(state => state.filters.searchText);

export const useVersionHistoryTimeRange = () =>
  useVersionHistoryStore(state => state.filters.timeRange);

export const useVersionHistoryChangeTypeFilters = () =>
  useVersionHistoryStore(state => state.filters.changeTypeFilters);

export const useVersionHistoryUserFilter = () =>
  useVersionHistoryStore(state => state.filters.userFilter);

export const useVersionHistoryProposalIdFilter = () =>
  useVersionHistoryStore(state => state.filters.proposalIdFilter);

// Interaction selectors
export const useVersionHistoryExpandedEntryIds = () =>
  useVersionHistoryStore(state => state.expandedEntryIds);

export const useVersionHistorySelectedEntryIds = () =>
  useVersionHistoryStore(state => state.selectedEntryIds);

export const useVersionHistoryLastSelectedEntryId = () =>
  useVersionHistoryStore(state => state.lastSelectedEntryId);

// Preference selectors
export const useVersionHistoryPreferences = () =>
  useVersionHistoryStore(state => state.preferences);

export const useVersionHistoryShowExpandedDetails = () =>
  useVersionHistoryStore(state => state.preferences.showExpandedDetails);

export const useVersionHistoryShowTechnicalColumns = () =>
  useVersionHistoryStore(state => state.preferences.showTechnicalColumns);

export const useVersionHistoryVisibleColumns = () =>
  useVersionHistoryStore(state => state.preferences.visibleColumns);

// Form state selectors
export const useVersionHistoryDialogStates = () =>
  useVersionHistoryStore(state => ({
    isExportDialogOpen: state.isExportDialogOpen,
    isBulkDeleteDialogOpen: state.isBulkDeleteDialogOpen,
    isFilterDialogOpen: state.isFilterDialogOpen,
  }));

// Loading state selectors
export const useVersionHistoryLoadingStates = () =>
  useVersionHistoryStore(state => ({
    isRefreshing: state.isRefreshing,
    isExporting: state.isExporting,
  }));

// Navigation selectors
export const useVersionHistoryNavigation = () =>
  useVersionHistoryStore(state => ({
    currentViewMode: state.currentViewMode,
    activeTab: state.activeTab,
  }));

// ====================
// Composite Selectors
// ====================

export const useVersionHistoryFilterState = () =>
  useVersionHistoryStore(state => ({
    filters: state.filters,
    hasActiveFilters: state.hasActiveFilters(),
    activeFiltersCount: state.getActiveFiltersCount(),
  }));

export const useVersionHistoryInteractionState = () =>
  useVersionHistoryStore(state => ({
    expandedEntryIds: state.expandedEntryIds,
    selectedEntryIds: state.selectedEntryIds,
    lastSelectedEntryId: state.lastSelectedEntryId,
  }));

export const useVersionHistoryViewState = () =>
  useVersionHistoryStore(state => ({
    preferences: state.preferences,
    currentViewMode: state.currentViewMode,
    activeTab: state.activeTab,
  }));

// ====================
// Action Selectors
// ====================

export const useVersionHistoryFilterActions = () => ({
  setSearchText: useVersionHistoryStore(state => state.setSearchText),
  setTimeRange: useVersionHistoryStore(state => state.setTimeRange),
  setChangeTypeFilters: useVersionHistoryStore(state => state.setChangeTypeFilters),
  toggleChangeTypeFilter: useVersionHistoryStore(state => state.toggleChangeTypeFilter),
  setUserFilter: useVersionHistoryStore(state => state.setUserFilter),
  setProposalIdFilter: useVersionHistoryStore(state => state.setProposalIdFilter),
  clearAllFilters: useVersionHistoryStore(state => state.clearAllFilters),
  resetFilters: useVersionHistoryStore(state => state.resetFilters),
});

export const useVersionHistoryInteractionActions = () => ({
  toggleEntryExpansion: useVersionHistoryStore(state => state.toggleEntryExpansion),
  expandEntry: useVersionHistoryStore(state => state.expandEntry),
  collapseEntry: useVersionHistoryStore(state => state.collapseEntry),
  collapseAllEntries: useVersionHistoryStore(state => state.collapseAllEntries),
  toggleEntrySelection: useVersionHistoryStore(state => state.toggleEntrySelection),
  selectEntry: useVersionHistoryStore(state => state.selectEntry),
  deselectEntry: useVersionHistoryStore(state => state.deselectEntry),
  selectAllEntries: useVersionHistoryStore(state => state.selectAllEntries),
  clearSelection: useVersionHistoryStore(state => state.clearSelection),
});

export const useVersionHistoryPreferenceActions = () => ({
  setShowExpandedDetails: useVersionHistoryStore(state => state.setShowExpandedDetails),
  setShowTechnicalColumns: useVersionHistoryStore(state => state.setShowTechnicalColumns),
  setDefaultSortField: useVersionHistoryStore(state => state.setDefaultSortField),
  setDefaultSortDirection: useVersionHistoryStore(state => state.setDefaultSortDirection),
  setItemsPerPage: useVersionHistoryStore(state => state.setItemsPerPage),
  toggleColumnVisibility: useVersionHistoryStore(state => state.toggleColumnVisibility),
  setColumnVisibility: useVersionHistoryStore(state => state.setColumnVisibility),
});

export const useVersionHistoryDialogActions = () => ({
  openExportDialog: useVersionHistoryStore(state => state.openExportDialog),
  closeExportDialog: useVersionHistoryStore(state => state.closeExportDialog),
  openBulkDeleteDialog: useVersionHistoryStore(state => state.openBulkDeleteDialog),
  closeBulkDeleteDialog: useVersionHistoryStore(state => state.closeBulkDeleteDialog),
  openFilterDialog: useVersionHistoryStore(state => state.openFilterDialog),
  closeFilterDialog: useVersionHistoryStore(state => state.closeFilterDialog),
});

export const useVersionHistoryNavigationActions = () => ({
  setCurrentViewMode: useVersionHistoryStore(state => state.setCurrentViewMode),
  setActiveTab: useVersionHistoryStore(state => state.setActiveTab),
});

// ====================
// Utility Hooks
// ====================

export const useVersionHistoryEntryExpansion = (entryId: string) => {
  const expandedEntryIds = useVersionHistoryStore(state => state.expandedEntryIds);
  const { toggleEntryExpansion } = useVersionHistoryStore(state => ({
    toggleEntryExpansion: state.toggleEntryExpansion,
  }));

  return {
    isExpanded: expandedEntryIds.includes(entryId),
    toggleExpansion: () => toggleEntryExpansion(entryId),
  };
};

export const useVersionHistoryEntrySelection = (entryId: string) => {
  const selectedEntryIds = useVersionHistoryStore(state => state.selectedEntryIds);
  const { toggleEntrySelection } = useVersionHistoryStore(state => ({
    toggleEntrySelection: state.toggleEntrySelection,
  }));

  return {
    isSelected: selectedEntryIds.includes(entryId),
    toggleSelection: () => toggleEntrySelection(entryId),
  };
};

export const useVersionHistoryColumnVisibility = (column: string) => {
  const visibleColumns = useVersionHistoryStore(state => state.preferences.visibleColumns);
  const { toggleColumnVisibility } = useVersionHistoryStore(state => ({
    toggleColumnVisibility: state.toggleColumnVisibility,
  }));

  return {
    isVisible: visibleColumns[column] ?? true,
    toggleVisibility: () => toggleColumnVisibility(column),
  };
};
