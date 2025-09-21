'use client';

import { Button } from '@/components/ui/forms/Button';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

interface BulkActionsPanelProps {
  selectedEntryIds: string[];
  handleBulkDelete: () => void;
  bulkDeleteMutation: any;
  interactionActions: any;
}

export default function BulkActionsPanel({
  selectedEntryIds,
  handleBulkDelete,
  bulkDeleteMutation,
  interactionActions,
}: BulkActionsPanelProps) {
  if (selectedEntryIds.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{selectedEntryIds.length}</span>{' '}
          version{selectedEntryIds.length !== 1 ? 's' : ''} selected
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => interactionActions.clearSelection()}
            variant="ghost"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-70"
          >
            {bulkDeleteMutation.isPending ? (
              <>
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                Deleting
              </>
            ) : (
              <>
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete selected
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
