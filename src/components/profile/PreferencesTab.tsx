'use client';

/**
 * PosalPro MVP2 - Preferences Tab Component
 * Based on USER_PROFILE_SCREEN.md wireframe specifications
 * Application preferences and accessibility settings
 */

import { useUserProfileAnalytics } from '@/hooks/auth/useUserProfileAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Check,
  Eye,
  Loader2,
  Monitor,
  Moon,
  MousePointer,
  RotateCcw,
  Save,
  Sun,
  Type,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AuthUser } from '@/components/providers/AuthProvider';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Validation schema for preferences
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  defaultView: z.enum(['card', 'table']),
  startingScreen: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  language: z.string(),
  highContrast: z.boolean(),
  largeText: z.boolean(),
  screenReaderOptimized: z.boolean(),
  reducedMotion: z.boolean(),
  keyboardNavigation: z.boolean(),
  showQuickActions: z.boolean(),
  showRecentProposals: z.boolean(),
  showTeamActivity: z.boolean(),
  showSystemNotifications: z.boolean(),
  showKPIs: z.boolean(),
  aiAssistanceLevel: z.enum(['minimal', 'balanced', 'full']),
  enableContentSuggestions: z.boolean(),
  enableWorkflowAssistance: z.boolean(),
  enableAutomatedDrafts: z.boolean(),
  enableValidationHelp: z.boolean(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

const STARTING_SCREENS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'proposals', label: 'Proposals' },
  { value: 'content-search', label: 'Content Search' },
  { value: 'coordination-hub', label: 'Coordination Hub' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const TIME_FORMATS = [
  { value: '12-hour', label: '12-hour (AM/PM)' },
  { value: '24-hour', label: '24-hour' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

interface PreferencesTabProps {
  analytics: ReturnType<typeof useUserProfileAnalytics>;
  user: AuthUser | null;
}

export function PreferencesTab({ analytics, user }: PreferencesTabProps) {
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: 'system',
      defaultView: 'card',
      startingScreen: 'dashboard',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour',
      language: 'en',
      highContrast: false,
      largeText: false,
      screenReaderOptimized: false,
      reducedMotion: false,
      keyboardNavigation: false,
      showQuickActions: true,
      showRecentProposals: true,
      showTeamActivity: true,
      showSystemNotifications: false,
      showKPIs: true,
      aiAssistanceLevel: 'balanced',
      enableContentSuggestions: true,
      enableWorkflowAssistance: true,
      enableAutomatedDrafts: false,
      enableValidationHelp: true,
    },
  });

  // Watch theme changes to apply immediately
  const currentTheme = watch('theme');
  const highContrast = watch('highContrast');
  const largeText = watch('largeText');
  const reducedMotion = watch('reducedMotion');

  // Apply accessibility settings immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Apply theme
      const root = window.document.documentElement;

      if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else if (currentTheme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }

      // Apply accessibility settings
      root.classList.toggle('high-contrast', highContrast);
      root.classList.toggle('large-text', largeText);
      root.classList.toggle('reduced-motion', reducedMotion);
    }
  }, [currentTheme, highContrast, largeText, reducedMotion]);

  // Handle form submission
  const onSubmit = async (data: PreferencesFormData) => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Use centralized API client instead of direct fetch
      interface PreferencesApiResponse {
        success: boolean;
        data?: PreferencesFormData;
        error?: string;
      }
      const response = await apiClient.put<PreferencesApiResponse>('/api/profile/preferences', data);

      if (!response.success) {
        // Log error but let the catch block handle it
        console.warn('[PreferencesTab] Preferences update failed:', response.error || 'Failed to update preferences');
        throw new Error(response.error || 'Failed to update preferences');
      }

      const updateTime = Date.now() - startTime;

      // Track accessibility configurations
      Object.entries(data).forEach(([key, value]) => {
        if (
          [
            'highContrast',
            'largeText',
            'screenReaderOptimized',
            'reducedMotion',
            'keyboardNavigation',
          ].includes(key)
        ) {
          analytics.trackAccessibilityConfiguration({
            feature: key,
            enabled: value as boolean,
            assistiveTech:
              key === 'screenReaderOptimized' ? ['NVDA', 'JAWS', 'VoiceOver'] : undefined,
          });
        }
      });

      // Track preference updates
      analytics.trackProfileUpdate({
        section: 'preferences',
        field: 'bulk_update',
        newValue: JSON.stringify(data),
        updateTime,
      });

      setSuccessMessage('Preferences updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      // Use standardized error handling
      const standardError = errorHandlingService.processError(
        error,
        'Failed to update user preferences',
        ErrorCodes.VALIDATION.OPERATION_FAILED,
        {
          component: 'PreferencesTab',
          operation: 'updatePreferences',
          userId: user?.id,
          preferencesCount: Object.keys(data).length,
        }
      );

      const errorMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset to defaults
  const handleReset = () => {
    if (confirm('Reset all preferences to default values?')) {
      reset();
      setSuccessMessage('Preferences reset to defaults');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Application Preferences</h2>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Update Failed</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* General Preferences */}
        <div>
          <h3 className="text-md font-medium text-neutral-900 mb-4">General Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">Theme</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    {...register('theme')}
                    type="radio"
                    value="light"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                  />
                  <Sun className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-700">Light</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    {...register('theme')}
                    type="radio"
                    value="dark"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                  />
                  <Moon className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-700">Dark</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    {...register('theme')}
                    type="radio"
                    value="system"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                  />
                  <Monitor className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-700">System</span>
                </label>
              </div>
            </div>

            {/* Default View */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Default View
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    {...register('defaultView')}
                    type="radio"
                    value="card"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700">Card View</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    {...register('defaultView')}
                    type="radio"
                    value="table"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700">Table View</span>
                </label>
              </div>
            </div>

            {/* Starting Screen */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Starting Screen
              </label>
              <select
                {...register('startingScreen')}
                className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STARTING_SCREENS.map(screen => (
                  <option key={screen.value} value={screen.value}>
                    {screen.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Date Format</label>
              <select
                {...register('dateFormat')}
                className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DATE_FORMATS.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Format */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Time Format</label>
              <select
                {...register('timeFormat')}
                className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIME_FORMATS.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Language</label>
              <select
                {...register('language')}
                className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div>
          <h3 className="text-md font-medium text-neutral-900 mb-4">Accessibility</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                {...register('highContrast')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <Eye className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-700">High contrast mode</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('largeText')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <Type className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-700">Larger text</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('screenReaderOptimized')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Screen reader optimized</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('reducedMotion')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Reduced motion</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('keyboardNavigation')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <MousePointer className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-700">Keyboard navigation mode</span>
            </label>
          </div>
        </div>

        {/* Dashboard Customization */}
        <div>
          <h3 className="text-md font-medium text-neutral-900 mb-4">Dashboard Customization</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                {...register('showQuickActions')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Show quick actions</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('showRecentProposals')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Show recent proposals</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('showTeamActivity')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Show team activity</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('showSystemNotifications')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Show system notifications</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('showKPIs')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Show KPIs</span>
            </label>
          </div>
        </div>

        {/* AI Preferences */}
        <div>
          <h3 className="text-md font-medium text-neutral-900 mb-4">AI Preferences</h3>
          <div className="space-y-6">
            {/* AI Assistance Level */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                AI Assistance Level
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    {...register('aiAssistanceLevel')}
                    type="radio"
                    value="minimal"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700">Minimal</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    {...register('aiAssistanceLevel')}
                    type="radio"
                    value="balanced"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700">Balanced</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    {...register('aiAssistanceLevel')}
                    type="radio"
                    value="full"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700">Full</span>
                </label>
              </div>
            </div>

            {/* AI Features */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  {...register('enableContentSuggestions')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
                />
                <span className="text-sm text-neutral-700">Enable content suggestions</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  {...register('enableWorkflowAssistance')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
                />
                <span className="text-sm text-neutral-700">Enable workflow assistance</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  {...register('enableAutomatedDrafts')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
                />
                <span className="text-sm text-neutral-700">Enable automated drafts</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  {...register('enableValidationHelp')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
                />
                <span className="text-sm text-neutral-700">Enable validation help</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>

          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
