/**
 * Step Indicator Component
 * Visual progress indicator for multi-step forms with accessibility support
 */

'use client';

import { CheckIcon } from 'lucide-react';
import React from 'react';
import { useMultiStepForm } from './MultiStepFormProvider';

interface StepIndicatorProps {
  className?: string;
  showLabels?: boolean;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export function StepIndicator({
  className = '',
  showLabels = true,
  variant = 'horizontal',
  size = 'md',
}: StepIndicatorProps) {
  const { steps, currentStep, visitedSteps, progress, goToStep, canNavigateToStep } =
    useMultiStepForm();

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (visitedSteps.has(stepIndex)) return 'visited';
    return 'upcoming';
  };

  const getStepStyles = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const baseClasses = `
      ${sizeClasses[size]}
      rounded-full
      flex
      items-center
      justify-center
      font-medium
      transition-all
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-primary-500
      focus:ring-offset-2
    `;

    switch (status) {
      case 'completed':
        return `${baseClasses} bg-primary-600 text-white hover:bg-primary-700 cursor-pointer`;
      case 'current':
        return `${baseClasses} bg-primary-100 text-primary-700 border-2 border-primary-600`;
      case 'visited':
        return `${baseClasses} bg-neutral-200 text-neutral-700 hover:bg-neutral-300 cursor-pointer`;
      case 'upcoming':
        return `${baseClasses} bg-neutral-100 text-neutral-400 border border-neutral-300`;
      default:
        return baseClasses;
    }
  };

  const getConnectorStyles = (stepIndex: number) => {
    const isCompleted = stepIndex < currentStep;
    const baseClasses = variant === 'horizontal' ? 'flex-1 h-0.5 mx-2' : 'w-0.5 h-8 my-2 mx-auto';

    return `${baseClasses} ${
      isCompleted ? 'bg-primary-600' : 'bg-neutral-300'
    } transition-colors duration-200`;
  };

  const handleStepClick = (stepIndex: number) => {
    if (canNavigateToStep(stepIndex) && stepIndex !== currentStep) {
      goToStep(stepIndex);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, stepIndex: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStepClick(stepIndex);
    }
  };

  if (variant === 'vertical') {
    return (
      <div
        className={`flex flex-col ${className}`}
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemax={steps.length}
      >
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className="flex items-center">
              <button
                type="button"
                className={getStepStyles(index)}
                onClick={() => handleStepClick(index)}
                onKeyDown={e => handleKeyDown(e, index)}
                disabled={!canNavigateToStep(index)}
                aria-label={`Step ${index + 1}: ${step.title}${
                  index === currentStep ? ' (current)' : ''
                }`}
                aria-current={index === currentStep ? 'step' : undefined}
              >
                {getStepStatus(index) === 'completed' ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              {showLabels && (
                <div className="ml-3 text-left">
                  <div
                    className={`text-sm font-medium ${
                      index === currentStep
                        ? 'text-primary-600'
                        : index < currentStep
                          ? 'text-neutral-900'
                          : 'text-neutral-500'
                    }`}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-neutral-500 mt-1">{step.description}</div>
                  )}
                </div>
              )}
            </div>
            {index < steps.length - 1 && <div className={getConnectorStyles(index)} />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center ${className}`}
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemax={steps.length}
    >
      {/* Progress bar background */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-300 -translate-y-1/2 -z-10" />
      <div
        className="absolute top-1/2 left-0 h-0.5 bg-primary-600 -translate-y-1/2 -z-10 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />

      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center relative">
          <div className="flex flex-col items-center">
            <button
              type="button"
              className={getStepStyles(index)}
              onClick={() => handleStepClick(index)}
              onKeyDown={e => handleKeyDown(e, index)}
              disabled={!canNavigateToStep(index)}
              aria-label={`Step ${index + 1}: ${step.title}${
                index === currentStep ? ' (current)' : ''
              }`}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              {getStepStatus(index) === 'completed' ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </button>
            {showLabels && (
              <div className="mt-2 text-center">
                <div
                  className={`text-xs font-medium ${
                    index === currentStep
                      ? 'text-primary-600'
                      : index < currentStep
                        ? 'text-neutral-900'
                        : 'text-neutral-500'
                  }`}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-neutral-400 mt-1 max-w-20 truncate">
                    {step.description}
                  </div>
                )}
              </div>
            )}
          </div>
          {index < steps.length - 1 && <div className={getConnectorStyles(index)} />}
        </div>
      ))}
    </div>
  );
}

interface ProgressBarProps {
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ className = '', showPercentage = false }: ProgressBarProps) {
  const { progress, currentStep, steps } = useMultiStepForm();

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-neutral-700">
          Step {currentStep + 1} of {steps.length}
        </span>
        {showPercentage && (
          <span className="text-sm text-neutral-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
