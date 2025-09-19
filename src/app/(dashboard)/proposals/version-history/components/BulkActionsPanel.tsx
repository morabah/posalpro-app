'use client';

import { Button } from '@/components/ui/forms/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600">
          {selectedEntryIds.length} item{selectedEntryIds.length !== 1 ? 's' : ''} selected
        </span>
        <Button
          onClick={handleBulkDelete}
          disabled={bulkDeleteMutation.isPending}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          {bulkDeleteMutation.isPending ? (
            <>
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete Selected'
          )}
        </Button>
        <Button onClick={() => interactionActions.clearSelection()} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}
