'use client';

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  department: string;
  office?: string;
  phone?: string;
  primaryRole: string;
  teamAssignments?: string[];
  accessLevel: string;
  additionalRoles?: string[];
  emailNotifications?: string[];
  mobileNotifications?: string[];
  digestPreferences?: string[];
  passwordSetting: 'system' | 'first_login' | 'admin_set';
}

export default function StepConfirmation({ data }: { data: RegistrationFormData }) {
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
