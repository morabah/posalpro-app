/**
 * PosalPro MVP2 - Customer Profile Client Component
 * Based on CUSTOMER_PROFILE_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H4 hypothesis validation
 * PHASE 1 IMPLEMENTATION: Full Customer Profile Edit Functionality
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CheckIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Component Traceability Matrix - Enhanced with CRUD operations
const COMPONENT_MAPPING = {
  userStories: ['US-2.3', 'US-6.4'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2', 'AC-2.3.3', 'AC-6.4.1'],
  methods: [
    'configureAccess()',
    'generateRecommendations()',
    'secureAccess()',
    'trackHistory()',
    'logActivity()',
    'classifyCustomer()',
    'updateCustomerProfile()',
    'validateCustomerData()',
    'saveCustomerChanges()',
  ],
  hypotheses: ['H4', 'H12'],
  testCases: ['TC-H4-002', 'TC-H12-001'],
};

// Customer tier enumeration
enum CustomerTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  ENTERPRISE = 'enterprise',
}

// Customer interface
interface Customer {
  id: string;
  name: string;
  industry: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  tier: CustomerTier;
  annualRevenue: number;
  employeeCount: number;
  healthScore: number;
  engagementLevel: 'low' | 'medium' | 'high';
  lastContact: Date;
  nextActionDue: Date;
  tags: string[];
}

// Edit form data interface
interface CustomerEditData {
  name: string;
  industry: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  tier: CustomerTier;
  annualRevenue: number;
  employeeCount: number;
  tags: string[];
}

// Mock customer data
const MOCK_CUSTOMER: Customer = {
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
  const analytics = useAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // State management
  const [customer, setCustomer] = useState<Customer>(MOCK_CUSTOMER);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CustomerEditData>({} as CustomerEditData);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      analytics.track('customer_profile_action', {
        action,
        metadata: {
          ...metadata,
          customerId,
          component: 'CustomerProfileClient',
          userStory: 'US-2.3',
          hypothesis: 'H4',
          sessionDuration: Date.now() - sessionStartTime,
        },
        timestamp: Date.now(),
      });
    },
    [customerId, sessionStartTime, analytics]
  );

  // Error handling
  const handleError = useCallback(
    (error: unknown, operation: string, context?: any) => {
      const standardError =
        error instanceof Error
          ? new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Customer ${operation} failed: ${error.message}`,
              cause: error,
              metadata: { operation, context, customerId, component: 'CustomerProfileClient' },
            })
          : new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Customer ${operation} failed: Unknown error`,
              metadata: { operation, context, customerId, component: 'CustomerProfileClient' },
            });

      errorHandlingService.processError(standardError);

      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      toast.error(userMessage);

      trackAction(`${operation}_error`, { error: standardError.message, context });
    },
    [errorHandlingService, trackAction, customerId]
  );

  // Initialize edit data when entering edit mode
  const initializeEditData = useCallback(() => {
    setEditData({
      name: customer.name,
      industry: customer.industry,
      address: customer.address,
      phone: customer.phone,
      website: customer.website,
      email: customer.email,
      tier: customer.tier,
      annualRevenue: customer.annualRevenue,
      employeeCount: customer.employeeCount,
      tags: [...customer.tags],
    });
  }, [customer]);

  // Handle edit mode toggle
  const handleEditToggle = useCallback(() => {
    if (!isEditing) {
      trackAction('edit_profile_started');
      initializeEditData();
      setIsEditing(true);
    } else {
      trackAction('edit_profile_cancelled');
      setIsEditing(false);
      setEditData({} as CustomerEditData);
    }
  }, [isEditing, trackAction, initializeEditData]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof CustomerEditData, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Validate edit data
  const validateEditData = useCallback((data: CustomerEditData): string[] => {
    const errors: string[] = [];

    if (!data.name?.trim()) errors.push('Company name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.phone?.trim()) errors.push('Phone number is required');
    if (data.annualRevenue <= 0) errors.push('Annual revenue must be greater than 0');
    if (data.employeeCount <= 0) errors.push('Employee count must be greater than 0');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.push('Please enter a valid email address');
    }

    return errors;
  }, []);

  // Save customer changes
  const handleSaveChanges = useCallback(async () => {
    try {
      setIsLoading(true);
      trackAction('save_customer_started', { editData });

      // Validate data
      const validationErrors = validateEditData(editData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Simulate API call - in real implementation, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update customer state
      const updatedCustomer: Customer = {
        ...customer,
        ...editData,
        lastContact: new Date(), // Update last contact time
      };

      setCustomer(updatedCustomer);
      setIsEditing(false);
      setEditData({} as CustomerEditData);

      toast.success('Customer profile updated successfully');
      trackAction('save_customer_success', {
        customerId,
        updatedFields: Object.keys(editData),
      });
    } catch (error) {
      handleError(error, 'profile_update', { editData });
    } finally {
      setIsLoading(false);
    }
  }, [editData, customer, validateEditData, trackAction, handleError, customerId]);

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
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 bg-transparent focus:outline-none"
                  placeholder="Company name"
                />
                <div className="flex items-center space-x-4 text-sm">
                  <input
                    type="text"
                    value={editData.industry || ''}
                    onChange={e => handleFieldChange('industry', e.target.value)}
                    className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                    placeholder="Industry"
                  />
                  <span>•</span>
                  <input
                    type="number"
                    value={editData.employeeCount || ''}
                    onChange={e =>
                      handleFieldChange('employeeCount', parseInt(e.target.value) || 0)
                    }
                    className="w-20 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                  <span>employees</span>
                  <span>•</span>
                  <input
                    type="number"
                    value={editData.annualRevenue || ''}
                    onChange={e =>
                      handleFieldChange('annualRevenue', parseInt(e.target.value) || 0)
                    }
                    className="w-32 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                  <span>revenue</span>
                </div>
              </div>
            ) : (
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
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/proposals/create?customer=${customerId}`)}
                className="flex items-center min-h-[44px]"
                aria-label="Create new proposal"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {isMobile ? 'Proposal' : 'New Proposal'}
              </Button>
            )}

            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleEditToggle}
                  className="flex items-center min-h-[44px]"
                  disabled={isLoading}
                  aria-label="Cancel editing"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  className="flex items-center min-h-[44px] bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                  aria-label="Save changes"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={handleEditToggle}
                className="flex items-center min-h-[44px]"
                aria-label="Edit customer profile"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                {isMobile ? 'Edit' : 'Edit Profile'}
              </Button>
            )}
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
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={e => handleFieldChange('name', e.target.value)}
                      className="flex-1 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      placeholder="Company name"
                    />
                  ) : (
                    <span className="text-gray-900">{customer.name}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.address || ''}
                      onChange={e => handleFieldChange('address', e.target.value)}
                      className="flex-1 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      placeholder="Address"
                    />
                  ) : (
                    <span className="text-gray-700">{customer.address}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.phone || ''}
                      onChange={e => handleFieldChange('phone', e.target.value)}
                      className="flex-1 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      placeholder="Phone number"
                    />
                  ) : (
                    <span className="text-gray-700">{customer.phone}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email || ''}
                      onChange={e => handleFieldChange('email', e.target.value)}
                      className="flex-1 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      placeholder="Email address"
                    />
                  ) : (
                    <span className="text-gray-700">{customer.email}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.website || ''}
                      onChange={e => handleFieldChange('website', e.target.value)}
                      className="flex-1 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      placeholder="Website URL"
                    />
                  ) : (
                    <a
                      href={`https://${customer.website}`}
                      className="text-blue-600 hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {customer.website}
                    </a>
                  )}
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
