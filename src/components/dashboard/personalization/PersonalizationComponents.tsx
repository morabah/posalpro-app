/**
 * Personalization Components
 * User customization and personalization features
 */

import { memo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Cog6ToothIcon, UserIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { UserPreferences } from '@/types/dashboard';

// Customization Provider Context
export const CustomizationProvider = memo(
  ({ children }: { children: React.ReactNode }) => {
    const [preferences, setPreferences] = useState<UserPreferences>({
      theme: 'light',
      layout: 'default',
      defaultTimeframe: '3M',
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        fontSize: 'normal',
      },
      dashboard: {
        showRevenueChart: true,
        showTeamPerformance: true,
        showPipelineHealth: true,
        showAIInsights: true,
        widgetOrder: ['summary', 'revenue', 'team', 'pipeline', 'ai'],
      },
    });

    useEffect(() => {
      // Load preferences from localStorage
      const saved = localStorage.getItem('user-preferences');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.warn('Failed to load user preferences:', error);
        }
      }
    }, []);

    const updatePreferences = (updates: Partial<UserPreferences>) => {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      localStorage.setItem('user-preferences', JSON.stringify(newPreferences));
    };

    return (
      <div className={`theme-${preferences.theme} layout-${preferences.layout}`}>
        {children}
      </div>
    );
  }
);

CustomizationProvider.displayName = 'CustomizationProvider';

// Personalization Panel
export const PersonalizationPanel = memo(
  ({
    preferences,
    onPreferencesChange,
    isOpen,
    onClose,
  }: {
    preferences: UserPreferences;
    onPreferencesChange: (prefs: Partial<UserPreferences>) => void;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Personalize Your Dashboard</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close personalization panel"
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Theme Settings */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <SwatchIcon className="h-5 w-5 mr-2" />
                Theme & Appearance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={preferences.theme}
                    onChange={e =>
                      onPreferencesChange({ theme: e.target.value as 'light' | 'dark' })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layout
                  </label>
                  <select
                    value={preferences.layout}
                    onChange={e =>
                      onPreferencesChange({ layout: e.target.value as 'default' | 'compact' | 'detailed' })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Default Settings */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Default Settings
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Timeframe
                </label>
                <select
                  value={preferences.defaultTimeframe}
                  onChange={e =>
                    onPreferencesChange({ defaultTimeframe: e.target.value as '3M' | '6M' | '1Y' })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="3M">Last 3 Months</option>
                  <option value="6M">Last 6 Months</option>
                  <option value="1Y">Last Year</option>
                </select>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-lg font-medium mb-3">Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.email}
                    onChange={e =>
                      onPreferencesChange({
                        notifications: {
                          ...preferences.notifications,
                          email: e.target.checked,
                        },
                      })
                    }
                    className="mr-3"
                  />
                  <span className="text-sm">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.push}
                    onChange={e =>
                      onPreferencesChange({
                        notifications: {
                          ...preferences.notifications,
                          push: e.target.checked,
                        },
                      })
                    }
                    className="mr-3"
                  />
                  <span className="text-sm">Push notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.sms}
                    onChange={e =>
                      onPreferencesChange({
                        notifications: {
                          ...preferences.notifications,
                          sms: e.target.checked,
                        },
                      })
                    }
                    className="mr-3"
                  />
                  <span className="text-sm">SMS notifications</span>
                </label>
              </div>
            </div>

            {/* Accessibility */}
            <div>
              <h3 className="text-lg font-medium mb-3">Accessibility</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.highContrast}
                    onChange={e =>
                      onPreferencesChange({
                        accessibility: {
                          ...preferences.accessibility,
                          highContrast: e.target.checked,
                        },
                      })
                    }
                    className="mr-3"
                  />
                  <span className="text-sm">High contrast mode</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.reducedMotion}
                    onChange={e =>
                      onPreferencesChange({
                        accessibility: {
                          ...preferences.accessibility,
                          reducedMotion: e.target.checked,
                        },
                      })
                    }
                    className="mr-3"
                  />
                  <span className="text-sm">Reduced motion</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <select
                    value={preferences.accessibility.fontSize}
                    onChange={e =>
                      onPreferencesChange({
                        accessibility: {
                          ...preferences.accessibility,
                          fontSize: e.target.value as 'normal' | 'large' | 'x-large',
                        },
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="normal">Normal</option>
                    <option value="large">Large</option>
                    <option value="x-large">Extra Large</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    );
  }
);

PersonalizationPanel.displayName = 'PersonalizationPanel';

// Widget Customization Component
export const WidgetCustomization = memo(
  ({
    preferences,
    onPreferencesChange,
  }: {
    preferences: UserPreferences;
    onPreferencesChange: (prefs: Partial<UserPreferences>) => void;
  }) => {
    const widgets = [
      { key: 'showRevenueChart', label: 'Revenue Chart', description: 'Interactive revenue analytics' },
      { key: 'showTeamPerformance', label: 'Team Performance', description: 'Team member rankings' },
      { key: 'showPipelineHealth', label: 'Pipeline Health', description: 'Pipeline stage monitoring' },
      { key: 'showAIInsights', label: 'AI Insights', description: 'AI-powered recommendations' },
    ];

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Dashboard Widgets</h3>
        <div className="space-y-3">
          {widgets.map(widget => (
            <label key={widget.key} className="flex items-start">
              <input
                type="checkbox"
                checked={preferences.dashboard[widget.key as keyof typeof preferences.dashboard] as boolean}
                onChange={e =>
                  onPreferencesChange({
                    dashboard: {
                      ...preferences.dashboard,
                      [widget.key]: e.target.checked,
                    },
                  })
                }
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium">{widget.label}</div>
                <div className="text-sm text-gray-600">{widget.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>
    );
  }
);

WidgetCustomization.displayName = 'WidgetCustomization';

// Personalized Welcome Component
export const PersonalizedWelcome = memo(
  ({
    userName,
    preferences,
    lastVisit,
  }: {
    userName: string;
    preferences: UserPreferences;
    lastVisit?: Date;
  }) => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    };

    const getTimeframeLabel = (timeframe: string) => {
      switch (timeframe) {
        case '3M': return 'last 3 months';
        case '6M': return 'last 6 months';
        case '1Y': return 'last year';
        default: return 'recent period';
      }
    };

    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {userName}!
            </h2>
            <p className="text-gray-600 mt-1">
              Here's your dashboard overview for the {getTimeframeLabel(preferences.defaultTimeframe)}.
            </p>
            {lastVisit && (
              <p className="text-sm text-gray-500 mt-2">
                Last visit: {lastVisit.toLocaleDateString()} at {lastVisit.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Your preferred view</div>
            <div className="font-medium text-gray-900 capitalize">{preferences.layout}</div>
          </div>
        </div>
      </Card>
    );
  }
);

PersonalizedWelcome.displayName = 'PersonalizedWelcome';
