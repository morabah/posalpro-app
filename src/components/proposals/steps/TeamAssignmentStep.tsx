'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 2: Team Assignment
 * Based on PROPOSAL_CREATION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H4 hypothesis validation
 */

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { useUser } from '@/hooks/entities/useUser';
import { useResponsive } from '@/hooks/useResponsive';
import { UserType } from '@/types/enums';
import { ExpertiseArea, ProposalWizardStep2Data } from '@/types/proposals';
import { PlusIcon, SparklesIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-4.1'],
  acceptanceCriteria: ['AC-2.2.1', 'AC-2.2.2', 'AC-4.1.2'],
  methods: ['suggestContributors()', 'criticalPath()', 'assignTeamMembers()'],
  hypotheses: ['H4'],
  testCases: ['TC-H4-001'],
};

// Mock data for team members (would come from API in production)
const MOCK_EXECUTIVES = [
  {
    id: '1',
    name: 'David Chen',
    title: 'Chief Technology Officer (CTO)',
    department: 'Technology',
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    title: 'Chief Financial Officer (CFO)',
    department: 'Finance',
  },
  { id: '3', name: 'Robert Kim', title: 'Chief Executive Officer (CEO)', department: 'Executive' },
  { id: '4', name: 'Susan Lee', title: 'Chief Operating Officer (COO)', department: 'Operations' },
];

const MOCK_SME_POOL = {
  [ExpertiseArea.TECHNICAL]: [
    { id: '1', name: 'John Smith', expertise: 'Cloud Architecture', availability: 70 },
    { id: '2', name: 'David Kim', expertise: 'DevOps & Infrastructure', availability: 85 },
    { id: '3', name: 'Rachel Green', expertise: 'Application Development', availability: 60 },
  ],
  [ExpertiseArea.SECURITY]: [
    { id: '4', name: 'Alex Parker', expertise: 'Cybersecurity', availability: 75 },
    { id: '5', name: 'Maria Santos', expertise: 'Compliance & Risk', availability: 90 },
    { id: '6', name: 'James Wilson', expertise: 'Identity Management', availability: 55 },
  ],
  [ExpertiseArea.LEGAL]: [
    { id: '7', name: 'Jennifer Adams', expertise: 'Contract Law', availability: 80 },
    { id: '8', name: 'Robert Taylor', expertise: 'IP & Licensing', availability: 70 },
  ],
  [ExpertiseArea.PRICING]: [
    { id: '9', name: 'Lisa Kim', expertise: 'Financial Modeling', availability: 85 },
    { id: '10', name: 'Tom Brown', expertise: 'Cost Analysis', availability: 75 },
  ],
  [ExpertiseArea.COMPLIANCE]: [
    { id: '11', name: 'Carol Davis', expertise: 'Regulatory Affairs', availability: 90 },
    { id: '12', name: 'Frank Miller', expertise: 'Quality Assurance', availability: 65 },
  ],
  [ExpertiseArea.BUSINESS_ANALYSIS]: [
    { id: '13', name: 'Emma Clark', expertise: 'Business Requirements', availability: 80 },
    { id: '14', name: 'Kevin Lee', expertise: 'Process Analysis', availability: 70 },
  ],
};

// Validation schema for team assignment step
const teamAssignmentSchema = z.object({
  teamLead: z.string().min(1, 'Team lead is required'),
  salesRepresentative: z.string().min(1, 'Sales representative is required'),
  subjectMatterExperts: z
    .record(z.string(), z.string())
    .refine(data => Object.keys(data).length > 0, 'At least one subject matter expert is required'),
  executiveReviewers: z.array(z.string()).min(0),
});

type TeamAssignmentFormData = z.infer<typeof teamAssignmentSchema>;

interface TeamAssignmentStepProps {
  data: Partial<ProposalWizardStep2Data>;
  onUpdate: (data: Partial<ProposalWizardStep2Data>) => void;
  analytics: any;
}

