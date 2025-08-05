'use client';

/**
 * PosalPro MVP2 - User Profile Management Component
 * Phase 2.1.4: User Profile Management Implementation
 *
 * Comprehensive user profile management with:
 * - Personal information editing with real-time validation
 * - Profile image upload and management
 * - Expertise area selection and tracking
 * - Multi-tab interface (Personal, Preferences, Notifications, Security)
 * - Analytics integration for user behavior tracking
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Role-based access control integration
 * - Performance optimization with form state management
 */

import { useAuth } from '@/components/providers/AuthProvider';
import { useUserProfileAnalytics } from '@/hooks/auth/useUserProfileAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Bell,
  Camera,
  Check,
  Edit3,
  Loader2,
  Save,
  Settings as SettingsIcon,
  Shield,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { NotificationsTab } from './NotificationsTab';
import { PreferencesTab } from './PreferencesTab';
import { SecurityTab } from './SecurityTab';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3', 'US-2.1', 'US-4.3'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2', 'AC-2.1.1', 'AC-4.3.1'],
  methods: [
    'configureRoleAccess()',
    'updatePersonalInfo()',
    'manageVisibility()',
    'updateSkills()',
    'trackExpertise()',
  ],
  hypotheses: ['H3', 'H4'],
  testCases: ['TC-H3-001', 'TC-H4-002'],
};

// Validation schema for profile data
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  office: z.string().optional(),
  languages: z.array(z.string()).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  profileImage: z.string().optional(),
  expertiseAreas: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type TabSection = 'personal' | 'preferences' | 'notifications' | 'security';

const PROFILE_TABS = [
  { id: 'personal' as const, label: 'Personal', icon: User },
  { id: 'preferences' as const, label: 'Preferences', icon: SettingsIcon },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'security' as const, label: 'Access & Security', icon: Shield },
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

const EXPERTISE_AREAS = [
  'Technical Solutions',
  'Healthcare Industry',
  'Enterprise Software',
  'Government Contracts',
  'Financial Services',
  'Manufacturing',
  'Telecommunications',
  'Cloud Infrastructure',
  'Cybersecurity',
  'Data Analytics',
];

interface UserProfileProps {
  className?: string;
}

