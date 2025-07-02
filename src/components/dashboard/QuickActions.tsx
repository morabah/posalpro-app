/**
 * PosalPro MVP2 - Quick Actions Component
 * Provides quick access to common dashboard actions
 * Component Traceability Matrix: US-2.2, US-4.1, H9, H10
 */

'use client';

import { Card } from '@/components/ui/Card';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  BoltIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { memo } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-4.1'],
  acceptanceCriteria: ['AC-2.2.1', 'AC-4.1.1'],
  methods: ['trackQuickAction()', 'navigateToAction()'],
  hypotheses: ['H9', 'H10'],
  testCases: ['TC-H9-001', 'TC-H10-001'],
};

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo';
  category: 'create' | 'manage' | 'analyze' | 'configure';
}

const QuickActions = memo(() => {
  const analytics = useAnalytics();

  const quickActions: QuickAction[] = [
    {
      id: 'create-proposal',
      title: 'Create Proposal',
      description: 'Start a new proposal with guided workflow',
      href: '/proposals/create',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      color: 'blue',
      category: 'create',
    },
    {
      id: 'add-customer',
      title: 'Add Customer',
      description: 'Register a new customer profile',
      href: '/customers/create',
      icon: <UsersIcon className="h-6 w-6" />,
      color: 'green',
      category: 'create',
    },
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'Add new product to catalog',
      href: '/products/create',
      icon: <CubeIcon className="h-6 w-6" />,
      color: 'purple',
      category: 'create',
    },
    {
      id: 'search-content',
      title: 'Search Content',
      description: 'Find content and templates',
      href: '/content',
      icon: <MagnifyingGlassIcon className="h-6 w-6" />,
      color: 'yellow',
      category: 'manage',
    },
    {
      id: 'view-analytics',
      title: 'Analytics',
      description: 'View performance metrics',
      href: '/analytics',
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'indigo',
      category: 'analyze',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure system preferences',
      href: '/settings',
      icon: <Cog6ToothIcon className="h-6 w-6" />,
      color: 'red',
      category: 'configure',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
      green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
      purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
      red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const handleActionClick = (action: QuickAction) => {
    analytics.track('quick_action_clicked', {
      component: 'QuickActions',
      actionId: action.id,
      actionTitle: action.title,
      category: action.category,
      userStories: COMPONENT_MAPPING.userStories,
      hypotheses: COMPONENT_MAPPING.hypotheses,
      timestamp: Date.now(),
    });
  };

  const groupedActions = quickActions.reduce(
    (groups, action) => {
      const category = action.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(action);
      return groups;
    },
    {} as Record<string, QuickAction[]>
  );

  const categoryTitles = {
    create: 'Create New',
    manage: 'Manage',
    analyze: 'Analyze',
    configure: 'Configure',
  };

  const categoryIcons = {
    create: <PlusIcon className="h-5 w-5" />,
    manage: <BoltIcon className="h-5 w-5" />,
    analyze: <ChartBarIcon className="h-5 w-5" />,
    configure: <Cog6ToothIcon className="h-5 w-5" />,
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <BoltIcon className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-6">
        {Object.entries(groupedActions).map(([category, actions]) => (
          <div key={category}>
            <div className="flex items-center space-x-2 mb-3">
              <div className="text-gray-500">
                {categoryIcons[category as keyof typeof categoryIcons]}
              </div>
              <h4 className="text-sm font-medium text-gray-700">
                {categoryTitles[category as keyof typeof categoryTitles]}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {actions.map(action => (
                <Link
                  key={action.id}
                  href={action.href}
                  onClick={() => handleActionClick(action)}
                  className="block"
                >
                  <div
                    className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${getColorClasses(
                      action.color
                    )}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">{action.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium truncate">{action.title}</h5>
                        <p className="text-xs opacity-80 mt-1 line-clamp-2">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">23</div>
            <div className="text-xs text-gray-600">Active Tasks</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">89%</div>
            <div className="text-xs text-gray-600">Completion Rate</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">4.2s</div>
            <div className="text-xs text-gray-600">Avg Response</div>
          </div>
        </div>
      </div>
    </Card>
  );
});
QuickActions.displayName = 'QuickActions';

export default QuickActions;


