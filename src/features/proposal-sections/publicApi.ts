import { useSectionAssignmentStore } from './store';

export function getSectionAssignmentDirtyFlags() {
  const { assignmentsDirty, sectionsDirty } = useSectionAssignmentStore.getState();
  return { assignmentsDirty, sectionsDirty };
}

export async function flushPendingSectionCreatesAndUpdates(): Promise<void> {
  // Wait briefly if a section mutation is in-flight (sectionsDirty=true)
  const start = Date.now();
  while (useSectionAssignmentStore.getState().sectionsDirty) {
    if (Date.now() - start > 2000) break; // safety timeout 2s
    await new Promise(r => setTimeout(r, 50));
  }
}

