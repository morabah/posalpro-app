/**
 * PosalPro MVP2 - Proposal Wizard StepFour
 */

'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/Card';

interface StepFourProps {
  onDataChange?: (data: any) => void;
  formData?: any;
}

const StepFour = memo(({ onDataChange, formData }: StepFourProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step Four</h2>
      <Card className="p-4">
        <p className="text-gray-600">
          StepFour content will be implemented here.
        </p>
      </Card>
    </div>
  );
});
StepFour.displayName = 'StepFour';

export default StepFour;
