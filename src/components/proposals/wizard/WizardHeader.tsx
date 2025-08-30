'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { memo, useMemo } from 'react';

export type PlanType = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

interface StepMeta {
  id: number;
  title: string;
}

interface WizardHeaderProps {
  title: string;
  subtitle: string;
  planType: PlanType;
  onPlanChange: (plan: PlanType) => void;
  steps: StepMeta[];
  visibleStepIds: number[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

function HeaderImpl({
  title,
  subtitle,
  planType,
  onPlanChange,
  steps,
  visibleStepIds,
  currentStep,
  onStepClick,
}: WizardHeaderProps) {
  const visibleSteps = useMemo(
    () => steps.filter(s => visibleStepIds.includes(s.id)),
    [steps, visibleStepIds]
  );

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2" aria-label="Plan selector">
            <span className="text-sm text-gray-600">Plan:</span>
            <label className="inline-flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="wizard-plan"
                className="accent-blue-600"
                checked={planType === 'BASIC'}
                onChange={() => onPlanChange('BASIC')}
              />
              Basic
            </label>
            <label className="inline-flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="wizard-plan"
                className="accent-blue-600"
                checked={planType === 'PROFESSIONAL'}
                onChange={() => onPlanChange('PROFESSIONAL')}
              />
              Professional
            </label>
            <label className="inline-flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="wizard-plan"
                className="accent-blue-600"
                checked={planType === 'ENTERPRISE'}
                onChange={() => onPlanChange('ENTERPRISE')}
              />
              Enterprise
            </label>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center overflow-x-auto" role="navigation" aria-label="Wizard steps">
            {visibleSteps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isClickable = isCompleted || step.id === currentStep;

              return (
                <div key={step.id} className="flex items-center min-w-max">
                  <button
                    onClick={() => onStepClick(step.id)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-200 ${
                      isCompleted
                        ? 'bg-green-500 text-white border-green-600'
                        : isCurrent
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-100 text-gray-400 cursor-pointer hover:text-gray-600'
                    } ${isClickable ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' : ''}`}
                    title={`Go to ${step.title}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : step.id}
                  </button>
                  <button
                    onClick={() => onStepClick(step.id)}
                    className={`ml-2 text-sm font-medium transition-colors duration-200 ${
                      isCurrent || isCompleted
                        ? 'text-gray-900'
                        : 'text-gray-700 hover:text-gray-900 cursor-pointer'
                    } focus:outline-none focus:underline`}
                    title={`Go to ${step.title}`}
                  >
                    {step.title}
                  </button>
                  {index < visibleSteps.length - 1 && (
                    <>
                      <div className={`ml-4 w-8 h-0.5 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                      {(() => {
                        const from = step.id;
                        const to = visibleSteps[index + 1].id;
                        const hiddenCount = to - from - 1;
                        if (hiddenCount > 0) {
                          return (
                            <div
                              className="mx-2 text-xs text-gray-400 italic select-none"
                              title={`Skipped ${hiddenCount} step${hiddenCount > 1 ? 's' : ''}`}
                              aria-label={`Skipped ${hiddenCount} steps`}
                            >
                              …{hiddenCount}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export const WizardHeader = memo(HeaderImpl);

