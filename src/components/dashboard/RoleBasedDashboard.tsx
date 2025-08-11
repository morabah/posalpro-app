/**
 * PosalPro MVP2 - Role-Based Dashboard Component
 * Implements different dashboard layouts based on user roles
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Progress } from '@/components/ui/Progress';
import { UserType } from '@/types';
import {
  ChartBarIcon,
  ChevronRightIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface RoleBasedDashboardProps {
  userRole: UserType;
  userName: string;
  dashboardData: {
    assignments?: unknown[];
    contentItems?: unknown[];
  };
  onQuickAction: (action: string, url: string) => void;
}

export function RoleBasedDashboard({
  userRole,
  userName,
  dashboardData,
  onQuickAction,
}: RoleBasedDashboardProps) {
  // SME Dashboard Layout - as per wireframe
  if (userRole === UserType.SME) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SME Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {userName.split(' ')[0]}
          </h1>
          <p className="text-gray-600">
            {(Array.isArray(dashboardData.assignments) ? dashboardData.assignments.length : 0)} assignments •{' '}
            {(Array.isArray(dashboardData.contentItems) ? dashboardData.contentItems.length : 0)} content items
          </p>
        </div>

        {/* SME Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/sme/assignments"
              onClick={() => onQuickAction('start_assignment', '/sme/assignments')}
            >
              <Button className="w-full justify-center" size="lg">
                <PencilIcon className="h-5 w-5 mr-2" />
                Start Assignment
              </Button>
            </Link>
            <Link href="/content/search" onClick={() => onQuickAction('search', '/content/search')}>
              <Button variant="secondary" className="w-full justify-center" size="lg">
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Search
              </Button>
            </Link>
          </div>
        </div>

        {/* SME Assignments Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Assignments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Due This Week */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Due This Week</h3>
                <ClockIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">2</div>
                <p className="text-sm text-gray-600 mb-4">Assignments</p>
                <Progress value={60} variant="warning" className="mb-4" />
                <div className="text-sm text-gray-600">
                  <div className="font-semibold">Technical Review</div>
                  <div>Due: May 15, 2025</div>
                </div>
              </div>
            </Card>

            {/* Status Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Status</h3>
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">85%</div>
                <p className="text-sm text-gray-600 mb-4">Completion Rate</p>
                <Progress value={85} variant="success" className="mb-4" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">3</div>
                    <div className="text-gray-500">Active</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">12</div>
                    <div className="text-gray-500">Completed</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Current Assignments */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current Assignments</h2>
            <Link
              href="/sme/assignments"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <Card>
            <div className="divide-y divide-gray-200">
              <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">Technical Section: RFP</h3>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Due: May 15, 2025</span>
                      <Badge variant="destructive">HIGH</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">Security Analysis: Bid</h3>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Due: May 28, 2025</span>
                      <Badge variant="warning">MEDIUM</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Content */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Content</h2>
          <Card>
            <div className="divide-y divide-gray-200">
              <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Security Documentation</h3>
                    <p className="text-xs text-gray-500">Added: May 10, 2025</p>
                  </div>
                  <Button size="sm" variant="secondary">
                    View
                  </Button>
                </div>
              </div>
              <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Technical Specs Template</h3>
                    <p className="text-xs text-gray-500">Updated: May 8, 2025</p>
                  </div>
                  <Button size="sm" variant="secondary">
                    View
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Default Manager Dashboard (already implemented in the main dashboard page)
  return null;
}
