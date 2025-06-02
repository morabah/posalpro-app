/**
 * PosalPro MVP2 - Settings Page
 * Application settings and preferences
 * Based on wireframe specifications
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { BellIcon, CogIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const settingsCategories = [
    {
      id: 'profile',
      name: 'Profile Settings',
      icon: UserIcon,
      description: 'Manage your profile information and preferences',
      href: '/profile',
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: BellIcon,
      description: 'Configure email and in-app notifications',
      href: '/settings/notifications',
    },
    {
      id: 'security',
      name: 'Security & Privacy',
      icon: ShieldCheckIcon,
      description: 'Manage password, security settings, and privacy',
      href: '/settings/security',
    },
    {
      id: 'system',
      name: 'System Preferences',
      icon: CogIcon,
      description: 'Application appearance and behavior settings',
      href: '/settings/system',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs className="mb-6" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your application preferences and account settings
        </p>
      </div>

      <div className="space-y-6">
        {settingsCategories.map(category => {
          const IconComponent = category.icon;
          return (
            <Card key={category.id}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{category.name}</h2>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Quick Settings */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Receive email updates for important events
                  </p>
                </div>
                <Button
                  variant={notifications ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setNotifications(!notifications)}
                >
                  {notifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Dark Mode</h3>
                  <p className="text-sm text-gray-600">Switch to dark theme (coming soon)</p>
                </div>
                <Button
                  variant={darkMode ? 'primary' : 'secondary'}
                  size="sm"
                  disabled
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
