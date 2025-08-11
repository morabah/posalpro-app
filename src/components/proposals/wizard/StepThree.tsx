/**
 * PosalPro MVP2 - Proposal Wizard StepThree
 */

'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/Card';

type WizardData = Record<string, unknown>;

interface StepThreeProps {
  onDataChange?: (data: WizardData) => void;
  formData?: WizardData;
}

const StepThree = memo(({ onDataChange: _onDataChange, formData: _formData }: StepThreeProps) => {
  // Silence unused props until implementation
  void _onDataChange;
  void _formData;
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