export function UserProfile({ className = '' }: UserProfileProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth() || {};
  const analytics = useUserProfileAnalytics();
  const apiClient = useApiClient();

  const [activeTab, setActiveTab] = useState<TabSection>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    setValue,
    watch,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ')[1] || '',
      title: '',
      email: user?.email || '',
      phone: '',
      department: user?.department || '',
      office: '',
      languages: ['English'],
      bio: '',
      profileImage: '',
      expertiseAreas: [],
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Track page load
  useEffect(() => {
    if (user) {
      analytics.trackProfileUsage({
        profileCompleteness: calculateCompleteness(),
        securitySettingsConfigured: 1,
        preferencesCustomized: 1,
      });
    }
  }, [user, analytics]);

  // Calculate profile completeness
  const calculateCompleteness = useCallback(() => {
    const watchedFields = watch();
    const requiredFields = ['firstName', 'lastName', 'email'];
    const optionalFields = ['title', 'phone', 'office', 'bio', 'department'];

    const requiredComplete = requiredFields.filter(
      field => watchedFields[field as keyof ProfileFormData]
    ).length;
    const optionalComplete = optionalFields.filter(
      field => watchedFields[field as keyof ProfileFormData]
    ).length;

    const totalWeight = requiredFields.length * 2 + optionalFields.length;
    const completedWeight = requiredComplete * 2 + optionalComplete;

    return Math.round((completedWeight / totalWeight) * 100);
  }, [watch]);

  // Handle tab change
  const handleTabChange = (tab: TabSection) => {
    if (isDirty && isEditing) {
      if (confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
        setActiveTab(tab);
        setIsEditing(false);
        reset();
      }
    } else {
      setActiveTab(tab);
    }

    analytics.trackRoleBasedAccess(`profile_${tab}`, user?.roles?.[0] || 'user');
  };

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    // Initialize error handling service
    const errorHandlingService = ErrorHandlingService.getInstance();

    try {
      // DEBUG: Log what data is being sent
      const requestData = {
        ...data,
        expertiseAreas, // Include from state since it's not in form data
        profileImage,
      };

      console.log('🔍 DEBUG: Profile update request data:', {
        formData: data,
        requestData: requestData,
        dataKeys: Object.keys(requestData),
        expertiseAreas: requestData.expertiseAreas,
        profileImage: requestData.profileImage,
      });

      // Use centralized API client instead of direct fetch
      const result = await apiClient.put<{
        success: boolean;
        data?: any;
        error?: string;
      }>('/api/profile/update', requestData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      const updateTime = Date.now() - startTime;

      // Track successful update
      analytics.trackProfileUpdate({
        section: 'personal',
        field: 'bulk_update',
        newValue: JSON.stringify(data),
        updateTime,
      });

      analytics.trackProfileCompletion(calculateCompleteness(), [], []);

      setIsEditing(false);
      setError(null);
    } catch (error) {
      // Use standardized error handling
      const standardError = errorHandlingService.processError(
        error,
        'Profile update failed',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'UserProfile',
          operation: 'updateProfile',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          profileData: {
            firstName: data.firstName,
            lastName: data.lastName,
            department: data.department,
          },
        }
      );

      const errorMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle expertise area toggle
  const handleExpertiseToggle = (area: string) => {
    const newAreas = expertiseAreas.includes(area)
      ? expertiseAreas.filter(a => a !== area)
      : [...expertiseAreas, area];

    setExpertiseAreas(newAreas);
    setValue('expertiseAreas', newAreas); // Update form data

    analytics.trackExpertiseUpdate({
      expertiseArea: area,
      action: expertiseAreas.includes(area) ? 'remove' : 'add',
      verification: 'self',
    });
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, upload to a file service
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setProfileImage(result);
        setValue('profileImage', result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                PosalPro
              </h1>
              <span className="text-sm text-neutral-500 px-2 py-1 bg-neutral-100 rounded-full">
                Profile
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">User Profile</h1>
            <p className="text-neutral-600 text-lg">
              Manage your personal information, preferences, and security settings
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Settings</h3>
                <nav className="space-y-2">
                  {PROFILE_TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-primary-50 to-blue-50 text-primary-700 border-l-4 border-primary-600'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            activeTab === tab.id ? 'text-primary-600' : 'text-neutral-400'
                          }`}
                        />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Profile Completeness Card */}
            <div className="mt-6 bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
              <h4 className="text-sm font-semibold text-neutral-700 mb-3">Profile Completeness</h4>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateCompleteness()}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-neutral-900">
                  {calculateCompleteness()}%
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Complete your profile to unlock all features
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
              {activeTab === 'personal' && (
                <PersonalTab
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  isLoading={isLoading}
                  profileImage={profileImage}
                  expertiseAreas={expertiseAreas}
                  onSubmit={handleSubmit(onSubmit)}
                  onImageUpload={handleImageUpload}
                  onExpertiseToggle={handleExpertiseToggle}
                  onCancel={() => {
                    setIsEditing(false);
                    reset();
                  }}
                  user={user}
                  completeness={calculateCompleteness()}
                />
              )}

              {activeTab === 'preferences' && (
                <div className="p-8">
                  <PreferencesTab analytics={analytics} user={user} />
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="p-8">
                  <NotificationsTab analytics={analytics} user={user} />
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-8">
                  <SecurityTab analytics={analytics} user={user} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Personal Tab Component
interface PersonalTabProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isLoading: boolean;
  profileImage: string | null;
  expertiseAreas: string[];
  onSubmit: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExpertiseToggle: (area: string) => void;
  onCancel: () => void;
  user: any;
  completeness: number;
}

function PersonalTab({
  register,
  errors,
  watch,
  setValue,
  isEditing,
  setIsEditing,
  isLoading,
  profileImage,
  expertiseAreas,
  onSubmit,
  onImageUpload,
  onExpertiseToggle,
  onCancel,
  user,
  completeness,
}: PersonalTabProps) {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Personal Information</h2>
          <p className="text-neutral-600 mt-1">
            Update your personal details and profile preferences
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-8 border border-primary-100">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <div className="w-28 h-28 bg-white rounded-full overflow-hidden shadow-lg border-4 border-white">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-600 bg-primary-50">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-neutral-900">
                {watch('firstName')} {watch('lastName')}
              </h3>
              <p className="text-lg text-primary-700 font-medium">{watch('title')}</p>
              <p className="text-neutral-600 mt-2">
                {watch('department')} {watch('office') && `• ${watch('office')}`}
              </p>

              {/* Profile Completeness */}
              <div className="mt-4 flex items-center space-x-3">
                <span className="text-sm font-medium text-neutral-700">Profile Completeness:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-green-600">{completeness}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h4 className="text-lg font-semibold text-neutral-900 mb-6">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                First Name *
              </label>
              <input
                {...register('firstName')}
                type="text"
                disabled={!isEditing}
                className={`w-full h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                  !isEditing ? 'bg-neutral-50 cursor-not-allowed' : 'hover:border-neutral-400'
                } ${errors.firstName ? 'border-red-300 bg-red-50' : 'border-neutral-300'}`}
              />
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.firstName.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Last Name *
              </label>
              <input
                {...register('lastName')}
                type="text"
                disabled={!isEditing}
                className={`w-full h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                  !isEditing ? 'bg-neutral-50 cursor-not-allowed' : 'hover:border-neutral-400'
                } ${errors.lastName ? 'border-red-300 bg-red-50' : 'border-neutral-300'}`}
              />
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.lastName.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Job Title *
              </label>
              <input
                {...register('title')}
                type="text"
                disabled={!isEditing}
                className={`w-full h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                  !isEditing ? 'bg-neutral-50 cursor-not-allowed' : 'hover:border-neutral-400'
                } ${errors.title ? 'border-red-300 bg-red-50' : 'border-neutral-300'}`}
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.title.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Email Address *
              </label>
              <input
                {...register('email')}
                type="email"
                disabled={!isEditing}
                className={`w-full h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                  !isEditing ? 'bg-neutral-50 cursor-not-allowed' : 'hover:border-neutral-400'
                } ${errors.email ? 'border-red-300 bg-red-50' : 'border-neutral-300'}`}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                disabled={!isEditing}
                className={`w-full h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                  !isEditing ? 'bg-neutral-50 cursor-not-allowed' : 'hover:border-neutral-400'
                } ${errors.phone ? 'border-red-300 bg-red-50' : 'border-neutral-300'}`}
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.phone.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Department *
              </label>
              <select
                {...register('department')}
                disabled={!isEditing}
                className={`w-full h-12 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                  !isEditing ? 'bg-neutral-50 cursor-not-allowed' : 'hover:border-neutral-400'
                } ${errors.department ? 'border-red-300 bg-red-50' : 'border-neutral-300'}`}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.department.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Expertise Areas Section */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h4 className="text-lg font-semibold text-neutral-900 mb-4">Areas of Expertise</h4>
          <p className="text-neutral-600 mb-6">
            Select your areas of expertise to help with proposal assignments
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {EXPERTISE_AREAS.map(area => (
              <button
                key={area}
                type="button"
                onClick={() => isEditing && onExpertiseToggle(area)}
                disabled={!isEditing}
                className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                  expertiseAreas.includes(area)
                    ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200 text-primary-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                } ${
                  !isEditing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-md'
                }`}
              >
                {area}
                {expertiseAreas.includes(area) && (
                  <Check className="w-4 h-4 ml-2 inline-block text-primary-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h4 className="text-lg font-semibold text-neutral-900 mb-4">Professional Bio</h4>
          <textarea
            {...register('bio')}
            disabled={!isEditing}
            rows={4}
            placeholder="Tell us about your professional background and experience..."
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-none ${
              !isEditing ? 'bg-neutral-50 cursor-not-allowed' : 'hover:border-neutral-400'
            } ${errors.bio ? 'border-red-300 bg-red-50' : 'border-neutral-300'}`}
          />
          {errors.bio && (
            <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.bio.message}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end space-x-4 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-neutral-700 bg-white border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default UserProfile;
