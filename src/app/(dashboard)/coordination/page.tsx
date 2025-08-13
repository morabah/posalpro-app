/**
 * PosalPro MVP2 - Coordination Hub
 * Based on COORDINATION_HUB_SCREEN.md wireframe specifications
 * Implements cross-department coordination with AI-powered insights
 *
 * User Stories: US-2.2, US-2.3, US-4.1, US-4.3
 * Hypotheses: H4 (40% coordination reduction), H7 (40% on-time improvement)
 * Component Traceability: ProposalOverview, TeamAssignmentBoard, CommunicationCenter, TimelineVisualization
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Simple toast function to replace react-hot-toast
const showToast = (message: string) => {

  // In a real implementation, this would show a toast notification
};

// Inline SVG components to replace Heroicons and prevent webpack chunk loading issues
const AdjustmentsHorizontalIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9 0a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5m-9 0H4.5m9 0a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5m-9 0H4.5m9 0a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5m-9 0H4.5M7.5 6V4.5a1.5 1.5 0 011.5-1.5h1.5M7.5 6A1.5 1.5 0 009 4.5h1.5m-3 3A1.5 1.5 0 019 9h1.5m-3 3a1.5 1.5 0 011.5 1.5H9m-1.5-3h1.5m-3 3h1.5m-3 3a1.5 1.5 0 011.5 1.5H9m-1.5-3h1.5m-3 3h1.5M4.5 6v15"
    />
  </svg>
);

const ArrowTrendingUpIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
    />
  </svg>
);

const BellIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
    />
  </svg>
);

const CalendarIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);

const ChartBarIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
    />
  </svg>
);

const ChatBubbleLeftRightIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
    />
  </svg>
);

const CheckCircleIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ClockIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const DocumentTextIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const ExclamationTriangleIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

const EyeIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LightBulbIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
    />
  </svg>
);

const PlusIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const UserGroupIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.522c-.747 1.116-1.081 2.494-.914 3.817.165 1.323.788 2.537 1.82 3.396m7.5-3.396a10.962 10.962 0 00-2.083-.334 10.965 10.965 0 00-2.315 0m2.315 0a10.965 10.965 0 012.315 0m-2.315 0V18.75m0-3.396a10.962 10.962 0 01-2.083.334 10.965 10.965 0 01-2.315 0m2.315 0V18.75"
    />
  </svg>
);

const UsersIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128c-.025 0-.05-.002-.074-.006-1.137-.092-2.254-.235-3.332-.43-1.18-.216-2.372-.549-3.533-.993a11.95 11.95 0 01-3.177-1.599 7.5 7.5 0 01-3.635-5.422 7.5 7.5 0 013.635-5.422 11.95 11.95 0 013.177-1.599c1.16-.444 2.352-.777 3.533-.993a82.454 82.454 0 013.692-.676L15 8.75M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
    />
  </svg>
);

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-2.3', 'US-4.1', 'US-4.3'],
  acceptanceCriteria: [
    'AC-2.2.1',
    'AC-2.2.2',
    'AC-2.2.3',
    'AC-2.2.4',
    'AC-2.3.1',
    'AC-2.3.2',
    'AC-2.3.3',
    'AC-4.1.1',
    'AC-4.1.2',
    'AC-4.1.3',
    'AC-4.3.1',
    'AC-4.3.2',
    'AC-4.3.3',
  ],
  methods: [
    'statusUpdates()',
    'roleBasedView()',
    'suggestContributors()',
    'trackCoordinationTime()',
    'clientInsights()',
    'complexityEstimation()',
    'criticalPath()',
    'calculatePriority()',
    'mapDependencies()',
  ],
  hypotheses: ['H4', 'H7'],
  testCases: ['TC-H4-001', 'TC-H4-002', 'TC-H7-001', 'TC-H7-002'],
};

// Types for coordination management
interface Proposal {
  id: string;
  name: string;
  client: string;
  status: 'Draft' | 'In Progress' | 'Review' | 'Completed';
  progress: number;
  deadline: Date;
  teamMembers: TeamMember[];
  priority: 'High' | 'Medium' | 'Low';
  complexity: number;
  estimatedHours: number;
  actualHours: number;
  lastUpdate: Date;
  criticalPath: boolean;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  assignedSections: string[];
  workload: number;
  availability: 'Available' | 'Busy' | 'Unavailable';
  lastActive: Date;
  completionRate: number;
}

interface Task {
  id: string;
  proposalId: string;
  title: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Review' | 'Completed';
  deadline: Date;
  dependencies: string[];
  estimatedHours: number;
  actualHours: number;
  section: string;
}

interface AIInsight {
  id: string;
  type: 'bottleneck' | 'optimization' | 'risk' | 'suggestion';
  message: string;
  confidence: number;
  priority: 'High' | 'Medium' | 'Low';
  actionable: boolean;
  proposalId?: string;
  teamMemberId?: string;
}

// Live data only – initialize empty and load from APIs
const MOCK_PROPOSALS: Proposal[] = [];
const MOCK_AI_INSIGHTS: AIInsight[] = [];

export default function CoordinationHub() {
  const apiClient = useApiClient();
  const [activeTab, setActiveTab] = useState<'proposals' | 'team' | 'timeline' | 'analytics'>(
    'proposals'
  );
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Load live proposals and insights
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const [proposalsRes, insightsRes] = await Promise.all([
          apiClient.get<{ success: boolean; data: { proposals: Proposal[]; pagination?: any } }>(
            '/proposals?limit=50&sortBy=updatedAt&sortOrder=desc'
          ),
          apiClient.get<{ success: boolean; data: AIInsight[] }>('/analytics/insights?limit=10'),
        ]);
        if (isCancelled) return;
        const proposals = (proposalsRes as any)?.data?.proposals || [];
        const insights = (insightsRes as any)?.data || [];
        // Map proposals to UI shape if needed
        const mapped: Proposal[] = proposals.map((p: any) => ({
          id: p.id,
          name: p.title ?? p.name ?? 'Untitled',
          client: p.customerName ?? p.customer?.name ?? 'Unknown',
          status: (p.status as any) ?? 'Draft',
          progress: Math.min(100, Math.max(0, Math.round((p.completionRate ?? 0) * 100))),
          deadline: new Date(p.dueDate ?? Date.now()),
          priority: (p.priority as any) ?? 'Medium',
          complexity: p.complexity ?? 5,
          estimatedHours: p.estimatedHours ?? 0,
          actualHours: p.actualHours ?? 0,
          lastUpdate: new Date(p.updatedAt ?? Date.now()),
          criticalPath: Boolean(p.criticalPath),
          riskLevel: (p.riskLevel as any) ?? 'Low',
          teamMembers: (p.teamMembers ?? []).map((m: any) => ({
            id: m.id,
            name: m.name,
            role: m.role ?? 'Member',
            department: m.department ?? 'General',
            assignedSections: m.assignedSections ?? [],
            workload: m.workload ?? 0,
            availability: m.availability ?? 'Available',
            lastActive: new Date(m.lastActive ?? Date.now()),
            completionRate: m.completionRate ?? 0,
          })),
        }));
        // Set state via local setters introduced below
        setLiveProposals(mapped);
        setAiInsights(insights as AIInsight[]);
        const pg = (proposalsRes as any)?.data?.pagination;
        if (pg && typeof pg === 'object') {
          setNextCursor(pg.nextCursor || null);
          setHasMore(Boolean(pg.hasNextPage));
        } else {
          setNextCursor(null);
          setHasMore(false);
        }
      } catch {
        if (!isCancelled) {
          setLiveProposals([]);
          setAiInsights([]);
        }
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [apiClient]);

  const loadMoreProposals = useCallback(async () => {
    if (!nextCursor) return;
    const qp = new URLSearchParams({ limit: '50', cursor: nextCursor }).toString();
    const res = await apiClient.get<{ success: boolean; data: { proposals: any[]; pagination?: any } }>(
      `/proposals?${qp}`
    );
    if (res?.success) {
      const mapped: Proposal[] = (res.data.proposals || []).map((p: any) => ({
        id: p.id,
        name: p.title ?? p.name ?? 'Untitled',
        client: p.customerName ?? p.customer?.name ?? 'Unknown',
        status: (p.status as any) ?? 'Draft',
        progress: Math.min(100, Math.max(0, Math.round((p.completionRate ?? 0) * 100))),
        deadline: new Date(p.dueDate ?? Date.now()),
        priority: (p.priority as any) ?? 'Medium',
        complexity: p.complexity ?? 5,
        estimatedHours: p.estimatedHours ?? 0,
        actualHours: p.actualHours ?? 0,
        lastUpdate: new Date(p.updatedAt ?? Date.now()),
        criticalPath: Boolean(p.criticalPath),
        riskLevel: (p.riskLevel as any) ?? 'Low',
        teamMembers: (p.teamMembers ?? []).map((m: any) => ({
          id: m.id,
          name: m.name,
          role: m.role ?? 'Member',
          department: m.department ?? 'General',
          assignedSections: m.assignedSections ?? [],
          workload: m.workload ?? 0,
          availability: m.availability ?? 'Available',
          lastActive: new Date(m.lastActive ?? Date.now()),
          completionRate: m.completionRate ?? 0,
        })),
      }));
      setLiveProposals(prev => [...prev, ...mapped]);
      const pg = (res as any)?.data?.pagination;
      if (pg && typeof pg === 'object') {
        setNextCursor(pg.nextCursor || null);
        setHasMore(Boolean(pg.hasNextPage));
      } else {
        setNextCursor(null);
        setHasMore(false);
      }
    }
  }, [apiClient, nextCursor]);

  // Filter proposals based on search and filters
  const [liveProposals, setLiveProposals] = useState<Proposal[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const filteredProposals = useMemo(() => {
    return liveProposals.filter(proposal => {
      const matchesSearch =
        proposal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || proposal.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || proposal.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [liveProposals, searchTerm, statusFilter, priorityFilter]);

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'In Progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'Review':
        return <EyeIcon className="h-5 w-5 text-yellow-500" />;
      case 'Draft':
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Analytics calculations
  const coordinationMetrics = useMemo(() => {
    const totalProposals = liveProposals.length;
    const completedProposals = liveProposals.filter(p => p.status === 'Completed').length;
    const inProgressProposals = liveProposals.filter(p => p.status === 'In Progress').length;
    const overdue = liveProposals.filter(
      p => new Date(p.deadline) < new Date() && p.status !== 'Completed'
    ).length;
    const avgProgress =
      liveProposals.reduce((acc, p) => acc + p.progress, 0) / (totalProposals || 1) || 0;
    const highRiskCount = liveProposals.filter(
      p => p.riskLevel === 'High' || p.riskLevel === 'Critical'
    ).length;

    return {
      totalProposals,
      completedProposals,
      inProgressProposals,
      overdue,
      avgProgress: Math.round(avgProgress),
      highRiskCount,
      onTimeRate:
        totalProposals > 0 ? Math.round(((totalProposals - overdue) / totalProposals) * 100) : 0,
    };
  }, [liveProposals]);

  const handleViewProposal = useCallback(
    (proposalId: string) => {
      setSelectedProposal(proposalId);
      showToast(`Viewing proposal: ${liveProposals.find(p => p.id === proposalId)?.name ?? ''}`);
    },
    [liveProposals]
  );

  const handleAssignTeamMember = useCallback((proposalId: string) => {
    showToast('Team assignment interface would open here');
  }, []);

  const handleUpdateStatus = useCallback((proposalId: string, newStatus: string) => {
    showToast(`Status updated to: ${newStatus}`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Coordination Hub</h1>
              <p className="mt-1 text-sm text-gray-500">
                Cross-department coordination and timeline management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BellIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">{aiInsights.length} insights</span>
              </div>
              <Button onClick={() => showToast('New proposal wizard would open')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Proposals</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {coordinationMetrics.totalProposals}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500">
                {coordinationMetrics.inProgressProposals} in progress
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Progress</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {coordinationMetrics.avgProgress}%
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-green-600">Target: ≥40% improvement (H7)</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">On-Time Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {coordinationMetrics.onTimeRate}%
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500">{coordinationMetrics.overdue} overdue</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">High Risk</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {coordinationMetrics.highRiskCount}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-red-600">Requires attention</div>
            </div>
          </Card>
        </div>

        {/* AI Insights Panel */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <LightBulbIcon className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-medium text-gray-900">AI Insights & Recommendations</h3>
            </div>
            <Button variant="outline" size="sm">
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
          <div className="space-y-3">
            {aiInsights.map(insight => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === 'High'
                    ? 'border-red-400 bg-red-50'
                    : insight.priority === 'Medium'
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-blue-400 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {insight.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{insight.message}</p>
                  </div>
                  {insight.actionable && (
                    <Button size="sm" variant="outline">
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'proposals', label: 'Active Proposals', icon: DocumentTextIcon },
              { key: 'team', label: 'Team View', icon: UserGroupIcon },
              { key: 'timeline', label: 'Timeline', icon: CalendarIcon },
              { key: 'analytics', label: 'Analytics', icon: ChartBarIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'proposals' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>All</option>
                  <option>Draft</option>
                  <option>In Progress</option>
                  <option>Review</option>
                  <option>Completed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>All</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <Button onClick={() => showToast('Filter options would open')}>
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>

            {/* Proposals List */}
            <div className="grid gap-6">
              {filteredProposals.map(proposal => (
                <Card key={proposal.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(proposal.status)}
                        <h3 className="text-lg font-medium text-gray-900">{proposal.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(proposal.priority)}`}
                        >
                          {proposal.priority}
                        </span>
                        {proposal.criticalPath && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Critical Path
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Client: {proposal.client}</p>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Progress</div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${proposal.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {proposal.progress}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Deadline</div>
                          <div className="text-sm font-medium text-gray-900">
                            {proposal.deadline.toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Team Size</div>
                          <div className="text-sm font-medium text-gray-900">
                            {proposal.teamMembers.length} members
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Risk Level</div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getRiskColor(proposal.riskLevel)}`}
                          >
                            {proposal.riskLevel}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {proposal.teamMembers.slice(0, 3).map(member => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"
                          >
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-700">{member.name}</span>
                          </div>
                        ))}
                        {proposal.teamMembers.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{proposal.teamMembers.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button size="sm" onClick={() => handleViewProposal(proposal.id)}>
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignTeamMember(proposal.id)}
                      >
                        <UsersIcon className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => showToast('Communication center would open')}
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button onClick={loadMoreProposals} variant="secondary">
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Team Assignment Board</h3>
            <p className="mt-2 text-sm text-gray-500">
              Smart contributor suggestions and workload management interface would be implemented
              here.
            </p>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Timeline Visualization</h3>
            <p className="mt-2 text-sm text-gray-500">
              Critical path identification and complexity-based timeline estimation would be
              implemented here.
            </p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Coordination Analytics</h3>
            <p className="mt-2 text-sm text-gray-500">
              Hypothesis H4 and H7 validation metrics and coordination efficiency tracking would be
              implemented here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
