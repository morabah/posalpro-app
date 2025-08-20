/**
 * PosalPro MVP2 - SME Tools Main Page
 * Central hub for subject matter expert activities and tools
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-7.1', 'US-7.2'],
  acceptanceCriteria: ['AC-7.1.1', 'AC-7.2.1'],
  methods: ['manageSMEActivities()', 'trackContributions()', 'handleAssignments()'],
  hypotheses: ['H13', 'H14'],
  testCases: ['TC-H13-001', 'TC-H14-001'],
};

interface SMEMetadata {
  [key: string]: string | number | boolean | Date;
}

interface SMEAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

export default function SMEPage() {
  const router = useRouter();
  const [sessionStartTime] = useState(Date.now());

  const trackAction = useCallback(
    (action: string, metadata: SMEMetadata = {}) => {
      console.log('SME Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
        component: 'SMEPage',
        userStory: 'US-7.1',
        hypothesis: 'H13',
      });
    },
    [sessionStartTime]
  );

  const smeActions: SMEAction[] = [
    {
      id: 'contributions',
      title: 'My Contributions',
      description: 'View and manage your contributions to proposals',
      icon: DocumentTextIcon,
      href: '/sme/contributions',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'assignments',
      title: 'Current Assignments',
      description: 'Review your current and pending assignments',
      icon: ClockIcon,
      href: '/sme/assignments',
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  const smeMetrics = [
    {
      id: 'active-assignments',
      title: 'Active Assignments',
      value: '5',
      icon: ClockIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'completed-contributions',
      title: 'Completed This Month',
      value: '12',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'pending-reviews',
      title: 'Pending Reviews',
      value: '3',
      icon: DocumentTextIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'expertise-score',
      title: 'Expertise Score',
      value: '94%',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const recentActivity = [
    {
      action: 'Completed technical review for "Enterprise Security Suite"',
      time: '2 hours ago',
      type: 'success',
    },
    {
      action: 'Assigned to new proposal "Cloud Infrastructure Migration"',
      time: '4 hours ago',
      type: 'info',
    },
    {
      action: 'Submitted expertise input for "Healthcare Solutions"',
      time: '1 day ago',
      type: 'success',
    },
    {
      action: 'Review requested for "Data Analytics Platform"',
      time: '2 days ago',
      type: 'warning',
    },
  ];

  const handleActionClick = useCallback(
    (action: SMEAction) => {
      trackAction('sme_action_clicked', {
        actionId: action.id,
        destination: action.href,
      });
      router.push(action.href);
    },
    [trackAction, router]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SME Tools</h1>
            <p className="text-gray-600 mt-1">
              Manage your expertise contributions and assignments
            </p>
          </div>
        </div>
      </div>

      {/* SME Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {smeMetrics.map(metric => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.id} className={`${metric.bgColor} border-0`}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  </div>
                  <IconComponent className={`w-8 h-8 ${metric.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* SME Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {smeActions.map(action => {
          const IconComponent = action.icon;
          return (
            <Card key={action.id} className="hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <IconComponent className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{action.description}</p>
                <Button
                  onClick={() => handleActionClick(action)}
                  className={`${action.color} text-white w-full`}
                >
                  Access {action.title}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 py-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === 'success'
                      ? 'bg-green-500'
                      : activity.type === 'warning'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                  }`}
                ></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Enhanced SME Tools Coming Soon
              </h4>
              <p className="text-gray-600 mb-4">
                Advanced SME collaboration features, expertise matching, and performance analytics
                will be available in the next release.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">AI-powered expertise matching</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Collaborative review workflows</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Performance analytics dashboard</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Knowledge base integration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
