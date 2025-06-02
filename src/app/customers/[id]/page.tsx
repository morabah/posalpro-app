/**
 * PosalPro MVP2 - Customer Profile Management
 * Based on CUSTOMER_PROFILE_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H4 hypothesis validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LightBulbIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

// Customer health enumeration
enum CustomerHealth {
  AT_RISK = 'at_risk',
  STABLE = 'stable',
  GROWING = 'growing',
  THRIVING = 'thriving',
}

// Activity type enumeration
enum ActivityType {
  EMAIL = 'email',
  CALL = 'call',
  MEETING = 'meeting',
  SUPPORT_TICKET = 'support_ticket',
  PROPOSAL = 'proposal',
  CONTRACT = 'contract',
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

// Contact interface
interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  department: string;
}

// Proposal history interface
interface ProposalHistoryItem {
  id: string;
  proposalNumber: string;
  title: string;
  value: number;
  status: 'won' | 'lost' | 'pending' | 'cancelled';
  createdAt: Date;
  wonAt?: Date;
  winProbability?: number;
}

// Activity interface
interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: Date;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
}

// AI insight interface
interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'risk' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

// Segmentation data interface
interface SegmentationData {
  segment: string;
  currentValue: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

// Customer metrics for H4 validation
interface CustomerProfileMetrics {
  customerId: string;
  clientSpecificInsights: number;
  roleBasedViewEvents: number;
  sensitiveDataAccess: number;
  coordinationImprovement: number;
  profileViewFrequency: number;
  dataUpdateFrequency: number;
  insightUtilization: number;
  recommendationAccuracy: number;
  dataAccessEvents: number;
  permissionChanges: number;
  auditTrailEntries: number;
  securityViolations: number;
  segmentationAccuracy: number;
  predictiveAccuracy: number;
  opportunityIdentification: number;
  riskAssessmentAccuracy: number;
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
  engagementLevel: 'high',
  lastContact: new Date(Date.now() - 604800000), // 7 days ago
  nextActionDue: new Date(Date.now() + 172800000), // 2 days from now
  tags: ['Enterprise', 'Manufacturing', 'Strategic'],
};

// Mock contacts data
const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact-001',
    name: 'John Doe',
    role: 'CTO',
    email: 'jdoe@acmecorp.com',
    phone: '(555) 987-6543',
    isPrimary: true,
    department: 'Technology',
  },
  {
    id: 'contact-002',
    name: 'Sarah Smith',
    role: 'CFO',
    email: 'ssmith@acmecorp.com',
    phone: '(555) 987-6544',
    isPrimary: false,
    department: 'Finance',
  },
  {
    id: 'contact-003',
    name: 'Mike Johnson',
    role: 'VP Operations',
    email: 'mjohnson@acmecorp.com',
    phone: '(555) 987-6545',
    isPrimary: false,
    department: 'Operations',
  },
];

// Mock proposal history
const MOCK_PROPOSALS: ProposalHistoryItem[] = [
  {
    id: 'prop-001',
    proposalNumber: 'PR-2023-0456',
    title: 'IT Infrastructure Upgrade',
    value: 245000,
    status: 'won',
    createdAt: new Date('2023-11-15'),
    wonAt: new Date('2023-12-01'),
  },
  {
    id: 'prop-002',
    proposalNumber: 'PR-2023-0389',
    title: 'Security Audit Service',
    value: 187500,
    status: 'lost',
    createdAt: new Date('2023-09-22'),
  },
  {
    id: 'prop-003',
    proposalNumber: 'PR-2023-0291',
    title: 'Cloud Migration Project',
    value: 312000,
    status: 'won',
    createdAt: new Date('2023-07-05'),
    wonAt: new Date('2023-07-20'),
  },
  {
    id: 'prop-004',
    proposalNumber: 'PR-2023-0145',
    title: 'Training & Certification',
    value: 156750,
    status: 'won',
    createdAt: new Date('2023-03-18'),
    wonAt: new Date('2023-04-01'),
  },
];

// Mock activity data
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act-001',
    type: ActivityType.SUPPORT_TICKET,
    title: 'Support Ticket Opened',
    description: 'Performance issues with current solution',
    date: new Date('2023-05-28'),
    priority: 'high',
    assignee: 'Support Team A',
    status: 'in_progress',
  },
  {
    id: 'act-002',
    type: ActivityType.MEETING,
    title: 'Q2 Business Review',
    description: 'Discussed expansion plans and budget allocation',
    date: new Date('2023-05-15'),
    priority: 'medium',
    assignee: 'Sales Team',
    status: 'completed',
  },
  {
    id: 'act-003',
    type: ActivityType.EMAIL,
    title: 'Contract Renewal Inquiry',
    description: 'CFO inquired about early renewal options',
    date: new Date('2023-04-30'),
    priority: 'high',
    assignee: 'Account Manager',
    status: 'completed',
  },
  {
    id: 'act-004',
    type: ActivityType.CALL,
    title: 'Technical Discussion',
    description: 'CTO called regarding new features requirement',
    date: new Date('2023-04-22'),
    priority: 'medium',
    assignee: 'Technical Team',
    status: 'completed',
  },
];

// Mock AI insights
const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    id: 'insight-001',
    type: 'recommendation',
    title: 'Schedule Q3 Business Review',
    description: 'Customer engagement pattern suggests optimal timing for business review meeting',
    confidence: 85,
    priority: 'high',
    category: 'Engagement',
  },
  {
    id: 'insight-002',
    type: 'opportunity',
    title: 'Cloud Migration Package',
    description:
      'Recent infrastructure discussions indicate 78% likelihood of cloud migration interest',
    confidence: 78,
    priority: 'high',
    category: 'Upsell',
  },
  {
    id: 'insight-003',
    type: 'prediction',
    title: 'Security Solutions Interest',
    description:
      'Analysis of recent security incidents suggests 65% probability of security assessment purchase',
    confidence: 65,
    priority: 'medium',
    category: 'Cross-sell',
  },
  {
    id: 'insight-004',
    type: 'risk',
    title: 'Budget Constraints Expected',
    description: 'Financial patterns indicate potential budget constraints in Q4',
    confidence: 72,
    priority: 'medium',
    category: 'Risk Management',
  },
];

// Mock segmentation data
const MOCK_SEGMENTATION: SegmentationData[] = [
  { segment: 'Tech Stack', currentValue: 'Microsoft 365', trend: 'up', trendPercentage: 15 },
  { segment: 'Buying Center', currentValue: '8 members', trend: 'stable', trendPercentage: 0 },
  { segment: 'Budget Cycle', currentValue: 'Calendar Year', trend: 'stable', trendPercentage: 0 },
  { segment: 'Pain Points', currentValue: 'Scalability', trend: 'up', trendPercentage: 8 },
];

export default function CustomerProfileManagement({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer] = useState<Customer>(MOCK_CUSTOMER);
  const [contacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [proposals] = useState<ProposalHistoryItem[]>(MOCK_PROPOSALS);
  const [activities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [aiInsights] = useState<AIInsight[]>(MOCK_AI_INSIGHTS);
  const [segmentation] = useState<SegmentationData[]>(MOCK_SEGMENTATION);
  const [activeTab, setActiveTab] = useState<
    'proposals' | 'activity' | 'segmentation' | 'predictions'
  >('proposals');
  const [sessionStartTime] = useState(Date.now());

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalProposalValue = proposals.reduce((sum, p) => sum + p.value, 0);
    const wonProposals = proposals.filter(p => p.status === 'won');
    const avgDealSize =
      wonProposals.length > 0
        ? wonProposals.reduce((sum, p) => sum + p.value, 0) / wonProposals.length
        : 0;
    const winRate = proposals.length > 0 ? (wonProposals.length / proposals.length) * 100 : 0;

    return {
      totalValue: totalProposalValue,
      avgDealSize,
      winRate: Math.round(winRate),
      totalProposals: proposals.length,
      wonProposals: wonProposals.length,
    };
  }, [proposals]);

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Customer Profile Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        customerId: customer.id,
        sessionDuration: Date.now() - sessionStartTime,
      });
    },
    [customer.id, sessionStartTime]
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

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <ArrowRightIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get activity type icon
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.EMAIL:
        return <EnvelopeIcon className="w-5 h-5 text-blue-600" />;
      case ActivityType.CALL:
        return <PhoneIcon className="w-5 h-5 text-green-600" />;
      case ActivityType.MEETING:
        return <UserGroupIcon className="w-5 h-5 text-purple-600" />;
      case ActivityType.SUPPORT_TICKET:
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case ActivityType.PROPOSAL:
        return <DocumentTextIcon className="w-5 h-5 text-orange-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get insight type icon
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation':
        return <LightBulbIcon className="w-5 h-5 text-blue-600" />;
      case 'opportunity':
        return <ChartBarSquareIcon className="w-5 h-5 text-green-600" />;
      case 'prediction':
        return <ChartBarIcon className="w-5 h-5 text-purple-600" />;
      case 'risk':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <CogIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
    return formatCurrency(num);
  };

  useEffect(() => {
    trackAction('customer_profile_accessed', {
      customerId: customer.id,
      customerTier: customer.tier,
      healthScore: customer.healthScore,
    });
  }, [customer.id, customer.tier, customer.healthScore, trackAction]);

  const tierDisplay = getTierDisplay(customer.tier);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <button
                  onClick={() => router.push('/customers')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Customers
                </button>
                <span className="text-gray-400">›</span>
                <span className="text-gray-900">{customer.name}</span>
              </div>
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
                onClick={() => router.push(`/proposals/create?customer=${customer.id}`)}
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            {/* Key Contacts */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Contacts</h3>
                <div className="space-y-4">
                  {contacts.map(contact => (
                    <div
                      key={contact.id}
                      className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <UserIcon className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{contact.name}</span>
                              {contact.isPrimary && (
                                <StarIcon className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{contact.role}</div>
                            <div className="text-sm text-gray-500">{contact.department}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 ml-8 space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <EnvelopeIcon className="w-4 h-4 mr-2" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {contact.email}
                          </a>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="w-4 h-4 mr-2" />
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
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
            {/* Tab Navigation */}
            <Card>
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'proposals', label: 'Proposals', count: proposals.length },
                    { id: 'activity', label: 'Activity', count: activities.length },
                    { id: 'segmentation', label: 'Segmentation', count: null },
                    { id: 'predictions', label: 'Predictions', count: aiInsights.length },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        trackAction('tab_changed', { tab: tab.id });
                      }}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      {tab.count !== null && (
                        <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 text-xs rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Proposals Tab */}
                {activeTab === 'proposals' && (
                  <div className="space-y-6">
                    {/* Proposal Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(metrics.totalValue)}
                        </div>
                        <div className="text-sm text-gray-600">Total Value</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(metrics.avgDealSize)}
                        </div>
                        <div className="text-sm text-gray-600">Avg. Deal Size</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{metrics.winRate}%</div>
                        <div className="text-sm text-gray-600">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {metrics.wonProposals}
                        </div>
                        <div className="text-sm text-gray-600">Won Proposals</div>
                      </div>
                    </div>

                    {/* Proposal History Table */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Proposal History (Last 12 Months)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Proposal #
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Title
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Value
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {proposals.map(proposal => (
                              <tr key={proposal.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                  <button
                                    onClick={() => {
                                      trackAction('proposal_viewed', { proposalId: proposal.id });
                                      router.push(`/proposals/${proposal.id}`);
                                    }}
                                    className="hover:text-blue-800"
                                  >
                                    {proposal.proposalNumber}
                                  </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {proposal.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {proposal.createdAt.toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      proposal.status === 'won'
                                        ? 'bg-green-100 text-green-800'
                                        : proposal.status === 'lost'
                                        ? 'bg-red-100 text-red-800'
                                        : proposal.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {proposal.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(proposal.value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">Activity Timeline</h4>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => trackAction('log_activity_clicked')}
                      >
                        Log New Activity
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {activities.map(activity => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900">{activity.title}</h5>
                              <span className="text-sm text-gray-500">
                                {activity.date.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              {activity.assignee && <span>Assigned to: {activity.assignee}</span>}
                              {activity.status && (
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    activity.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : activity.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : activity.status === 'open'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {activity.status.replace('_', ' ').toUpperCase()}
                                </span>
                              )}
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  activity.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : activity.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {activity.priority.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Segmentation Tab */}
                {activeTab === 'segmentation' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium text-gray-900">Customer Segmentation</h4>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600">Tier</div>
                        <div className="text-lg font-bold text-blue-600">{tierDisplay.label}</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-600">Account Health</div>
                        <div
                          className={`text-lg font-bold ${getHealthColor(customer.healthScore)}`}
                        >
                          {customer.healthScore}% (Strong)
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-sm text-gray-600">Potential</div>
                        <div className="text-lg font-bold text-purple-600">High Growth</div>
                      </div>
                    </div>

                    {/* Segmentation Details */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-4">Segment Analysis</h5>
                      <div className="space-y-4">
                        {segmentation.map((segment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{segment.segment}</div>
                              <div className="text-sm text-gray-600">{segment.currentValue}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getTrendIcon(segment.trend)}
                              <span
                                className={`text-sm font-medium ${
                                  segment.trend === 'up'
                                    ? 'text-green-600'
                                    : segment.trend === 'down'
                                    ? 'text-red-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                {segment.trendPercentage > 0
                                  ? `${segment.trendPercentage}%`
                                  : 'No change'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Predictions Tab */}
                {activeTab === 'predictions' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium text-gray-900">
                      AI-Powered Insights & Recommendations
                    </h4>
                    <div className="space-y-4">
                      {aiInsights.map(insight => (
                        <div
                          key={insight.id}
                          className={`p-4 rounded-lg border-l-4 ${
                            insight.type === 'recommendation'
                              ? 'border-blue-500 bg-blue-50'
                              : insight.type === 'opportunity'
                              ? 'border-green-500 bg-green-50'
                              : insight.type === 'prediction'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-red-500 bg-red-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">{getInsightIcon(insight.type)}</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-gray-900">{insight.title}</h5>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    insight.priority === 'high'
                                      ? 'bg-red-100 text-red-800'
                                      : insight.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {insight.priority.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>Category: {insight.category}</span>
                                  <span>Confidence: {insight.confidence}%</span>
                                </div>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    trackAction('insight_action_taken', { insightId: insight.id })
                                  }
                                >
                                  Take Action
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
