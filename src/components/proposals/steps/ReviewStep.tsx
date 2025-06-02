'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 6: Review & Finalize
 * To be fully implemented in next iteration
 */

import { Card } from '@/components/ui/Card';

interface ReviewStepProps {
  data: any;
  onUpdate: (data: any) => void;
  analytics: any;
}

export function ReviewStep({ data, onUpdate, analytics }: ReviewStepProps) {
  return (
    <div className="space-y-8">
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Review & Finalize</h3>
          <div className="text-center py-12">
            <p className="text-neutral-600">
              Final review and validation interface will be implemented in the next phase.
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              This step will include AI-generated insights and proposal validation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
