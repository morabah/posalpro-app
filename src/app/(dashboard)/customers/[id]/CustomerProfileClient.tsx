/**
 * PosalPro MVP2 - Customer Profile Client Component
 * Based on CUSTOMER_PROFILE_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H4 hypothesis validation
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2', 'AC-2.3.3'],
  methods: [
    'configureAccess()',
    'generateRecommendations()',
    'secureAccess()',
    'trackHistory()',
    'logActivity()',
    'classifyCustomer()',
  ],
  hypotheses: ['H4'],
  testCases: ['TC-H4-002'],
};

// Customer tier enumeration
enum CustomerTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  ENTERPRISE = 'enterprise',
}

// Mock customer data
const MOCK_CUSTOMER = {
  id: 'cust-001',
  name: 'Acme Corporation',
  industry: 'Manufacturing',
  address: '123 Business Ave, Tech City',
  phone: '(555) 123-4567',
  website: 'www.acmecorp.com',
  email: 'contact@acmecorp.com',
  tier: CustomerTier.PLATINUM,
  annualRevenue: 2400000000,
  employeeCount: 1200,
  healthScore: 92,
  engagementLevel: 'high' as const,
  lastContact: new Date(Date.now() - 604800000), // 7 days ago
  nextActionDue: new Date(Date.now() + 172800000), // 2 days from now
  tags: ['Enterprise', 'Manufacturing', 'Strategic'],
};

interface CustomerProfileClientProps {
  customerId: string;
}

export function CustomerProfileClient({ customerId }: CustomerProfileClientProps) {
  const router = useRouter();
  const [customer] = useState(MOCK_CUSTOMER);
  const [sessionStartTime] = useState(Date.now());

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Customer Profile Analytics:', {
        action,
        metadata,
        customerId,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
      });
    },
    [customerId, sessionStartTime]
  );

  // Get tier display
  const getTierDisplay = (tier: CustomerTier) => {
    const displays = {
      [CustomerTier.BRONZE]: { label: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-100' },
      [CustomerTier.SILVER]: { label: 'Silver', color: 'text-gray-600', bg: 'bg-gray-100' },
      [CustomerTier.GOLD]: { label: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      [CustomerTier.PLATINUM]: { label: 'Platinum', color: 'text-purple-600', bg: 'bg-purple-100' },
      [CustomerTier.ENTERPRISE]: { label: 'Enterprise', color: 'text-blue-600', bg: 'bg-blue-100' },
    };
    return displays[tier];
  };

  // Get health score color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Format large numbers
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  useEffect(() => {
    trackAction('customer_profile_accessed', {
      customerId,
      customerTier: customer.tier,
      healthScore: customer.healthScore,
    });
  }, [customerId, customer.tier, customer.healthScore, trackAction]);

  const tierDisplay = getTierDisplay(customer.tier);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>{customer.industry}</span>
              <span>•</span>
              <span>{customer.employeeCount.toLocaleString()} employees</span>
              <span>•</span>
              <span>{formatLargeNumber(customer.annualRevenue)} revenue</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              onClick={() => router.push(`/proposals/create?customer=${customerId}`)}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
            <Button
              variant="secondary"
              onClick={() => trackAction('edit_profile_clicked')}
              className="flex items-center"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Customer Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Information */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{customer.name}</span>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{customer.address}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{customer.phone}</span>
                </div>
                <div className="flex items-center">
                  <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <a
                    href={`https://${customer.website}`}
                    className="text-blue-600 hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {customer.website}
                  </a>
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${tierDisplay.bg} ${tierDisplay.color}`}
                  >
                    {tierDisplay.label}
                  </span>
                  <span className="text-sm text-gray-600">{customer.industry}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {customer.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Health */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Health</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Health Score</span>
                    <span className={`text-lg font-bold ${getHealthColor(customer.healthScore)}`}>
                      {customer.healthScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        customer.healthScore >= 80
                          ? 'bg-green-500'
                          : customer.healthScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${customer.healthScore}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Engagement:</span>
                    <div className="font-medium capitalize">{customer.engagementLevel}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Contact:</span>
                    <div className="font-medium">{customer.lastContact.toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center text-sm text-blue-800">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Next action due: {customer.nextActionDue.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Overview</h3>
              <p className="text-gray-600">
                Detailed customer information and analytics would be displayed here. This includes
                proposal history, activity timeline, segmentation data, and AI-powered insights
                based on the customer ID:{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">{customerId}</code>
              </p>
              <div className="mt-4 flex space-x-4">
                <Button
                  variant="primary"
                  onClick={() => router.push(`/proposals/create?customer=${customerId}`)}
                >
                  Create Proposal
                </Button>
                <Button variant="secondary" onClick={() => trackAction('view_full_profile')}>
                  View Full Profile
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
