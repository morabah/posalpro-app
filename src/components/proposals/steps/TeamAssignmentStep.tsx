'use client';

/**
 * PosalPro MVP2 - Modern Team Assignment Step
 * Built from scratch using React Query and modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 * Maps to database fields: assignedTo (User[]), team members and roles
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { Label } from '@/components/ui/Label';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug } from '@/lib/logger';
import { ProposalTeamData, useProposalActions } from '@/lib/store/proposalStore';
import { User, userService } from '@/services/userService';
import { CheckIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

// Expertise areas
const EXPERTISE_AREAS = [
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'PRICING', label: 'Pricing' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'OPERATIONS', label: 'Operations' },
];

interface TeamAssignmentStepProps {
  data?: ProposalTeamData;
  onNext: () => void;
  onBack: () => void;
  onUpdate?: (data: ProposalTeamData) => void;
}

export function TeamAssignmentStep({ data, onNext, onBack, onUpdate }: TeamAssignmentStepProps) {
  const analytics = useOptimizedAnalytics();
  const { setStepData } = useProposalActions();

  // Fetch users using React Query with the new service
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['users', 'proposal-wizard'],
    queryFn: async () => {
      console.log('[DEBUG] Fetching users from API...');
      const response = await userService.getUsers({
        search: '',
        limit: 100,
        status: 'ACTIVE',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      console.log('[DEBUG] Users API response:', response);

      if (response.ok && response.data?.users) {
        console.log('[DEBUG] Users loaded successfully:', response.data.users.length);
        console.log(
          '[DEBUG] First user structure:',
          JSON.stringify(response.data.users[0], null, 2)
        );
        return response.data.users;
      }
      throw new Error('Failed to load users');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Filter users by role
  const teamLeads = useMemo(() => {
    if (!usersData) return [];
    const leads = usersData.filter(user =>
      user.roles?.some(userRole => userRole.role?.name === 'Proposal Manager')
    );
    console.log(
      '[DEBUG] Team leads found:',
      leads.length,
      leads.map(u => u.name)
    );
    return leads;
  }, [usersData]);

  const salesReps = useMemo(() => {
    if (!usersData) return [];
    const reps = usersData.filter(user =>
      user.roles?.some(userRole => userRole.role?.name === 'SME')
    );
    console.log(
      '[DEBUG] Sales reps found:',
      reps.length,
      reps.map(u => u.name)
    );
    return reps;
  }, [usersData]);

  const executives = useMemo(() => {
    if (!usersData) return [];
    const execs = usersData.filter(user =>
      user.roles?.some(userRole => userRole.role?.name === 'Executive')
    );
    console.log(
      '[DEBUG] Executives found:',
      execs.length,
      execs.map(u => u.name)
    );
    return execs;
  }, [usersData]);

  // Form data with defaults
  const formData = useMemo(
    () => ({
      teamLead: data?.teamLead || '',
      salesRepresentative: data?.salesRepresentative || '',
      subjectMatterExperts: data?.subjectMatterExperts || {},
      executiveReviewers: data?.executiveReviewers || [],
    }),
    [data]
  );

  // Options for dropdowns
  const teamLeadOptions = useMemo(() => {
    if (!teamLeads.length) return [{ value: '', label: 'No team leads available' }];

    return [
      { value: '', label: 'Select team lead...' },
      ...teamLeads.map(user => ({
        value: user.id,
        label: user.name,
      })),
    ];
  }, [teamLeads]);

  const salesRepOptions = useMemo(() => {
    if (!salesReps.length) return [{ value: '', label: 'No sales representatives available' }];

    return [
      { value: '', label: 'Select sales representative...' },
      ...salesReps.map(user => ({
        value: user.id,
        label: user.name,
      })),
    ];
  }, [salesReps]);

  const smeOptions = useMemo(() => {
    if (!usersData) return [{ value: '', label: 'Loading users...' }];

    // Deduplicate users
    const seenIds = new Set<string>();
    const uniqueUsers: User[] = [];

    [...teamLeads, ...salesReps, ...usersData].forEach(user => {
      if (!seenIds.has(user.id)) {
        seenIds.add(user.id);
        uniqueUsers.push(user);
      }
    });

    return [
      { value: '', label: 'Select SME...' },
      ...uniqueUsers.map(user => ({
        value: user.id,
        label: user.name,
      })),
    ];
  }, [usersData, teamLeads, salesReps]);

  // Handle field changes
  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      const updatedData = {
        ...formData,
        [field]: value,
      };

      setStepData(2, updatedData);

      analytics.trackOptimized('proposal_field_change', {
        field,
        step: 2,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [formData, setStepData, analytics]
  );

  // Handle SME changes
  const handleSMEChange = useCallback(
    (area: string, value: string) => {
      const updatedData = {
        ...formData,
        subjectMatterExperts: {
          ...formData.subjectMatterExperts,
          [area]: value,
        },
      };

      setStepData(2, updatedData);

      analytics.trackOptimized('proposal_sme_assigned', {
        area,
        step: 2,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [formData, setStepData, analytics]
  );

  // Handle executive toggle
  const handleExecutiveToggle = useCallback(
    (executiveId: string) => {
      const updatedData = {
        ...formData,
        executiveReviewers: formData.executiveReviewers.includes(executiveId)
          ? formData.executiveReviewers.filter(id => id !== executiveId)
          : [...formData.executiveReviewers, executiveId],
      };

      setStepData(2, updatedData);

      analytics.trackOptimized('proposal_executive_toggled', {
        executiveId,
        isSelected: !formData.executiveReviewers.includes(executiveId),
        step: 2,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [formData, setStepData, analytics]
  );

  // Handle next step
  const handleNext = useCallback(() => {
    // Update store with current data
    setStepData(2, formData);

    // Debug logging for step payload
    logDebug('Step 2 payload', {
      component: 'TeamAssignmentStep',
      operation: 'next_step',
      stepData: formData,
      teamLead: formData.teamLead,
      salesRepresentative: formData.salesRepresentative,
      subjectMatterExperts: formData.subjectMatterExperts,
      executiveReviewers: formData.executiveReviewers,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    analytics.trackOptimized('proposal_step_completed', {
      step: 2,
      stepName: 'Team Assignment',
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    onNext();
  }, [analytics, onNext, formData, setStepData]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!formData.teamLead) {
      errors.push('Team lead is required');
    }

    if (!formData.salesRepresentative) {
      errors.push('Sales representative is required');
    }

    const smeCount = Object.values(formData.subjectMatterExperts).filter(v => v?.trim()).length;
    if (smeCount === 0) {
      errors.push('At least one subject matter expert is required');
    }

    return errors;
  }, [formData]);

  const canProceed = validationErrors.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Team Assignment</h2>
        <p className="mt-2 text-gray-600">Assign team members and roles for this proposal</p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-800">
            <h4 className="font-medium mb-2">Please fix the following errors:</h4>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* API Errors */}
      {usersError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-800">
            <h4 className="font-medium mb-2">Error loading users:</h4>
            <p>{usersError.message}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Team Lead */}
          <div>
            <Label htmlFor="teamLead" className="text-sm font-medium text-gray-700">
              Team Lead *
            </Label>
            <Select
              id="teamLead"
              options={teamLeadOptions}
              value={formData.teamLead}
              onChange={(value: string | string[]) => {
                const teamLead = Array.isArray(value) ? value[0] : value;
                handleFieldChange('teamLead', teamLead);
              }}
              placeholder="Select team lead..."
              disabled={usersLoading}
            />
          </div>

          {/* Sales Representative */}
          <div>
            <Label htmlFor="salesRepresentative" className="text-sm font-medium text-gray-700">
              Sales Representative *
            </Label>
            <Select
              id="salesRepresentative"
              options={salesRepOptions}
              value={formData.salesRepresentative}
              onChange={(value: string | string[]) => {
                const salesRep = Array.isArray(value) ? value[0] : value;
                handleFieldChange('salesRepresentative', salesRep);
              }}
              placeholder="Select sales representative..."
              disabled={usersLoading}
            />
          </div>
        </div>

        {/* Right Column - Subject Matter Experts */}
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700">Subject Matter Experts *</Label>
            <p className="text-sm text-gray-500 mb-4">
              Assign SMEs for different areas of expertise
            </p>

            <div className="space-y-3">
              {EXPERTISE_AREAS.map(area => (
                <div key={area.value} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      id={`sme-${area.value}`}
                      options={smeOptions}
                      value={formData.subjectMatterExperts[area.value] || ''}
                      onChange={(value: string | string[]) => {
                        const smeId = Array.isArray(value) ? value[0] : value;
                        handleSMEChange(area.value, smeId);
                      }}
                      placeholder={`Select ${area.label} SME...`}
                      disabled={usersLoading}
                    />
                  </div>
                  {formData.subjectMatterExperts[area.value] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSMEChange(area.value, '')}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Reviewers */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Executive Reviewers</Label>
        <p className="text-sm text-gray-500 mb-4">
          Select executives who will review this proposal (optional)
        </p>

        {usersLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading executives...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {executives.map(executive => (
              <div
                key={executive.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.executiveReviewers.includes(executive.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleExecutiveToggle(executive.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{executive.name}</h4>
                    <p className="text-sm text-gray-500">
                      {executive.roles?.map(r => r.role?.name).join(', ') || 'Executive'}
                    </p>
                    {executive.department && (
                      <p className="text-xs text-gray-400">{executive.department}</p>
                    )}
                  </div>
                  {formData.executiveReviewers.includes(executive.id) && (
                    <CheckIcon className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Summary */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <UserGroupIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Team Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Team Lead:</span>
            <div className="font-medium">
              {teamLeads.find(u => u.id === formData.teamLead)?.name || 'Not selected'}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Sales Rep:</span>
            <div className="font-medium">
              {salesReps.find(u => u.id === formData.salesRepresentative)?.name || 'Not selected'}
            </div>
          </div>
          <div>
            <span className="text-gray-600">SMEs:</span>
            <div className="font-medium">
              {Object.values(formData.subjectMatterExperts).filter(v => v?.trim()).length} assigned
            </div>
          </div>
          <div>
            <span className="text-gray-600">Executives:</span>
            <div className="font-medium">{formData.executiveReviewers.length} selected</div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} className="flex items-center gap-2">
          Next Step
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
