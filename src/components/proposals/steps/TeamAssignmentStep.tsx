'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 2: Team Assignment
 * Based on PROPOSAL_CREATION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H4 hypothesis validation
 */

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { ExpertiseArea, ProposalWizardStep2Data } from '@/types/proposals';
import { PlusIcon, SparklesIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
const MOCK_TEAM_LEADS = [
  { id: '1', name: 'Mohamed Rabah', role: 'Senior Solution Architect', availability: 80 },
  { id: '2', name: 'Alex Johnson', role: 'Technical Lead', availability: 65 },
  { id: '3', name: 'Sarah Williams', role: 'Project Manager', availability: 90 },
];

const MOCK_SALES_REPS = [
  { id: '1', name: 'Sarah Johnson', role: 'Senior Sales Manager', winRate: 78 },
  { id: '2', name: 'Mike Chen', role: 'Account Executive', winRate: 82 },
  { id: '3', name: 'Lisa Rodriguez', role: 'Business Development', winRate: 71 },
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
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, any>>({});
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([
    ExpertiseArea.TECHNICAL,
    ExpertiseArea.SECURITY,
    ExpertiseArea.LEGAL,
    ExpertiseArea.PRICING,
  ]);
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const {
    register,
    watch,
    setValue,
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
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Stable update function to prevent infinite loops
  const handleUpdate = useCallback((formattedData: ProposalWizardStep2Data) => {
    const dataHash = JSON.stringify(formattedData);

    if (dataHash !== lastSentDataRef.current) {
      lastSentDataRef.current = dataHash;
      onUpdateRef.current(formattedData);
    }
  }, []);

  // Create stable reference for watched values
  const stableWatchedValues = useMemo(() => {
    return {
      teamLead: watchedValues.teamLead || '',
      salesRepresentative: watchedValues.salesRepresentative || '',
      subjectMatterExperts: watchedValues.subjectMatterExperts || {},
      executiveReviewers: watchedValues.executiveReviewers || [],
    };
  }, [
    watchedValues.teamLead,
    watchedValues.salesRepresentative,
    watchedValues.subjectMatterExperts,
    watchedValues.executiveReviewers,
  ]);

  // Update parent component when form data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const formattedData: ProposalWizardStep2Data = {
        teamLead: stableWatchedValues.teamLead,
        salesRepresentative: stableWatchedValues.salesRepresentative,
        subjectMatterExperts: stableWatchedValues.subjectMatterExperts as Record<
          ExpertiseArea,
          string
        >,
        executiveReviewers: stableWatchedValues.executiveReviewers,
      };

      handleUpdate(formattedData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [stableWatchedValues, handleUpdate]);

  // Track analytics for team assignments
  const trackTeamAssignment = useCallback(
    (memberType: string, memberId: string, suggested: boolean = false) => {
      analytics.trackWizardStep(2, 'Team Assignment', 'team_member_assigned', {
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
    analytics.trackWizardStep(2, 'Team Assignment', 'ai_suggestions_requested');

    // Simulate AI suggestion generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const suggestions = {
      teamLead: MOCK_TEAM_LEADS[0], // Suggest highest availability
      salesRep: MOCK_SALES_REPS.find(rep => rep.winRate > 75), // Suggest high win rate
      smes: {
        [ExpertiseArea.TECHNICAL]: MOCK_SME_POOL[ExpertiseArea.TECHNICAL].find(
          sme => sme.availability > 70
        ),
        [ExpertiseArea.SECURITY]: MOCK_SME_POOL[ExpertiseArea.SECURITY].find(
          sme => sme.availability > 70
        ),
      },
      executives: [MOCK_EXECUTIVES[0]], // Suggest CTO for technical proposals
    };

    setAiSuggestions(suggestions);
    setIsLoadingSuggestions(false);

    analytics.trackWizardStep(2, 'Team Assignment', 'ai_suggestions_generated', {
      suggestionsCount: Object.keys(suggestions).length,
    });
  }, [analytics]);

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
        analytics.trackWizardStep(2, 'Team Assignment', 'expertise_area_added', {
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
      analytics.trackWizardStep(2, 'Team Assignment', 'expertise_area_removed', {
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

      analytics.trackWizardStep(2, 'Team Assignment', 'executive_reviewer_toggled', {
        executiveId,
        action: isSelected ? 'removed' : 'added',
      });
    },
    [getValues, setValue, analytics]
  );

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="teamLead" required>
                Team Lead
              </Label>
              <Select
                id="teamLead"
                options={MOCK_TEAM_LEADS.map(lead => ({
                  value: lead.id,
                  label: `${lead.name} (${lead.availability}% available)`,
                }))}
                error={errors.teamLead?.message}
                {...register('teamLead')}
                onChange={(value: string) => {
                  setValue('teamLead', value);
                  trackTeamAssignment('teamLead', value);
                }}
              />
            </div>

            <div>
              <Label htmlFor="salesRepresentative" required>
                Sales Representative
              </Label>
              <Select
                id="salesRepresentative"
                options={MOCK_SALES_REPS.map(rep => ({
                  value: rep.id,
                  label: `${rep.name} (${rep.winRate}% win rate)`,
                }))}
                error={errors.salesRepresentative?.message}
                {...register('salesRepresentative')}
                onChange={(value: string) => {
                  setValue('salesRepresentative', value);
                  trackTeamAssignment('salesRepresentative', value);
                }}
              />
            </div>
          </div>
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
                      <Select
                        options={[
                          { value: '', label: 'Select SME...' },
                          ...(MOCK_SME_POOL[area] || []).map(sme => ({
                            value: sme.id,
                            label: `${sme.name} - ${sme.expertise} (${sme.availability}% available)`,
                          })),
                        ]}
                        {...register(`subjectMatterExperts.${area}`)}
                        onChange={(value: string) => {
                          setValue(`subjectMatterExperts.${area}`, value);
                          if (value) {
                            trackTeamAssignment('sme', value);
                          }
                        }}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => removeExpertiseArea(area)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
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
            {MOCK_EXECUTIVES.map(executive => (
              <label key={executive.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={watchedValues.executiveReviewers?.includes(executive.id)}
                  onChange={() => toggleExecutiveReviewer(executive.id)}
                  className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div>
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
          Team size: {Object.keys(stableWatchedValues.subjectMatterExperts).length + 2} members
        </div>
      </div>
    </div>
  );
}
