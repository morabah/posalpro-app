'use client';

import { Button } from '@/components/ui/forms/Button';
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';

interface WizardSidebarProps {
  customerName?: string;
  teamCount?: number;
  productCount?: number;
  sectionCount?: number;

  currentStep: number;
  visibleStepIds: number[];
  canGoBack: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  editMode?: boolean;

  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onPreview: () => void;
}

function SidebarImpl({
  customerName,
  teamCount = 0,
  productCount = 0,
  sectionCount = 0,
  currentStep,
  visibleStepIds,
  canGoBack,
  canProceed,
  isSubmitting,
  editMode,
  onBack,
  onNext,
  onSubmit,
  onPreview,
}: WizardSidebarProps) {
  const currentIndex = Math.max(1, visibleStepIds.indexOf(currentStep) + 1);

  return (
    <div className="p-6 sticky top-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposal Summary</h3>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Customer:</span>
          <span className="font-medium">{customerName || 'Not selected'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Team Members:</span>
          <span className="font-medium">{teamCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Products:</span>
          <span className="font-medium">{productCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Sections:</span>
          <span className="font-medium">{sectionCount}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current Step:</span>
          <span className="font-medium">{currentIndex} of {visibleStepIds.length}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack} disabled={!canGoBack} className="flex-1">
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Back
          </Button>

          {visibleStepIds.indexOf(currentStep) < visibleStepIds.length - 1 ? (
            <Button variant="primary" size="sm" onClick={onNext} disabled={!canProceed} className="flex-1">
              Next
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={onSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4 mr-1" />
              )}
              {editMode ? 'Update' : 'Submit'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <Button variant="outline" size="sm" className="w-full" onClick={onPreview}>
          <EyeIcon className="w-4 h-4 mr-2" />
          Preview Proposal
        </Button>
      </div>
    </div>
  );
}

export const WizardSidebar = memo(SidebarImpl);

