'use client';

interface StepNotificationsProps {
  register: any;
  errors: any;
  setValue: any;
  watch: any;
}

export default function StepNotifications({ register }: StepNotificationsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900">Default Notification Settings</h3>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">Email Notifications:</label>
        <div className="space-y-3">
          {['proposals', 'approvals', 'tasks', 'announcements', 'teams'].map(value => (
            <label key={value} className="flex items-center">
              <input
                {...register('emailNotifications')}
                type="checkbox"
                value={value}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="ml-3 text-sm text-neutral-700">{value}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">Mobile Push Notifications:</label>
        <div className="space-y-3">
          {['approvals', 'deadlines', 'announcements', 'teams'].map(value => (
            <label key={value} className="flex items-center">
              <input
                {...register('mobileNotifications')}
                type="checkbox"
                value={value}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="ml-3 text-sm text-neutral-700">{value}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">Default Digest Preferences:</label>
        <div className="space-y-3">
          {['daily', 'weekly'].map(value => (
            <label key={value} className="flex items-center">
              <input
                {...register('digestPreferences')}
                type="checkbox"
                value={value}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="ml-3 text-sm text-neutral-700">{value}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
