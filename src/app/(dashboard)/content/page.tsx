/**
 * PosalPro MVP2 - Content Library Main Page
 * Central hub for content management and library browsing
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  ChartBarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-5.1', 'US-5.2'],
  acceptanceCriteria: ['AC-5.1.1', 'AC-5.2.1'],
  methods: ['browseContentLibrary()', 'searchContent()', 'trackContentUsage()'],
  hypotheses: ['H8', 'H9'],
  testCases: ['TC-H8-001', 'TC-H9-001'],
};

export default function ContentPage() {
  const router = useRouter();
  const [sessionStartTime] = useState(Date.now());

  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Content Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
        component: 'ContentPage',
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });
    },
    [sessionStartTime]
  );

  const contentCategories = [
    {
      id: 'documents',
      title: 'Documents',
      description: 'Text documents, PDFs, and templates',
      icon: DocumentTextIcon,
      count: 1247,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      id: 'images',
      title: 'Images & Media',
      description: 'Photos, graphics, and multimedia files',
      icon: PhotoIcon,
      count: 356,
      color: 'bg-green-50 border-green-200 text-green-700',
    },
    {
      id: 'data',
      title: 'Data & Analytics',
      description: 'Spreadsheets, reports, and datasets',
      icon: ChartBarIcon,
      count: 89,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
    },
  ];

  const recentContent = [
    { name: 'Enterprise Security Template', type: 'Document', lastModified: '2 hours ago' },
    { name: 'Healthcare Solutions Overview', type: 'Document', lastModified: '4 hours ago' },
    { name: 'Product Pricing Matrix', type: 'Data', lastModified: '1 day ago' },
    { name: 'Company Logo Assets', type: 'Image', lastModified: '2 days ago' },
  ];

  const handleSearchContent = useCallback(() => {
    trackAction('search_content_clicked');
    router.push('/content/search');
  }, [trackAction, router]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
            <p className="text-gray-600 mt-1">
              Browse and search your content repository for proposal development
            </p>
          </div>
          <Button
            onClick={handleSearchContent}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
          >
            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
            Search Content
          </Button>
        </div>
      </div>

      {/* Content Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {contentCategories.map(category => {
          const IconComponent = category.icon;
          return (
            <Card
              key={category.id}
              className={`border ${category.color} hover:shadow-md transition-shadow duration-200`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <IconComponent className="w-8 h-8" />
                  <span className="text-2xl font-bold">{category.count}</span>
                </div>
                <h3 className="text-lg font-medium mb-2">{category.title}</h3>
                <p className="text-sm opacity-80">{category.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Content</h3>
            <div className="space-y-3">
              {recentContent.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.type}</p>
                  </div>
                  <span className="text-xs text-gray-400">{item.lastModified}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Coming Soon</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Advanced content filtering and tagging
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">AI-powered content recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Version control and collaboration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Content usage analytics</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Enhanced content management features will be available in the next release.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
