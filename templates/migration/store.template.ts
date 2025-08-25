// Zustand Store Template for Migration from Bridge Pattern
// Replace __ENTITY__ with actual entity name (e.g., Customer, Product, Proposal)

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// ====================
// Types
// ====================

type Sorting = { sortBy: 'createdAt' | 'name'; sortOrder: 'asc' | 'desc' };
type View = { mode: 'table' | 'list' | 'grid'; compact?: boolean };

type State = {
  filters: { search?: string; status?: string };
  sorting: Sorting;
  view: View;
  pagination: { limit: number };
  selection: { selectedIds: string[] };
  setFilters: (f: Partial<State['filters']>) => void;
  setSorting: (s: Partial<Sorting>) => void;
  setView: (v: Partial<View>) => void;
  setLimit: (n: number) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
};

// ====================
// Store Implementation
// ====================

export const use__ENTITY__Store = create<State>()(
  subscribeWithSelector(
    persist(
      set => ({
        filters: { search: '', status: '' },
        sorting: { sortBy: 'createdAt', sortOrder: 'desc' },
        view: { mode: 'table', compact: false },
        pagination: { limit: 20 },
        selection: { selectedIds: [] },
        setFilters: f => set(s => ({ filters: { ...s.filters, ...f } })),
        setSorting: o => set(s => ({ sorting: { ...s.sorting, ...o } })),
        setView: v => set(s => ({ view: { ...s.view, ...v } })),
        setLimit: n => set(s => ({ pagination: { ...s.pagination, limit: n } })),
        setSelectedIds: ids =>
          set(() => ({ selection: { selectedIds: Array.from(new Set(ids)) } })),
        clearSelection: () => set(() => ({ selection: { selectedIds: [] } })),
      }),
      {
        name: '__RESOURCE__-ui',
        partialize: s => ({
          filters: s.filters,
          sorting: s.sorting,
          view: s.view,
          pagination: s.pagination,
        }),
      }
    )
  )
);

// ====================
// Selectors
// ====================

export const __RESOURCE__Selectors = {
  filters: (s: State) => s.filters,
  sorting: (s: State) => s.sorting,
  view: (s: State) => s.view,
  limit: (s: State) => s.pagination.limit,
  selection: (s: State) => s.selection,
};

// ====================
// Export Default
// ====================

export default use__ENTITY__Store;
