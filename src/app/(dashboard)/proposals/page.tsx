/**
 * PosalPro MVP2 - Proposals Main Page
 * Central hub for proposal management and overview
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { DocumentTextIcon, PlusIcon, FolderOpenIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2'],
  acceptanceCriteria: ['AC-3.1.1', 'AC-3.2.1'],
  methods: ['navigateToProposalSection()', 'trackProposalActions()'],
  hypotheses: ['H3', 'H5'],
  testCases: ['TC-H3-001', 'TC-H5-001'],
};

export default function ProposalsPage() {
  const router = useRouter();
  const [sessionStartTime] = useState(Date.now());

  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Proposals Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
        component: 'ProposalsPage',
        userStory: 'US-3.1',
        hypothesis: 'H3',
      });
    },
    [sessionStartTime]
  );

  const quickActions = [
    {
      id: 'create-proposal',
      title: 'Create New Proposal',
      description: 'Start a new proposal from scratch or template',
      icon: PlusIcon,
      href: '/proposals/create',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'manage-proposals',
      title: 'Manage Proposals',
      description: 'View and edit existing proposals',
      icon: FolderOpenIcon,
      href: '/proposals/manage',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'approve-proposals',
      title: 'Approval Queue',
      description: 'Review proposals pending approval',
      icon: ClockIcon,
      href: '/proposals/approve',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  const handleQuickAction = useCallback(
    (action: any) => {
      trackAction('quick_action_clicked', {
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
            <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
            <p className="text-gray-600 mt-1">
              Manage your proposal lifecycle from creation to approval
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map(action => {
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
                  onClick={() => handleQuickAction(action)}
                  className={`${action.color} text-white w-full`}
                >
                  Access {action.title}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Overview Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Proposal Overview</h3>
            <DocumentTextIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-blue-700">Active Proposals</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">5</div>
              <div className="text-sm text-orange-700">Pending Approval</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">87%</div>
              <div className="text-sm text-green-700">Success Rate</div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Enhanced proposal management features are coming soon!
            </p>
            <p className="text-sm text-gray-500">
              Full proposal listing, advanced filtering, and analytics dashboard will be available
              in the next release.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
