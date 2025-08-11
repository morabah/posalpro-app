/**
 * PosalPro MVP2 - Proposal Wizard StepOne
 */

'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/Card';

type WizardData = Record<string, unknown>;

interface StepOneProps {
  onDataChange?: (data: WizardData) => void;
  formData?: WizardData;
}

const StepOne = memo(({ onDataChange: _onDataChange, formData: _formData }: StepOneProps) => {
  // Silence unused props until implementation
  void _onDataChange;
  void _formData;
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
