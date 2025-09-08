'use client';

/**
 * PosalPro MVP2 - Registration Form Component
 * Based on USER_REGISTRATION_SCREEN.md wireframe specifications
 * Progressive disclosure design with role assignment workflow
 */

import { useUserRegistrationAnalytics } from '@/hooks/auth/useUserRegistrationAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
// Removed lucide-react icons from initial bundle to reduce /auth/register first-load size
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm, UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { z } from 'zod';

// Type definitions for registration form components
interface RegistrationResponse {
  success: boolean;
  userId?: string;
  data?: {
    userId?: string;
    [key: string]: unknown;
  };
  error?: string;
}

interface StepUserInfoProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  aiSuggestions: Record<string, string>;
}

interface StepRoleAccessProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  setValue: UseFormSetValue<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
}

interface StepNotificationsProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  setValue: UseFormSetValue<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
}

interface StepConfirmationProps {
  data: RegistrationFormData;
}

type StepComponent = React.ComponentType<StepUserInfoProps | StepRoleAccessProps | StepNotificationsProps | StepConfirmationProps>;

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2'],
  methods: ['createUser()', 'configureAccess()', 'configureSecuritySettings()'],
  hypotheses: ['H4'],
  testCases: ['TC-H4-002'],
};

// Multi-step form schema
const registrationSchema = z.object({
  // User Information Step
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  title: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  office: z.string().optional(),
  phone: z.string().optional(),
  languages: z.array(z.string()).optional(),
  profileImage: z.string().optional(),
  passwordSetting: z.enum(['system', 'first_login', 'admin_set']),

  // Role & Access Step
  primaryRole: z.string().min(1, 'Primary role is required'),
  additionalRoles: z.array(z.string()).optional(),
  teamAssignments: z.array(z.string()).optional(),
  permissionOverrides: z.array(z.string()).optional(),
  accessLevel: z.enum(['standard', 'power', 'admin']),

  // Notifications Step
  emailNotifications: z.array(z.string()).optional(),
  inAppNotifications: z.array(z.string()).optional(),
  mobileNotifications: z.array(z.string()).optional(),
  digestPreferences: z.array(z.string()).optional(),

  // Terms and Privacy
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
  marketingConsent: z.boolean().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

// Form steps
const REGISTRATION_STEPS = [
  { id: 'user_info', title: 'User Info', description: 'Basic information' },
  { id: 'role_access', title: 'Role & Access', description: 'Permissions and teams' },
  { id: 'notifications', title: 'Notifications', description: 'Communication preferences' },
  { id: 'confirmation', title: 'Confirmation', description: 'Review and confirm' },
];

// Available roles and teams
const AVAILABLE_ROLES = [
  'Proposal Manager',
  'Technical SME',
  'Presales Engineer',
  'Bid Manager',
  'Technical Director',
  'Business Development Manager',
  'Proposal Specialist',
  'SME Contributor',
  'Approver',
  'Executive Reviewer',
  'RFP Analyst',
];

const AVAILABLE_TEAMS = [
  'Healthcare Solutions Team',
  'Enterprise Proposals Team',
  'Government Contracts Team',
  'Financial Services Team',
];

const DEPARTMENTS = [
  'Sales Engineering',
  'Business Development',
  'Technical Services',
  'Marketing',
  'Operations',
  'Finance',
  'Legal',
];

const OFFICES = [
  'Northeast Regional',
  'Southeast Regional',
  'Midwest Regional',
  'West Coast Regional',
  'International',
];

interface RegistrationFormProps {
  className?: string;
  onSuccess?: (userId: string) => void;
}

export function RegistrationForm({ className = '', onSuccess }: RegistrationFormProps) {
  const router = useRouter();
  const analytics = useUserRegistrationAnalytics();
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
    getValues,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: {
      passwordSetting: 'first_login',
      accessLevel: 'power',
      additionalRoles: [],
      teamAssignments: [],
      permissionOverrides: [],
      emailNotifications: ['proposals', 'approvals', 'tasks'],
      inAppNotifications: ['proposals', 'approvals', 'tasks', 'announcements'],
      mobileNotifications: ['approvals', 'deadlines'],
      digestPreferences: ['daily'],
      acceptTerms: false,
      marketingConsent: false,
    },
  });

  const watchedFields = watch();

  // AI Suggestions based on email domain and title
  useEffect(() => {
    const email = watchedFields.email;
    const title = watchedFields.title;

    if (email?.includes('@healthcare')) {
      setAiSuggestions(prev => ({
        ...prev,
        office:
          '💡 Based on the email domain, this user is likely in the Northeast Regional office.',
      }));
    }

    if (title?.toLowerCase().includes('engineer')) {
      setAiSuggestions(prev => ({
        ...prev,
        department:
          '💡 Similar users with this title are typically in the Sales Engineering department.',
      }));
    }
  }, [watchedFields.email, watchedFields.title]);

  // Track step progression
  const handleStepChange = useCallback(
    (newStep: number) => {
      const stepDuration = Date.now() - stepStartTime;
      const currentStepId = REGISTRATION_STEPS[currentStep].id;

      analytics.trackPageProgression(currentStepId, REGISTRATION_STEPS[newStep].id, stepDuration);

      analytics.trackRegistrationStep({
        step: currentStepId,
        completionTime: stepDuration,
        errors: Object.keys(errors).length,
        aiSuggestionsUsed: Object.keys(aiSuggestions).length,
      });

      setCurrentStep(newStep);
      setStepStartTime(Date.now());
    },
    [currentStep, stepStartTime, analytics, errors, aiSuggestions]
  );

  // Handle next step
  const handleNext = async () => {
    const isStepValid = await trigger();
    if (isStepValid && currentStep < REGISTRATION_STEPS.length - 1) {
      handleStepChange(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  // Handle form submission
  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      // Track registration attempt analytics
      analytics.trackRegistrationStep({
        step: 'submission',
        completionTime: 0,
        errors: 0,
        aiSuggestionsUsed: Object.keys(aiSuggestions).length,
      });

      // Use centralized API client instead of direct fetch
      const result = await apiClient.post<RegistrationResponse>('/api/auth/register', {
        ...data,
        roles: [data.primaryRole, ...(data.additionalRoles || [])],
        notificationChannels: ['EMAIL', 'PUSH', 'IN_APP'],
        notificationFrequency: data.digestPreferences?.includes('daily') ? 'daily' : 'weekly',
      });

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      // Track successful registration
      const userId = result.userId || result.data?.userId;
      if (userId) {
        analytics.trackOnboardingSuccess({
          userId,
          completionRate: 100,
          timeToFirstLogin: 0, // Will be updated on first login
          stepsCompleted: REGISTRATION_STEPS.map(step => step.id),
        });

        analytics.trackRoleAssignment({
          userId,
          roles: [data.primaryRole, ...(data.additionalRoles || [])],
          teamCount: data.teamAssignments?.length || 0,
          permissionOverrides: data.permissionOverrides || [],
          aiRecommendationsAccepted: Object.keys(aiSuggestions).length,
        });

        onSuccess?.(userId);
      }
      router.push('/auth/login?registered=true');
    } catch (error) {
      // Use standardized error handling
      const standardError = errorHandlingService.processError(
        error,
        'User registration failed',
        ErrorCodes.AUTH.REGISTRATION_FAILED,
        {
          component: 'RegistrationForm',
          operation: 'registerUser',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          step: currentStep,
          formData: {
            email: data.email,
            department: data.department,
            primaryRole: data.primaryRole,
          },
        }
      );

      const errorMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setSubmitError(errorMessage);

      // Track registration failure analytics
      analytics.trackFormValidation('form', errorMessage, 'confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: {
        const Step = dynamic(() => import('./registration/StepUserInfo')) as React.ComponentType<any>;
        return <Step register={register} errors={errors} aiSuggestions={aiSuggestions} />;
      }
      case 1: {
        const Step = dynamic(() => import('./registration/StepRoleAccess')) as React.ComponentType<any>;
        return <Step register={register} errors={errors} setValue={setValue} watch={watch} />;
      }
      case 2: {
        const Step = dynamic(() => import('./registration/StepNotifications')) as React.ComponentType<any>;
        return <Step register={register} errors={errors} setValue={setValue} watch={watch} />;
      }
      case 3: {
        const Step = dynamic(() => import('./registration/StepConfirmation')) as React.ComponentType<any>;
        return <Step data={getValues()} />;
      }
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 ${className}`}
    >
      {/* Progress Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
              Create Your PosalPro Account
            </h1>
            <p className="text-neutral-600">Set up your enterprise account in just a few steps</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4">
            {REGISTRATION_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                    index === currentStep
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                      : index < currentStep
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === currentStep
                        ? 'bg-white text-primary-600'
                        : index < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-neutral-300 text-neutral-600'
                    }`}
                  >
                    {index < currentStep ? (
                      <span className="w-5 h-5" aria-hidden>
                        ✓
                      </span>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-semibold">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </div>
                {index < REGISTRATION_STEPS.length - 1 && (
                  <span className="w-4 h-4 mx-2 text-neutral-400" aria-hidden>
                    ›
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden">
          {/* Error Alert */}
          {submitError && (
            <div className="m-8 mb-0 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <span className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden>
                !
              </span>
              <div>
                <p className="text-red-800 font-medium">Registration Failed</p>
                <p className="text-red-700 text-sm mt-1">{submitError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-8">{renderStepContent()}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-8 bg-neutral-50 border-t border-neutral-200">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 px-6 py-3 text-neutral-700 bg-white border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="w-5 h-5" aria-hidden>
                  ←
                </span>
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600">
                  Step {currentStep + 1} of {REGISTRATION_STEPS.length}
                </span>
                <div className="flex space-x-1">
                  {REGISTRATION_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentStep
                          ? 'bg-primary-600'
                          : index < currentStep
                            ? 'bg-green-500'
                            : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {currentStep < REGISTRATION_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  <span>Next</span>
                  <span className="w-5 h-5" aria-hidden>
                    →
                  </span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !isValid}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 animate-spin" aria-hidden>
                        ⏳
                      </span>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-5 h-5" aria-hidden>
                        ✓
                      </span>
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// User Information Step Component
function UserInfoStep({
  register,
  errors,
  aiSuggestions,
}: StepUserInfoProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900">User Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">First Name *</label>
          <input
            {...register('firstName')}
            type="text"
            className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-300' : 'border-neutral-300'
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Last Name *</label>
          <input
            {...register('lastName')}
            type="text"
            className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-300' : 'border-neutral-300'
            }`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Email *</label>
          <input
            {...register('email')}
            type="email"
            className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-300' : 'border-neutral-300'
            }`}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Title</label>
          <input
            {...register('title')}
            type="text"
            className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Department *</label>
          <select
            {...register('department')}
            className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.department ? 'border-red-300' : 'border-neutral-300'
            }`}
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          {errors.department && (
            <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
          )}
          {aiSuggestions.department && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 text-blue-500 mt-0.5" aria-hidden>
                  💡
                </span>
                <p className="text-sm text-blue-700">{aiSuggestions.department}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Office</label>
          <select
            {...register('office')}
            className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Office</option>
            {OFFICES.map(office => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>
          {aiSuggestions.office && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 text-blue-500 mt-0.5" aria-hidden>
                  💡
                </span>
                <p className="text-sm text-blue-700">{aiSuggestions.office}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Password Setting */}
      <div className="mt-8">
        <label className="block text-sm font-medium text-neutral-700 mb-4">
          Initial Password Setting:
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              {...register('passwordSetting')}
              type="radio"
              value="system"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-neutral-700">System Generated (Email)</span>
          </label>
          <label className="flex items-center">
            <input
              {...register('passwordSetting')}
              type="radio"
              value="first_login"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-neutral-700">User Sets at First Login</span>
          </label>
          <label className="flex items-center">
            <input
              {...register('passwordSetting')}
              type="radio"
              value="admin_set"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-neutral-700">Admin Sets Password</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Role & Access Step Component
function RoleAccessStep({
  register,
  errors,
  setValue,
  watch,
}: StepRoleAccessProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const handleRoleToggle = (role: string) => {
    const newRoles = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles, role];
    setSelectedRoles(newRoles);
    setValue('additionalRoles', newRoles);
  };

  const handleTeamToggle = (team: string) => {
    const newTeams = selectedTeams.includes(team)
      ? selectedTeams.filter(t => t !== team)
      : [...selectedTeams, team];
    setSelectedTeams(newTeams);
    setValue('teamAssignments', newTeams);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900">Role & Access</h3>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Primary Role *</label>
        <select
          {...register('primaryRole')}
          className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.primaryRole ? 'border-red-300' : 'border-neutral-300'
          }`}
        >
          <option value="">Select Primary Role</option>
          {AVAILABLE_ROLES.map(role => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {errors.primaryRole && (
          <p className="mt-1 text-sm text-red-600">{errors.primaryRole.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">Additional Roles:</label>
        <div className="grid grid-cols-2 gap-3">
          {['SME Contributor', 'Approver', 'Executive Reviewer', 'RFP Analyst'].map(role => (
            <label key={role} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => handleRoleToggle(role)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="ml-3 text-sm text-neutral-700">{role}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">Team Assignments:</label>
        <div className="space-y-3">
          {AVAILABLE_TEAMS.map(team => (
            <label key={team} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTeams.includes(team)}
                onChange={() => handleTeamToggle(team)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="ml-3 text-sm text-neutral-700">{team}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">
          System Access Level:
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              {...register('accessLevel')}
              type="radio"
              value="standard"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-neutral-700">Standard User</span>
          </label>
          <label className="flex items-center">
            <input
              {...register('accessLevel')}
              type="radio"
              value="power"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-neutral-700">Power User</span>
          </label>
          <label className="flex items-center">
            <input
              {...register('accessLevel')}
              type="radio"
              value="admin"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-neutral-700">System Administrator</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Notifications Step Component
function NotificationsStep({
  register,
  errors,
  setValue,
  watch,
}: StepNotificationsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900">Default Notification Settings</h3>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">
          Email Notifications:
        </label>
        <div className="space-y-3">
          {[
            { value: 'proposals', label: 'Proposal status changes' },
            { value: 'approvals', label: 'Approval requests' },
            { value: 'tasks', label: 'Task assignments' },
            { value: 'announcements', label: 'System announcements' },
            { value: 'teams', label: 'Team updates' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center">
              <input
                {...register('emailNotifications')}
                type="checkbox"
                value={value}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="ml-3 text-sm text-neutral-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">
          In-App Notifications:
        </label>
        <div className="space-y-3">
          {[
            { value: 'proposals', label: 'Proposal status changes' },
            { value: 'approvals', label: 'Approval requests' },
            { value: 'tasks', label: 'Task assignments' },
            { value: 'announcements', label: 'System announcements' },
            { value: 'teams', label: 'Team updates' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center">
              <input
                {...register('inAppNotifications')}
                type="checkbox"
                value={value}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="ml-3 text-sm text-neutral-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">
          Mobile Push Notifications:
        </label>
        <div className="space-y-3">
          {[
            { value: 'approvals', label: 'Approval requests' },
            { value: 'deadlines', label: 'Critical deadlines' },
            { value: 'announcements', label: 'System announcements' },
            { value: 'teams', label: 'Team updates' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center">
              <input
                {...register('mobileNotifications')}
                type="checkbox"
                value={value}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="ml-3 text-sm text-neutral-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">
          Default Digest Preferences:
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              {...register('digestPreferences')}
              type="checkbox"
              value="daily"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
            />
            <span className="ml-3 text-sm text-neutral-700">Daily summary email</span>
          </label>
          <label className="flex items-center">
            <input
              {...register('digestPreferences')}
              type="checkbox"
              value="weekly"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
            />
            <span className="ml-3 text-sm text-neutral-700">Weekly activity report</span>
          </label>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start space-x-2">
          <span className="w-5 h-5 text-blue-500 mt-0.5" aria-hidden>
            💡
          </span>
          <div>
            <p className="text-sm font-medium text-blue-800">AI Recommendation:</p>
            <p className="text-sm text-blue-700 mt-1">
              Similar users in this role typically enable daily summaries and disable system
              announcements for reduced email volume.
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Privacy */}
      <div className="border-t pt-6 mt-8">
        <div className="space-y-4">
          <label className="flex items-start">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded mt-1"
            />
            <span className="ml-3 text-sm text-neutral-700">
              I accept the{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>{' '}
              *
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="ml-7 text-sm text-red-600">{errors.acceptTerms.message}</p>
          )}

          <label className="flex items-start">
            <input
              {...register('marketingConsent')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded mt-1"
            />
            <span className="ml-3 text-sm text-neutral-700">
              I would like to receive product updates and marketing communications
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Confirmation Step Component
function ConfirmationStep({ data }: StepConfirmationProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900">Confirm New User Details</h3>

      <div className="bg-neutral-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-medium text-neutral-900">User Information:</h4>
          <div className="mt-2 text-sm text-neutral-600 space-y-1">
            <p>
              {data.firstName} {data.lastName}
            </p>
            <p>{data.title}</p>
            <p>{data.email}</p>
            <p>{data.department}</p>
            <p>{data.office}</p>
            <p>{data.phone}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-neutral-900">Role & Access:</h4>
          <div className="mt-2 text-sm text-neutral-600 space-y-1">
            <p>Primary Role: {data.primaryRole}</p>
            <p>Teams: {data.teamAssignments?.join(', ') || 'None'}</p>
            <p>Access Level: {data.accessLevel}</p>
            <p>Additional Roles: {data.additionalRoles?.join(', ') || 'None'}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-neutral-900">Notifications:</h4>
          <div className="mt-2 text-sm text-neutral-600 space-y-1">
            <p>Email: {data.emailNotifications?.join(', ')}</p>
            <p>In-App: All enabled</p>
            <p>Mobile: {data.mobileNotifications?.join(', ')}</p>
            <p>Digest: {data.digestPreferences?.join(', ')}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-neutral-900">Initial Access:</h4>
          <div className="mt-2 text-sm text-neutral-600 space-y-1">
            <p>
              Password:{' '}
              {data.passwordSetting === 'first_login'
                ? 'Set at first login'
                : data.passwordSetting === 'system'
                  ? 'System generated'
                  : 'Admin set'}
            </p>
            <p>MFA: Required</p>
          </div>
        </div>
      </div>

      {/* Onboarding Process */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Onboarding Process:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>Upon creation:</p>
          <p>1. Welcome email will be sent</p>
          <p>2. User sets password & MFA</p>
          <p>3. Training materials provided</p>
          <p>4. Manager notified</p>
        </div>
      </div>
    </div>
  );
}
