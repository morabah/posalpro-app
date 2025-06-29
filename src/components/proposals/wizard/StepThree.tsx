/**
 * PosalPro MVP2 - Proposal Wizard StepThree
 */

'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/Card';

interface StepThreeProps {
  onDataChange?: (data: any) => void;
  formData?: any;
}

const StepThree = memo(({ onDataChange, formData }: StepThreeProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step Three</h2>
      <Card className="p-4">
        <p className="text-gray-600">
          StepThree content will be implemented here.
        </p>
      </Card>
    </div>
  );
});
StepThree.displayName = 'StepThree';

export default StepThree;
