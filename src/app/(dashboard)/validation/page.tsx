/**
 * PosalPro MVP2 - Validation Dashboard Page
 * Based on VALIDATION_DASHBOARD_SCREEN.md wireframe specifications
 * Integrates ValidationDashboard component with routing and navigation
 */

'use client';

import { ValidationDashboard as ValidationDashboardComponent } from '@/components/validation/ValidationDashboard';
import { ValidationIssue } from '@/types/validation';
import { useRouter } from 'next/navigation';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: ['AC-3.1.1', 'AC-3.1.3', 'AC-3.2.1', 'AC-3.2.4', 'AC-3.3.1', 'AC-3.3.3'],
  methods: [
    'validateConfiguration()',
    'trackValidationMetrics()',
    'generateReports()',
    'manageValidationRules()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

export default function ValidationDashboard() {
  const router = useRouter();

  // Handle issue selection - navigate to proposal with issue context
  const handleIssueSelect = (issue: ValidationIssue) => {
    const proposalId = issue.context?.proposalId;
    if (proposalId) {
      router.push(`/dashboard/proposals/${proposalId}?section=validation&issue=${issue.id}`);
    }
  };

  // Handle proposal navigation
  const handleNavigateToProposal = (proposalId: string) => {
    router.push(`/dashboard/proposals/${proposalId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ValidationDashboardComponent
          showMonitor={true}
          showAnalytics={true}
          onIssueSelect={handleIssueSelect}
          onNavigateToProposal={handleNavigateToProposal}
        />
      </div>
    </div>
  );
}
