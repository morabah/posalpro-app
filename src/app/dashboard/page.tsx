/**
 * PosalPro MVP2 - Dashboard Page
 * Demo protected route with role-based access
 */

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - PosalPro',
  description: 'Your PosalPro dashboard with role-based content',
};

function DashboardContent() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to PosalPro</h1>
          <p className="text-gray-600 mt-2">Your AI-powered proposal management platform</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors">
                Create New Proposal
              </button>
              <button className="w-full text-left p-3 rounded-md bg-green-50 hover:bg-green-100 transition-colors">
                Review Pending Approvals
              </button>
              <button className="w-full text-left p-3 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors">
                View Analytics Dashboard
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                <p className="text-sm font-medium">Proposal XYZ-123 submitted</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <div className="p-3 border-l-4 border-green-400 bg-green-50">
                <p className="text-sm font-medium">SME review completed</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
              <div className="p-3 border-l-4 border-orange-400 bg-orange-50">
                <p className="text-sm font-medium">Approval pending</p>
                <p className="text-xs text-gray-500">6 hours ago</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Analytics</span>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Services</span>
                <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
