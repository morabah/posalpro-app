/**
 * PosalPro MVP2 - Proposal Wizard StepOne
 */

'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/Card';

interface StepOneProps {
  onDataChange?: (data: any) => void;
  formData?: any;
}

const StepOne = memo(({ onDataChange, formData }: StepOneProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step One</h2>
      <Card className="p-4">
        <p className="text-gray-600">
          StepOne content will be implemented here.
        </p>
      </Card>
    </div>
  );
});
StepOne.displayName = 'StepOne';

export default StepOne;