export function TeamAssignmentStep({ data, onUpdate, analytics }: TeamAssignmentStepProps) {
  // ✅ MOBILE OPTIMIZATION: Add responsive detection
  const { isMobile } = useResponsive();

  const [aiSuggestions, setAiSuggestions] = useState<Record<string, any>>({});
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [teamLeads, setTeamLeads] = useState<any[]>([]);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [isLoadingTeamData, setIsLoadingTeamData] = useState(true);
  const [executives, setExecutives] = useState<any[]>([]);
  const { getUsersByRole } = useUser();
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([
    ExpertiseArea.TECHNICAL,
    ExpertiseArea.SECURITY,
    ExpertiseArea.LEGAL,
    ExpertiseArea.PRICING,
  ]);
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);
  const debouncedUpdateRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Keep onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const {
    register,
    setValue,
    control,
    formState: { errors, isValid },
    getValues,
  } = useForm<TeamAssignmentFormData>({
    resolver: zodResolver(teamAssignmentSchema),
    defaultValues: {
      teamLead: data.teamLead || '',
      salesRepresentative: data.salesRepresentative || '',
      subjectMatterExperts: data.subjectMatterExperts || {},
      executiveReviewers: data.executiveReviewers || [],
    },
    // ✅ CRITICAL FIX: Mobile-optimized validation mode
    mode: isMobile ? 'onBlur' : 'onChange',
    reValidateMode: 'onBlur',
    criteriaMode: 'firstError',
  });

  // ✅ PERFORMANCE OPTIMIZATION: Manual form data collection instead of watch()
  const collectFormData = useCallback((): ProposalWizardStep2Data => {
    const currentValues = getValues();
    return {
      teamLead: currentValues.teamLead || '',
      salesRepresentative: currentValues.salesRepresentative || '',
      subjectMatterExperts:
        (currentValues.subjectMatterExperts as Record<ExpertiseArea, string>) || {},
      executiveReviewers: currentValues.executiveReviewers || [],
    };
  }, [getValues]);

  // ✅ PERFORMANCE OPTIMIZATION: Debounced update function
  const debouncedHandleUpdate = useCallback(
    (formattedData: ProposalWizardStep2Data) => {
      // Clear existing timeout
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }

      // Set new timeout with mobile-optimized delay
      const delay = isMobile ? 500 : 300; // Longer delay on mobile for better performance
      debouncedUpdateRef.current = setTimeout(() => {
        const dataHash = JSON.stringify(formattedData);

        // Only update if data has actually changed
        if (dataHash !== lastSentDataRef.current) {
          lastSentDataRef.current = dataHash;
          onUpdateRef.current(formattedData);
        }
      }, delay);
    },
    [isMobile]
  );

  // Track analytics for team assignments
  const trackTeamAssignment = useCallback(
    (memberType: string, memberId: string, suggested: boolean = false) => {
      analytics?.trackWizardStep?.(2, 'Team Assignment', 'team_member_assigned', {
        memberType,
        memberId,
        suggested,
        aiSuggestionAccepted: suggested,
      });
    },
    [analytics]
  );

  // Generate AI suggestions based on proposal context
  const generateAISuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    analytics?.trackWizardStep?.(2, 'Team Assignment', 'ai_suggestions_requested');

    // Simulate AI suggestion generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const suggestions = {
      teamLead: teamLeads[0], // Suggest highest availability
      salesRep: salesReps.find(rep => rep.winRate > 75), // Suggest high win rate
      smes: {
        [ExpertiseArea.TECHNICAL]: MOCK_SME_POOL[ExpertiseArea.TECHNICAL].find(
          sme => sme.availability > 70
        ),
        [ExpertiseArea.SECURITY]: MOCK_SME_POOL[ExpertiseArea.SECURITY].find(
          sme => sme.availability > 70
        ),
      },
      executives: [executives[0]], // Suggest CTO for technical proposals
    };

    setAiSuggestions(suggestions);
    setIsLoadingSuggestions(false);

    analytics?.trackWizardStep?.(2, 'Team Assignment', 'ai_suggestions_generated', {
      suggestionsCount: Object.keys(suggestions).length,
    });
  }, [teamLeads, salesReps, executives, analytics]);

  // Apply AI suggestion
  const applyAISuggestion = useCallback(
    (type: string, value: string) => {
      switch (type) {
        case 'teamLead':
          setValue('teamLead', value);
          trackTeamAssignment('teamLead', value, true);
          break;
        case 'salesRep':
          setValue('salesRepresentative', value);
          trackTeamAssignment('salesRepresentative', value, true);
          break;
        default:
          break;
      }
    },
    [setValue, trackTeamAssignment]
  );

  // Add new expertise area
  const addExpertiseArea = useCallback(
    (area: ExpertiseArea) => {
      if (!expertiseAreas.includes(area)) {
        setExpertiseAreas(prev => [...prev, area]);
        analytics?.trackWizardStep?.(2, 'Team Assignment', 'expertise_area_added', {
          expertiseArea: area,
        });
      }
    },
    [expertiseAreas, analytics]
  );

  // Remove expertise area
  const removeExpertiseArea = useCallback(
    (area: ExpertiseArea) => {
      setExpertiseAreas(prev => prev.filter(a => a !== area));
      // Remove SME assignment for this area
      const currentSMEs = getValues('subjectMatterExperts');
      delete currentSMEs[area];
      setValue('subjectMatterExperts', currentSMEs);
      analytics?.trackWizardStep?.(2, 'Team Assignment', 'expertise_area_removed', {
        expertiseArea: area,
      });
    },
    [getValues, setValue, analytics]
  );

  // Toggle executive reviewer
  const toggleExecutiveReviewer = useCallback(
    (executiveId: string) => {
      const currentReviewers = getValues('executiveReviewers');
      const isSelected = currentReviewers.includes(executiveId);

      if (isSelected) {
        setValue(
          'executiveReviewers',
          currentReviewers.filter(id => id !== executiveId)
        );
      } else {
        setValue('executiveReviewers', [...currentReviewers, executiveId]);
      }

      analytics?.trackWizardStep?.(2, 'Team Assignment', 'executive_reviewer_toggled', {
        executiveId,
        action: isSelected ? 'removed' : 'added',
      });
    },
    [getValues, setValue, analytics]
  );

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setIsLoadingTeamData(true);

        // Fetch managers for team leads and sales reps
        const managers = await getUsersByRole(UserType.PROPOSAL_MANAGER);
        setTeamLeads(managers || []);
        setSalesReps(managers || []); // Using the same pool for now

        // Fetch executives
        const executiveUsers = await getUsersByRole(UserType.EXECUTIVE);
        setExecutives(executiveUsers || []);
      } catch (error) {
        console.error('Error fetching team data:', error);
        // Set empty arrays to prevent undefined errors
        setTeamLeads([]);
        setSalesReps([]);
        setExecutives([]);
      } finally {
        setIsLoadingTeamData(false);
      }
    };

    fetchTeamData();
  }, [getUsersByRole]);

  return (
    <div className="space-y-8">
      {/* AI Suggestions Panel */}
      <Card>
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">AI Team Suggestions</h3>
            </div>
            <Button
              variant="secondary"
              onClick={generateAISuggestions}
              disabled={isLoadingSuggestions}
              loading={isLoadingSuggestions}
              className="flex items-center"
            >
              Get AI Suggestions
            </Button>
          </div>

          {Object.keys(aiSuggestions).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiSuggestions.teamLead && (
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700">Suggested Team Lead:</p>
                  <p className="text-blue-600">{aiSuggestions.teamLead.name}</p>
                  <p className="text-xs text-gray-500">
                    {aiSuggestions.teamLead.availability}% available
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => applyAISuggestion('teamLead', aiSuggestions.teamLead.id)}
                    className="mt-2"
                  >
                    Apply
                  </Button>
                </div>
              )}

              {aiSuggestions.salesRep && (
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700">Suggested Sales Rep:</p>
                  <p className="text-blue-600">{aiSuggestions.salesRep.name}</p>
                  <p className="text-xs text-gray-500">
                    {aiSuggestions.salesRep.winRate}% win rate
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => applyAISuggestion('salesRep', aiSuggestions.salesRep.id)}
                    className="mt-2"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Core Team Assignment */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Proposal Team
          </h3>

          {isLoadingTeamData ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="teamLead" required>
                  Team Lead
                </Label>
                <Select
                  id="teamLead"
                  options={teamLeads.map(lead => ({
                    value: lead.id,
                    label: `${lead.name} (${lead.roles?.map((r: any) => r.name).join(', ') || lead.department || 'No role'})`,
                  }))}
                  error={errors.teamLead?.message}
                  {...register('teamLead')}
                  onChange={(value: string | string[]) => {
                    const stringValue = Array.isArray(value) ? value[0] || '' : value;
                    setValue('teamLead', stringValue);
                    trackTeamAssignment('teamLead', stringValue);
                  }}
                  value={collectFormData().teamLead}
                  placeholder="Select team lead..."
                />
              </div>

              <div>
                <Label htmlFor="salesRepresentative" required>
                  Sales Representative
                </Label>
                <Select
                  id="salesRepresentative"
                  options={salesReps.map(rep => ({
                    value: rep.id,
                    label: `${rep.name} (${rep.roles?.map((r: any) => r.name).join(', ') || rep.department || 'No role'})`,
                  }))}
                  error={errors.salesRepresentative?.message}
                  {...register('salesRepresentative')}
                  onChange={(value: string | string[]) => {
                    const stringValue = Array.isArray(value) ? value[0] || '' : value;
                    setValue('salesRepresentative', stringValue);
                    trackTeamAssignment('salesRepresentative', stringValue);
                  }}
                  value={collectFormData().salesRepresentative}
                  placeholder="Select sales representative..."
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Subject Matter Experts */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Subject Matter Experts</h3>
            <Button
              variant="secondary"
              onClick={() => {
                // Show modal to add expertise area (simplified for now)
                const availableAreas = Object.values(ExpertiseArea).filter(
                  area => !expertiseAreas.includes(area)
                );
                if (availableAreas.length > 0) {
                  addExpertiseArea(availableAreas[0]);
                }
              }}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Expertise
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Expertise</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Assigned SME</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expertiseAreas.map(area => (
                  <tr key={area} className="border-b border-gray-100">
                    <td className="py-3 px-4 capitalize font-medium text-gray-700">
                      {area.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                          <Label htmlFor={`sme-${area}`}>
                            {area}{' '}
                            <span className="text-gray-500">
                              ({(MOCK_SME_POOL[area] || []).length} available)
                            </span>
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExpertiseArea(area)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                        <Controller
                          name={`subjectMatterExperts.${area}`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              id={`sme-${area}`}
                              options={(MOCK_SME_POOL[area] || []).map(sme => ({
                                value: sme.id,
                                label: `${sme.name} (${sme.expertise})`,
                              }))}
                              onChange={field.onChange}
                              value={field.value}
                              placeholder="Select an expert..."
                            />
                          )}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Executive Reviewers */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Executive Reviewers</h3>

          <div className="space-y-3">
            {executives.map(executive => (
              <label key={executive.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  value={executive.id}
                  {...register('executiveReviewers')}
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">{executive.name}</span>
                  <span className="text-gray-600 ml-2">({executive.title})</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isValid ? 'bg-success-600' : 'bg-neutral-300'}`}
          />
          <span className="text-sm text-neutral-600">
            Step 2 of 6: {isValid ? 'Complete' : 'In Progress'}
          </span>
        </div>
        <div className="text-sm text-neutral-600">
          Team size: {Object.keys(collectFormData().subjectMatterExperts).length + 2} members
        </div>
      </div>
    </div>
  );
}
