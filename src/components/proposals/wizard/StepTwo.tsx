/**
 * PosalPro MVP2 - Proposal Wizard StepTwo
 */

'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/Card';

type WizardData = Record<string, unknown>;

interface StepTwoProps {
  onDataChange?: (data: WizardData) => void;
  formData?: WizardData;
}

const StepTwo = memo(({ onDataChange: _onDataChange, formData: _formData }: StepTwoProps) => {
  // Silence unused props until implementation
  void _onDataChange;
  void _formData;
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
