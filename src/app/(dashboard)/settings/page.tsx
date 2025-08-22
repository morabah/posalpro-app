/**
 * PosalPro MVP2 - Settings Page
 * Application settings and preferences with authentication integration
 * Based on wireframe specifications and CORE_REQUIREMENTS.md compliance
 * Component Traceability Matrix: US-2.3, US-4.1, H4
 */

'use client';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/components/providers/AuthProvider';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useTierSettings } from '@/hooks/useTierSettings';
import { HomeIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  SettingsPage: {
    userStories: ['US-4.1', 'US-4.3'],
    acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2', 'AC-4.3.1'],
    methods: ['loadUserPreferences()', 'handleTierSelect()'],
    hypotheses: ['H7'],
    testCases: ['TC-H7-001', 'TC-H7-002'],
  },
};

// Interfaces
interface UserPreferences {
  applicationTier?: 'basic' | 'advanced' | 'enterprise';
  dashboardLayout?: {
    applicationTier?: 'basic' | 'advanced' | 'enterprise';
  };
}

interface PreferencesResponse {
  success: boolean;
  data?: UserPreferences;
  message?: string;
}

// Tier definitions
const tiers = [
  {
    id: 'basic' as const,
    name: 'Basic',
    description: 'Essential features for small teams',
    features: ['Core proposal management', 'Basic analytics', 'Standard templates'],
  },
  {
    id: 'advanced' as const,
    name: 'Advanced',
    description: 'Enhanced features for growing organizations',
    features: ['Advanced analytics', 'Custom workflows', 'Team collaboration', 'Priority support'],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    description: 'Full-featured solution for large enterprises',
    features: [
      'AI-powered insights',
      'Advanced integrations',
      'Custom branding',
      'Dedicated support',
      'Advanced security',
    ],
  },
];

// Loading skeleton component
function SettingsPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>

      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6 animate-pulse"></div>

          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
                <div className="space-y-1">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-2 bg-gray-200 rounded w-full animate-pulse"></div>
                  ))}
                </div>
                <div className="h-8 bg-gray-200 rounded w-full mt-4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Main component (client-side only)
function SettingsPageComponent() {
  const [currentTier, setCurrentTier] = useState<'basic' | 'advanced' | 'enterprise'>('basic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { updateTier } = useTierSettings();

  // Load user preferences with authentication check
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        // Wait for auth to resolve before proceeding
        if (authLoading) {
          setLoading(true);
          return;
        }

        // If not authenticated, show empty state
        if (!isAuthenticated) {
          setCurrentTier('basic');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        analytics('fetch_user_preferences_start', {}, 'low');

        const response = (await apiClient.get('/api/user/preferences')) as PreferencesResponse;

        if (response.success && response.data?.applicationTier) {
          setCurrentTier(response.data.applicationTier);
        }

        analytics('fetch_user_preferences_success', {}, 'low');
      } catch (err) {
        handleAsyncError(err as Error, 'Failed to load user preferences');
        setError('Failed to load user preferences');
        analytics('fetch_user_preferences_error', { error: (err as Error).message }, 'high');
      } finally {
        setLoading(false);
      }
    };

    loadUserPreferences();
  }, [apiClient, handleAsyncError, analytics, isAuthenticated, authLoading]);

  const handleTierSelect = async (tier: 'basic' | 'advanced' | 'enterprise') => {
    try {
      setIsUpdating(true);
      setError(null);
      analytics('tier_selection_changed', { newTier: tier, oldTier: currentTier }, 'medium');

      // Update and broadcast via standardized hook (single PUT + event)
      await updateTier(tier);

      setCurrentTier(tier); // Update local state after successful API call

      // Dispatch custom event for real-time sidebar updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('posalpro:tier-updated', {
            detail: { tier },
          })
        );
      }
    } catch (error) {
      handleAsyncError(error as Error, 'Failed to update tier setting');
      setError('Failed to update tier setting');
    } finally {
      setIsUpdating(false);
    }
  };

  // Always render the same structure to prevent hydration mismatches
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: 'Home', href: '/dashboard', icon: HomeIcon },
          { label: 'Settings', href: '/settings' },
        ]}
      />

      {/* Always render the same header structure */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your application preferences and account settings
        </p>
        {isAuthenticated && user && (
          <p className="text-sm text-gray-500 mt-2">
            Signed in as: <span className="font-medium">{user.email}</span>
          </p>
        )}
      </div>

      {/* Always render the same content structure - server and client must match */}
      <div className="space-y-6">
        {/* Application Tier Selection */}
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Application Tier Selection</h2>
          <p className="text-sm text-gray-600 mb-6">
            Choose your application tier to customize the sidebar navigation and available features
          </p>

          {/* Show loading skeleton until client confirms authentication */}
          {authLoading || loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
                  <div className="space-y-1">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="h-2 bg-gray-200 rounded w-full animate-pulse"></div>
                    ))}
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-full mt-4 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Show authentication error if not authenticated after mount */}
              {!isAuthenticated && (
                <div className="text-center mb-8">
                  <div className="text-red-600 text-6xl mb-4">🚫</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                  <p className="text-gray-600">You need to be signed in to access settings.</p>
                </div>
              )}

              {/* Show error if any */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Only show tier selection if authenticated */}
              {isAuthenticated && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    {tiers.map(tier => {
                      const isSelected = tier.id === currentTier;
                      const isDisabled = isUpdating;

                      return (
                        <Card
                          key={tier.id}
                          variant={isSelected ? 'elevated' : 'outlined'}
                          className={`p-4 cursor-pointer transition-all duration-200 ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => !isDisabled && handleTierSelect(tier.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3
                              className={`font-medium capitalize ${
                                isSelected ? 'text-blue-600' : 'text-gray-900'
                              }`}
                            >
                              {tier.name}
                            </h3>
                            {isSelected && (
                              <Badge variant="success" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{tier.description}</p>

                          <div className="mb-4">
                            <ul className="text-xs text-gray-500 space-y-1">
                              {tier.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <svg
                                    className="w-3 h-3 mr-1 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            variant={isSelected ? 'primary' : 'secondary'}
                            size="sm"
                            disabled={isDisabled}
                            className="w-full"
                          >
                            {isUpdating && isSelected
                              ? 'Updating...'
                              : isSelected
                                ? 'Selected'
                                : 'Select'}
                          </Button>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Current Tier: <span className="capitalize text-blue-600">{currentTier}</span>
                    </h4>
                    <p className="text-xs text-gray-600">
                      This tier controls which sidebar sections are visible in your navigation.
                      Changes take effect immediately.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </Card>

        {/* Profile Settings */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
                <p className="text-sm text-gray-600">
                  Manage your profile information and preferences
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Configure
            </Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5zM4.868 20.354A3 3 0 007 21h8a3 3 0 01-3-3V5a3 3 0 01-3-3H7a3 3 0 00-3 3v13.354z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-600">Configure email and in-app notifications</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Configure
            </Button>
          </div>
        </Card>

        {/* Security & Privacy */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Security & Privacy</h2>
                <p className="text-sm text-gray-600">
                  Manage password, security settings, and privacy
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Configure
            </Button>
          </div>
        </Card>

        {/* System Preferences */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">System Preferences</h2>
                <p className="text-sm text-gray-600">
                  Application appearance and behavior settings
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Configure
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Client-side wrapper with mounted state
function SettingsPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <SettingsPageSkeleton />;
  }

  return <SettingsPageComponent />;
}

// Export the client-side only component
export default SettingsPageClient;
