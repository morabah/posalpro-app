'use client';

/**
 * PosalPro MVP2 - Notifications Tab Component
 * Based on USER_PROFILE_SCREEN.md wireframe specifications
 * Notification preferences and communication settings
 */

import { useUserProfileAnalytics } from '@/hooks/auth/useUserProfileAnalytics';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Bell,
  Check,
  Clock,
  Loader2,
  Mail,
  RotateCcw,
  Save,
  Smartphone,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Validation schema for notification preferences
const notificationsSchema = z.object({
  // Email Notifications
  emailProposalStatus: z.boolean(),
  emailApprovalRequests: z.boolean(),
  emailTaskAssignments: z.boolean(),
  emailSystemAnnouncements: z.boolean(),
  emailTeamUpdates: z.boolean(),

  // In-App Notifications
  inAppProposalStatus: z.boolean(),
  inAppApprovalRequests: z.boolean(),
  inAppTaskAssignments: z.boolean(),
  inAppSystemAnnouncements: z.boolean(),
  inAppTeamUpdates: z.boolean(),

  // Mobile Push Notifications
  pushApprovalRequests: z.boolean(),
  pushCriticalDeadlines: z.boolean(),
  pushSystemAnnouncements: z.boolean(),
  pushTeamUpdates: z.boolean(),

  // Digest Preferences
  dailySummaryEmail: z.boolean(),
  weeklyActivityReport: z.boolean(),

  // Quiet Hours
  quietHoursEnabled: z.boolean(),
  quietHoursFrom: z.string(),
  quietHoursTo: z.string(),
});

type NotificationsFormData = z.infer<typeof notificationsSchema>;

const TIME_OPTIONS = [
  '12:00 AM',
  '1:00 AM',
  '2:00 AM',
  '3:00 AM',
  '4:00 AM',
  '5:00 AM',
  '6:00 AM',
  '7:00 AM',
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM',
  '9:00 PM',
  '10:00 PM',
  '11:00 PM',
];

interface NotificationsTabProps {
  analytics: ReturnType<typeof useUserProfileAnalytics>;
  user: any;
}

