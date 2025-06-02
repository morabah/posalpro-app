/**
 * PosalPro MVP2 - Product Management Page
 * Administrative interface for managing products and catalog
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  CircleStackIcon,
  CogIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.4', 'US-6.5'],
  acceptanceCriteria: ['AC-6.4.1', 'AC-6.5.1'],
  methods: ['manageProducts()', 'editProductCatalog()', 'trackProductChanges()'],
  hypotheses: ['H12'],
  testCases: ['TC-H12-001'],
};

export default function ProductManagementPage() {
  const [sessionStartTime] = useState(Date.now());

  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Product Management Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
        component: 'ProductManagementPage',
        userStory: 'US-6.4',
        hypothesis: 'H12',
      });
    },
    [sessionStartTime]
  );

  const managementActions = [
    {
      id: 'add-product',
      title: 'Add New Product',
      description: 'Create a new product in the catalog',
      icon: PlusIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'manage-categories',
      title: 'Manage Categories',
      description: 'Organize products into categories',
      icon: CircleStackIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'bulk-operations',
      title: 'Bulk Operations',
      description: 'Perform operations on multiple products',
      icon: CogIcon,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  const recentProducts = [
    {
      id: 1,
      name: 'Enterprise Security Suite',
      category: 'Software',
      status: 'Active',
      lastModified: '2 hours ago',
    },
    {
      id: 2,
      name: 'Cloud Infrastructure',
      category: 'Services',
      status: 'Active',
      lastModified: '1 day ago',
    },
    {
      id: 3,
      name: 'Data Analytics Platform',
      category: 'Software',
      status: 'Draft',
      lastModified: '3 days ago',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog and configurations</p>
          </div>
          <Button
            onClick={() => trackAction('add_product_clicked')}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            disabled
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Management Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {managementActions.map(action => {
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
                  onClick={() => trackAction(`${action.id}_clicked`)}
                  className={`${action.color} text-white w-full`}
                  disabled
                >
                  {action.title}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Products */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.lastModified}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => trackAction('edit_product', { productId: product.id })}
                          className="text-blue-600 hover:text-blue-900"
                          disabled
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => trackAction('delete_product', { productId: product.id })}
                          className="text-red-600 hover:text-red-900"
                          disabled
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Enhanced Product Management Coming Soon
              </h4>
              <p className="text-gray-600 mb-4">
                Full product management capabilities including CRUD operations, bulk editing, and
                advanced categorization will be available in the next release.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Product creation and editing forms</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Advanced category management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Bulk operations and import/export</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Product versioning and history</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
