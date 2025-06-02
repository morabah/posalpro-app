'use client';

/**
 * PosalPro MVP2 - Security Tab Component (Placeholder)
 * Placeholder for Phase 2.1.5 Security implementation
 */

interface SecurityTabProps {
  analytics: any;
  user: any;
}

export function SecurityTab({ analytics, user }: SecurityTabProps) {
  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold text-neutral-900 mb-6">Access & Security</h2>
      <p className="text-neutral-600">Security tab content will be implemented in Phase 2.1.5.</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          Coming soon: Password management, MFA setup, session control, and login history.
        </p>
      </div>
    </div>
  );
}
