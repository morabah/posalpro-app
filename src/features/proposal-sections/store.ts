import { create } from 'zustand';
import { http } from '@/lib/http';

interface AssignmentState {
  assignmentsDirty: boolean;
  sectionsDirty: boolean; // used to disable Finish while a mutation is pending
  pendingAssignments: Record<string, string | null>; // proposalProductId -> sectionId|null
  setSectionsPending: (pending: boolean) => void;
  setAssignment: (proposalProductId: string, sectionId: string | null) => void;
  clearAssignments: () => void;
  flushPendingAssignments: (proposalId: string) => Promise<void>;
}

export const useSectionAssignmentStore = create<AssignmentState>((set, get) => ({
  assignmentsDirty: false,
  sectionsDirty: false,
  pendingAssignments: {},
  setSectionsPending: (pending: boolean) => set({ sectionsDirty: pending }),
  setAssignment: (proposalProductId: string, sectionId: string | null) =>
    set(state => ({
      pendingAssignments: { ...state.pendingAssignments, [proposalProductId]: sectionId },
      assignmentsDirty: true,
    })),
  clearAssignments: () => set({ pendingAssignments: {}, assignmentsDirty: false }),
  flushPendingAssignments: async (proposalId: string) => {
    const { pendingAssignments } = get();
    const entries = Object.entries(pendingAssignments);
    if (entries.length === 0) return;

    // Filter out temporary IDs - only flush assignments for products with real database IDs
    const validEntries = entries.filter(([proposalProductId]) => !String(proposalProductId).startsWith('temp-'));
    if (validEntries.length === 0) {
      // Clear all assignments if no valid ones remain
      set({ pendingAssignments: {}, assignmentsDirty: false });
      return;
    }

    await http.post(`/api/proposals/${proposalId}/product-selections/bulk-assign`, {
      assignments: validEntries.map(([proposalProductId, sectionId]) => ({ proposalProductId, sectionId })),
    });
    set({ pendingAssignments: {}, assignmentsDirty: false });
  },
}));
