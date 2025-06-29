/**
 * PosalPro MVP2 - Proposal Wizard StepTwo
 */

'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/Card';

interface StepTwoProps {
  onDataChange?: (data: any) => void;
  formData?: any;
}

const StepTwo = memo(({ onDataChange, formData }: StepTwoProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step Two</h2>
      <Card className="p-4">
        <p className="text-gray-600">
          StepTwo content will be implemented here.
        </p>
      </Card>
    </div>
  );
});
StepTwo.displayName = 'StepTwo';

export default StepTwo;