export function NotificationsTab({ analytics, user }: NotificationsTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentNotifications, setCurrentNotifications] = useState<
    Array<{
      id: string;
      type: string;
      message: string;
      time: string;
      priority: 'high' | 'medium' | 'low';
    }>
  >([
    {
      id: '1',
      type: 'approval',
      message: '3 pending approvals',
      time: '5 minutes ago',
      priority: 'high',
    },
    {
      id: '2',
      type: 'task',
      message: '2 new task assignments',
      time: '1 hour ago',
      priority: 'medium',
    },
    {
      id: '3',
      type: 'deadline',
      message: '1 approaching deadline',
      time: '2 hours ago',
      priority: 'high',
    },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<NotificationsFormData>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      // Email Notifications
      emailProposalStatus: true,
      emailApprovalRequests: true,
      emailTaskAssignments: true,
      emailSystemAnnouncements: false,
      emailTeamUpdates: true,

      // In-App Notifications
      inAppProposalStatus: true,
      inAppApprovalRequests: true,
      inAppTaskAssignments: true,
      inAppSystemAnnouncements: true,
      inAppTeamUpdates: true,

      // Mobile Push Notifications
      pushApprovalRequests: true,
      pushCriticalDeadlines: true,
      pushSystemAnnouncements: false,
      pushTeamUpdates: false,

      // Digest Preferences
      dailySummaryEmail: true,
      weeklyActivityReport: false,

      // Quiet Hours
      quietHoursEnabled: true,
      quietHoursFrom: '8:00 PM',
      quietHoursTo: '7:00 AM',
    },
  });

  // Handle form submission
  const onSubmit = async (data: NotificationsFormData) => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/profile/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update notification preferences');
      }

      const updateTime = Date.now() - startTime;

      // Track notification preferences
      analytics.trackNotificationPreferences(
        {
          email:
            data.emailProposalStatus || data.emailApprovalRequests || data.emailTaskAssignments,
          inApp:
            data.inAppProposalStatus || data.inAppApprovalRequests || data.inAppTaskAssignments,
          push: data.pushApprovalRequests || data.pushCriticalDeadlines,
          digest: data.dailySummaryEmail || data.weeklyActivityReport,
        },
        data.quietHoursEnabled
          ? {
              from: data.quietHoursFrom,
              to: data.quietHoursTo,
            }
          : undefined
      );

      // Track preference update
      analytics.trackProfileUpdate({
        section: 'notifications',
        field: 'bulk_update',
        newValue: JSON.stringify(data),
        updateTime,
      });

      setSuccessMessage('Notification preferences updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset to defaults
  const handleReset = () => {
    if (confirm('Reset all notification preferences to default values?')) {
      reset();
      setSuccessMessage('Notification preferences reset to defaults');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Handle clearing all notifications
  const handleClearAll = () => {
    setCurrentNotifications([]);
  };

  // Handle marking all notifications as read
  const handleMarkAllRead = () => {
    setCurrentNotifications([]);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Notification Settings</h2>
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
        {/* Email Notifications */}
        <div>
          <h3 className="text-md font-medium text-neutral-900 mb-4 flex items-center space-x-2">
            <Mail className="w-5 h-5 text-neutral-500" />
            <span>Email Notifications</span>
          </h3>
          <div className="space-y-3 pl-7">
            <label className="flex items-center space-x-3">
              <input
                {...register('emailProposalStatus')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Proposal status changes</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('emailApprovalRequests')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Approval requests</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('emailTaskAssignments')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Task assignments</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('emailSystemAnnouncements')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">System announcements</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('emailTeamUpdates')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Team updates</span>
            </label>
          </div>
        </div>

        {/* In-App Notifications */}
        <div>
          <h3 className="text-md font-medium text-neutral-900 mb-4 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-neutral-500" />
            <span>In-App Notifications</span>
          </h3>
          <div className="space-y-3 pl-7">
            <label className="flex items-center space-x-3">
              <input
                {...register('inAppProposalStatus')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Proposal status changes</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('inAppApprovalRequests')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Approval requests</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('inAppTaskAssignments')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Task assignments</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('inAppSystemAnnouncements')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">System announcements</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('inAppTeamUpdates')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Team updates</span>
            </label>
          </div>
        </div>

        {/* Mobile Push Notifications */}
        <div>
          <h3 className="text-md font-medium text-neutral-900 mb-4 flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-neutral-500" />
            <span>Mobile Push Notifications</span>
          </h3>
          <div className="space-y-3 pl-7">
            <label className="flex items-center space-x-3">
              <input
                {...register('pushApprovalRequests')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Approval requests</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('pushCriticalDeadlines')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Critical deadlines</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('pushSystemAnnouncements')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">System announcements</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('pushTeamUpdates')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Team updates</span>
            </label>
          </div>
        </div>

        {/* Digest Preferences */}
        <div>
          <h3 className="text-md font-medium text-neutral-900 mb-4">Digest Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                {...register('dailySummaryEmail')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Daily summary email</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                {...register('weeklyActivityReport')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Weekly activity report</span>
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-md font-medium text-neutral-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-neutral-500" />
            <span>Quiet Hours</span>
          </h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                {...register('quietHoursEnabled')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-700">Enable quiet hours</span>
            </label>

            {watch('quietHoursEnabled') && (
              <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">From</label>
                  <select
                    {...register('quietHoursFrom')}
                    className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">To</label>
                  <select
                    {...register('quietHoursTo')}
                    className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
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
            <span>Reset</span>
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
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Current Notifications */}
      <div className="mt-8 pt-8 border-t">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Current Notifications</h3>
        <div className="bg-neutral-50 rounded-lg p-4">
          {currentNotifications.length > 0 ? (
            <>
              <div className="space-y-3">
                {currentNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className="flex items-center space-x-3 p-3 bg-white rounded-md"
                  >
                    <Bell
                      className={`w-4 h-4 ${
                        notification.priority === 'high'
                          ? 'text-red-500'
                          : notification.priority === 'medium'
                          ? 'text-yellow-500'
                          : 'text-neutral-500'
                      }`}
                    />
                    <span className="text-sm text-neutral-700 flex-1">{notification.message}</span>
                    <span className="text-xs text-neutral-500">{notification.time}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end space-x-4 mt-4 pt-4 border-t border-neutral-200">
                <button
                  onClick={handleClearAll}
                  className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 hover:text-blue-900 transition-colors"
                >
                  Mark All Read
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <VolumeX className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-neutral-500">No notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
