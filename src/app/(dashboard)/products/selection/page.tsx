/**
 * PosalPro MVP2 - Product Selection Page
 * Interface for selecting and configuring products for proposals
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  CheckCircleIcon,
  CircleStackIcon,
  CogIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-6.2', 'US-6.3'],
  acceptanceCriteria: ['AC-6.2.1', 'AC-6.3.1'],
  methods: ['selectProducts()', 'configureProductOptions()', 'trackSelections()'],
  hypotheses: ['H10', 'H11'],
  testCases: ['TC-H10-001', 'TC-H11-001'],
};

export default function ProductSelectionPage() {
  const [sessionStartTime] = useState(Date.now());
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Product Selection Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
        component: 'ProductSelectionPage',
        userStory: 'US-6.2',
        hypothesis: 'H10',
      });
    },
    [sessionStartTime]
  );

  const productCategories = [
    {
      id: 'software',
      name: 'Software Solutions',
      count: 45,
      icon: CircleStackIcon,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      id: 'hardware',
      name: 'Hardware Products',
      count: 23,
      icon: CogIcon,
      color: 'bg-green-50 border-green-200',
    },
    {
      id: 'services',
      name: 'Professional Services',
      count: 18,
      icon: CheckCircleIcon,
      color: 'bg-purple-50 border-purple-200',
    },
  ];

  const featuredProducts = [
    {
      id: 'ent-security',
      name: 'Enterprise Security Suite',
      category: 'Software',
      price: '$10,000/month',
      description: 'Comprehensive security solution for enterprise environments',
    },
    {
      id: 'cloud-infra',
      name: 'Cloud Infrastructure',
      category: 'Services',
      price: 'Custom pricing',
      description: 'Scalable cloud infrastructure setup and management',
    },
    {
      id: 'data-analytics',
      name: 'Data Analytics Platform',
      category: 'Software',
      price: '$5,000/month',
      description: 'Advanced analytics and business intelligence platform',
    },
  ];

  const handleProductSelect = useCallback(
    (productId: string) => {
      const isSelected = selectedProducts.includes(productId);
      const updatedSelection = isSelected
        ? selectedProducts.filter(id => id !== productId)
        : [...selectedProducts, productId];

      setSelectedProducts(updatedSelection);

      trackAction('product_selected', {
        productId,
        isSelected: !isSelected,
        totalSelected: updatedSelection.length,
      });
    },
    [selectedProducts, trackAction]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Selection</h1>
            <p className="text-gray-600 mt-1">Choose products and services for your proposal</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedProducts.length} products selected
            </span>
            <Button variant="outline" className="flex items-center" disabled>
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Search Products
            </Button>
          </div>
        </div>
      </div>

      {/* Product Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {productCategories.map(category => {
          const IconComponent = category.icon;
          return (
            <Card
              key={category.id}
              className={`border ${category.color} hover:shadow-md transition-shadow duration-200`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <IconComponent className="w-8 h-8 text-gray-600" />
                  <span className="text-2xl font-bold text-gray-700">{category.count}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                <Button variant="outline" size="sm" className="mt-4 w-full" disabled>
                  Browse Category
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Featured Products */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Featured Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map(product => {
              const isSelected = selectedProducts.includes(product.id);
              return (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <button
                      onClick={() => handleProductSelect(product.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {isSelected && <CheckCircleIcon className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                  <p className="text-sm text-gray-700 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{product.price}</span>
                    <Button variant="outline" size="sm" disabled>
                      Configure
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Enhanced Product Selection Coming Soon
              </h4>
              <p className="text-gray-600 mb-4">
                Advanced product filtering, configuration options, and pricing calculations will be
                available in the next release.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Advanced product search and filtering
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Product configuration wizard</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Real-time pricing calculations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Product recommendations engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
