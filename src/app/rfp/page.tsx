/**
 * PosalPro MVP2 - RFP Main Page
 * Central hub for RFP document management and analysis
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { ArchiveBoxIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function RFPPage() {
  const router = useRouter();
  const [sessionStartTime] = useState(Date.now());

  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('RFP Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
        component: 'RFPPage',
      });
    },
    [sessionStartTime]
  );

  const rfpActions = [
    {
      id: 'parser',
      title: 'RFP Parser',
      description: 'Parse and analyze RFP documents',
      icon: ArchiveBoxIcon,
      href: '/rfp/parser',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'analysis',
      title: 'RFP Analysis',
      description: 'Advanced analysis and insights',
      icon: ChartBarIcon,
      href: '/rfp/analysis',
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RFP Management</h1>
            <p className="text-gray-600 mt-1">Parse, analyze, and manage RFP documents</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {rfpActions.map(action => {
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
                  className={`${action.color} text-white w-full`}
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
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-4">
            Enhanced RFP Management Coming Soon
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Advanced RFP parsing, AI-powered analysis, and automated response generation will be
            available in the next release.
          </p>
        </div>
      </Card>
    </div>
  );
}
