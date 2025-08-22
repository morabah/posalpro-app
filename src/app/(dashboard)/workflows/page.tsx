/**
 * PosalPro MVP2 - Workflows Main Page
 * Central hub for workflow management and automation
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { logDebug } from '@/lib/logger';
import {
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface WorkflowMetadata {
  [key: string]: string | number | boolean | Date;
}

interface WorkflowAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [sessionStartTime] = useState(Date.now());

  useEffect(() => {
    // Track page analytics
    logDebug('Workflows Analytics:', {
      page: 'workflows',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });
  }, []);

  const trackAction = useCallback(
    (action: string, metadata: WorkflowMetadata = {}) => {
      logDebug('Workflows Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
        component: 'WorkflowsPage',
      });
    },
    [sessionStartTime]
  );

  const workflowActions: WorkflowAction[] = [
    {
      id: 'approval',
      title: 'Approval Workflows',
      description: 'Manage approval processes and review cycles',
      icon: ShieldCheckIcon,
      href: '/workflows/approval',
      variant: 'primary',
    },
    {
      id: 'templates',
      title: 'Workflow Templates',
      description: 'Create and manage workflow templates',
      icon: DocumentTextIcon,
      href: '/workflows/templates',
      variant: 'primary',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
            <p className="text-gray-600 mt-1">Manage and automate your proposal workflows</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {workflowActions.map(action => {
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
                  onClick={() => {
                    trackAction(`${action.id}_clicked`);
                    router.push(action.href);
                  }}
                  variant={action.variant}
                  className="w-full"
                >
                  Access {action.title}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="p-8 text-center">
          <AdjustmentsHorizontalIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-4">
            Advanced Workflow Management Coming Soon
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Comprehensive workflow automation, custom process builders, and advanced workflow
            analytics will be available in the next release.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Visual workflow builder</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Automated task assignment</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Performance analytics</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Integration with external systems</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
