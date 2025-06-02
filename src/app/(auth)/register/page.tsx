/**
 * Multi-Step Registration Page
 * Implementation based on USER_REGISTRATION_SCREEN.md wireframe specifications
 * Features: Progressive disclosure, role-based conditioning, real-time validation
 */

'use client';

import { useToast } from '@/components/feedback/Toast/ToastProvider';
import {
  MultiStepFormProvider,
  type StepConfig,
  useMultiStepForm,
} from '@/components/forms/MultiStepForm/MultiStepFormProvider';
import { StepIndicator } from '@/components/forms/MultiStepForm/StepIndicator';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

// Temporary placeholder components
const UserInfoStep = () => (
  <div className="p-4 text-center text-neutral-600">User Info Step - Coming Soon</div>
);
const RoleAccessStep = () => (
  <div className="p-4 text-center text-neutral-600">Role Access Step - Coming Soon</div>
);
const SecuritySetupStep = () => (
  <div className="p-4 text-center text-neutral-600">Security Setup Step - Coming Soon</div>
);
const NotificationStep = () => (
  <div className="p-4 text-center text-neutral-600">Notification Step - Coming Soon</div>
);

// Temporary analytics hook
const useAnalytics = () => ({
  track: (event: string, data: any) => console.log('Analytics:', event, data),
});

// Temporary validation schemas
const userInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
});

const roleAccessSchema = z.object({
  role: z.string().min(1, 'Role selection is required'),
});

const securitySetupSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const notificationSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
});

export default function RegisterPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const analytics = useAnalytics();

  const steps: StepConfig[] = [
    {
      id: 'user-info',
      title: 'Personal Information',
      description: 'Basic account details',
      schema: userInfoSchema,
      component: UserInfoStep,
    },
    {
      id: 'role-access',
      title: 'Role & Access',
      description: 'Select your role and permissions',
      schema: roleAccessSchema,
      component: RoleAccessStep,
    },
    {
      id: 'security-setup',
      title: 'Security Settings',
      description: 'Password and security preferences',
      schema: securitySetupSchema,
      component: SecuritySetupStep,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Communication preferences',
      schema: notificationSchema,
      optional: true,
      component: NotificationStep,
    },
  ];

  const handleStepChange = (stepIndex: number, stepId: string) => {
    analytics.track('registration_step_started', {
      step: stepIndex + 1,
      stepId,
      timestamp: new Date(),
    });
  };

  const handleComplete = async (data: any) => {
    try {
      analytics.track('registration_completed', {
        totalSteps: steps.length,
        completedAt: new Date(),
        userRole: data['role-access']?.role,
      });

      // Here you would typically send the data to your API
      success('Registration completed successfully! Please check your email for verification.');

      // Redirect to login with success message
      router.push('/auth/login?registered=true');
    } catch (err) {
      error('Registration failed. Please try again.');
      analytics.track('registration_failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
        step: 'completion',
      });
    }
  };

  const handleError = (err: Error) => {
    error('An error occurred during registration. Please try again.');
    analytics.track('registration_error', {
      error: err.message,
      timestamp: new Date(),
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-neutral-900">PosalPro</h1>
            </div>
            <div className="text-sm text-neutral-600">
              Already have an account?{' '}
              <a href="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MultiStepFormProvider
          steps={steps}
          autoSave={true}
          storageKey="registration_progress"
          onStepChange={handleStepChange}
          onComplete={handleComplete}
          onError={handleError}
        >
          {/* Progress Header */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Create Your Account</h2>
              <p className="text-neutral-600">Get started with PosalPro in just a few steps</p>
            </div>

            <StepIndicator variant="horizontal" showLabels={true} size="md" className="relative" />
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm border p-6 lg:p-8">
            <RegistrationContent />
          </div>
        </MultiStepFormProvider>
      </div>
    </div>
  );
}

/**
 * Registration Content Component
 * Renders the current step content and navigation
 */
function RegistrationContent() {
  const {
    steps,
    currentStep,
    nextStep,
    previousStep,
    validateCurrentStep,
    isSubmitting,
    getAllStepData,
  } = useMultiStepForm();

  const currentStepConfig = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (isLastStep) {
        // Final submission
        const allData = getAllStepData();
        // This would be handled by the form provider's onComplete
        console.log('Final data:', allData);
      } else {
        nextStep();
      }
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      previousStep();
    }
  };

  if (!currentStepConfig) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">Loading registration form...</p>
      </div>
    );
  }

  const StepComponent = currentStepConfig.component;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-neutral-900">{currentStepConfig.title}</h3>
        {currentStepConfig.description && (
          <p className="text-neutral-600 mt-1">{currentStepConfig.description}</p>
        )}
      </div>

      {/* Step Content */}
      <div className="min-h-96">
        <StepComponent />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirstStep}
          className={`
            px-4 py-2 text-sm font-medium rounded-md
            ${
              isFirstStep
                ? 'text-neutral-400 cursor-not-allowed'
                : 'text-neutral-700 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500'
            }
          `}
        >
          Previous
        </button>

        <div className="flex items-center space-x-4">
          {/* Progress indicator */}
          <div className="text-sm text-neutral-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className={`
              px-6 py-2 text-sm font-medium rounded-md
              ${
                isLastStep
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            `}
          >
            {isSubmitting ? 'Processing...' : isLastStep ? 'Complete Registration' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
