'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 2: Team Assignment
 * Based on PROPOSAL_CREATION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H4 hypothesis validation
 * ✅ PERFORMANCE OPTIMIZED: Cached user data, memoized computations, debounced updates
 */

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { useApiClient } from '@/hooks/useApiClient';
import { useResponsive } from '@/hooks/useResponsive';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { UserType } from '@/types/enums';
import { ExpertiseArea, ProposalWizardStep2Data } from '@/types/proposals';
import { PlusIcon, SparklesIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// User interface for dropdowns (simplified)
interface User {
  id: string;
  name: string;
  email?: string;
  department?: string;
  roles?: Array<{ name: string }>;
}

// Removed mock data to comply with project rules. All data comes from API responses.

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
  analytics: {
    trackWizardStep?: (
      stepNumber: number,
      stepName: string,
      action: string,
      metadata?: Record<string, unknown>
    ) => void;
  };
}

export function TeamAssignmentStep({ data, onUpdate, analytics }: TeamAssignmentStepProps) {
  // ✅ MOBILE OPTIMIZATION: Add responsive detection
  const { isMobile } = useResponsive();

  // ✅ SIMPLIFIED: Use apiClient like customer selection
  const apiClient = useApiClient();

  const [aiSuggestions, setAiSuggestions] = useState<Record<string, any>>({});
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [teamLeads, setTeamLeads] = useState<User[]>([]);
  const [salesReps, setSalesReps] = useState<User[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingTeamData, setIsLoadingTeamData] = useState(false);
  const [teamDataError, setTeamDataError] = useState<string | null>(null);
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([
    ExpertiseArea.TECHNICAL,
    ExpertiseArea.SECURITY,
    ExpertiseArea.LEGAL,
    ExpertiseArea.PRICING,
  ]);
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);
  const debouncedUpdateRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Normalize various stored SME representations to a clean userId
  const normalizeUserId = useCallback((raw: unknown): string => {
    if (!raw) return '';
    const v = String(raw).trim();
    const uuid = v.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuid) return uuid[0];
    const cuid = v.match(/c[a-z0-9]{8,}/i);
    if (cuid) return cuid[0];
    if (v.toLowerCase().startsWith('user')) {
      const last = v.split(/\s|:/).filter(Boolean).pop();
      return last || '';
    }
    return v;
  }, []);

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

  // ✅ HYDRATION: When `data` changes (edit mode), reflect it into the form
  useEffect(() => {
    if (data) {
      console.log('[TeamAssignmentStep] Hydrating data:', data);
      console.log('[TeamAssignmentStep] Raw subjectMatterExperts:', data.subjectMatterExperts);
      console.log(
        '[TeamAssignmentStep] typeof subjectMatterExperts:',
        typeof data.subjectMatterExperts
      );
      console.log(
        '[TeamAssignmentStep] JSON.stringify subjectMatterExperts:',
        JSON.stringify(data.subjectMatterExperts)
      );

      if (data.teamLead) setValue('teamLead', normalizeUserId(data.teamLead));
      if (data.salesRepresentative)
        setValue('salesRepresentative', normalizeUserId(data.salesRepresentative));
      if (data.subjectMatterExperts) {
        // Create a deep copy to prevent reference issues
        const smeData = JSON.parse(JSON.stringify(data.subjectMatterExperts));
        console.log('[TeamAssignmentStep] Deep copied SMEs:', smeData);
        const entries = Object.entries(smeData as Record<string, string>);
        console.log('[TeamAssignmentStep] SME entries:', entries);
        // Set the full object for completeness
        const normalized = Object.fromEntries(entries.map(([k, v]) => [k, normalizeUserId(v)]));
        console.log('[TeamAssignmentStep] Normalized SMEs:', normalized);
        setValue('subjectMatterExperts', normalized as any, { shouldValidate: false });
        // Also set each nested path explicitly to ensure RHF field registration picks them up
        entries.forEach(([k, v]) => {
          const id = normalizeUserId(v);
          console.log(`[TeamAssignmentStep] Setting subjectMatterExperts.${k} = ${id}`);
          setValue(`subjectMatterExperts.${k}` as any, id, { shouldValidate: false });
        });
        // Ensure all expertise areas present
        const areas = Object.keys(normalized) as ExpertiseArea[];
        setExpertiseAreas(prev => Array.from(new Set([...prev, ...areas])) as ExpertiseArea[]);
      }
      if (data.executiveReviewers) setValue('executiveReviewers', data.executiveReviewers as any);
    }
  }, [data, setValue, normalizeUserId]);

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

  // ✅ SIMPLIFIED: Fetch team data on component mount (like customer selection)
  useEffect(() => {
    const fetchTeamData = async () => {
      setIsLoadingTeamData(true);
      setTeamDataError(null);
      try {
        console.log('[TeamAssignmentStep] 🚀 Fetching team data via apiClient...');

        // Fetch both user types in parallel using apiClient like customer selection
        const [managersResponse, executivesResponse, allUsersResponse] = await Promise.all([
          apiClient.get<any>(`users?role=${UserType.PROPOSAL_MANAGER}`),
          apiClient.get<any>(`users?role=${UserType.EXECUTIVE}`),
          apiClient.get<any>(`users`),
        ]);

        console.log('[TeamAssignmentStep] ✅ Managers response:', managersResponse);
        console.log('[TeamAssignmentStep] ✅ Executives response:', executivesResponse);

        // Handle response structure like customer selection
        const managers =
          managersResponse.success
            ? managersResponse.data.users || managersResponse.data || []
            : [];

        const executives =
          executivesResponse.success
            ? executivesResponse.data.users || executivesResponse.data || []
            : [];

        const all =
          allUsersResponse && (allUsersResponse.success ?? true)
            ? allUsersResponse.data?.users || allUsersResponse.data || []
            : [];

        console.log('[TeamAssignmentStep] ✅ Setting data:', {
          managers: managers.length,
          executives: executives.length,
        });

        setTeamLeads(managers);
        setSalesReps(managers); // Same users for both roles
        setExecutives(executives);
        setAllUsers(all);

        // Reconcile preloaded SMEs after options load
        try {
          const current = getValues();
          const smes = (current.subjectMatterExperts as Record<string, string>) || {};
          let changed = false;
          const normalized: Record<string, string> = {};
          for (const [area, val] of Object.entries(smes)) {
            const id = normalizeUserId(val);
            normalized[area] = id;
            if (id !== val) changed = true;
          }
          if (changed) {
            setValue('subjectMatterExperts', normalized as any, { shouldValidate: false });
            debouncedHandleUpdate(collectFormData());
          }
        } catch {}

        analytics?.trackWizardStep?.(2, 'Team Assignment', 'team_data_loaded', {
          managersCount: managers.length,
          executivesCount: executives.length,
          allUsersCount: all.length,
          source: 'api_client',
        });
      } catch (error) {
        // ✅ ENHANCED: Use proper logger instead of console.error
        const errorHandlingService = ErrorHandlingService.getInstance();
        const standardError = errorHandlingService.processError(
          error,
          'Failed to fetch team data',
          ErrorCodes.DATA.QUERY_FAILED,
          {
            component: 'TeamAssignmentStep',
            operation: 'fetchTeamData',
            proposalId: 'unknown', // Team assignment step doesn't have proposal ID yet
          }
        );

        logError('Error fetching team data', error, {
          component: 'TeamAssignmentStep',
          operation: 'fetchTeamData',
          proposalId: 'unknown',
          standardError: standardError.message,
          errorCode: standardError.code,
        });

        setTeamLeads([]);
        setSalesReps([]);
        setExecutives([]);

        // Error handling like customer selection
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            setTeamDataError('Please log in to access team data.');
          } else if (error.message.includes('404')) {
            setTeamDataError('User service is temporarily unavailable.');
          } else if (error.message.includes('500')) {
            setTeamDataError('Server error. Please try again in a few moments.');
          } else {
            setTeamDataError(
              'Unable to load team members. Please check your connection and try again.'
            );
          }
        } else {
          setTeamDataError('An unexpected error occurred. Please try again.');
        }

        analytics?.trackWizardStep?.(2, 'Team Assignment', 'team_data_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setIsLoadingTeamData(false);
      }
    };

    fetchTeamData();
  }, [apiClient, analytics]); // Simple dependency like customer selection

  // ✅ PERFORMANCE OPTIMIZATION: Cleanup on unmount with final flush
  useEffect(() => {
    return () => {
      // If a debounced update is pending, flush the latest values before unmount
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
        const latest = collectFormData();
        const dataHash = JSON.stringify(latest);
        if (dataHash !== lastSentDataRef.current) {
          lastSentDataRef.current = dataHash;
          onUpdateRef.current(latest);
        }
      }
    };
  }, [collectFormData]);

  // ✅ PERFORMANCE OPTIMIZATION: Memoized team data options
  const teamLeadOptions = useMemo(() => {
    return teamLeads.map(lead => ({
      value: lead.id,
      label: `${lead.name} (${lead.roles?.map((r: any) => r.name).join(', ') || lead.department || 'No role'})`,
    }));
  }, [teamLeads]);

  const salesRepOptions = useMemo(() => {
    return salesReps.map(rep => ({
      value: rep.id,
      label: `${rep.name} (${rep.roles?.map((r: any) => r.name).join(', ') || rep.department || 'No role'})`,
    }));
  }, [salesReps]);

  // ✅ FIX: Deduplicate SME options to avoid duplicate React keys
  const smeOptions = useMemo(() => {
    const combinedUsers: User[] = [...teamLeads, ...salesReps, ...executives, ...allUsers];
    const idToUser = new Map<string, User>();
    for (const u of combinedUsers) {
      if (!idToUser.has(u.id)) idToUser.set(u.id, u);
    }

    const baseOptions = Array.from(idToUser.values()).map(user => ({
      value: String(user.id),
      label: `${user.name}${user.department ? ` - ${user.department}` : ''}`,
    }));

    // Ensure currently assigned SME ids always appear as options (even if user not in fetched lists yet)
    const ensureAssignedOptions = (): Array<{ value: string; label: string }> => {
      try {
        const current = getValues();
        const currentSmes = (current.subjectMatterExperts as Record<string, string>) || {};
        const fromData = (data?.subjectMatterExperts as unknown as Record<string, string>) || {};
        const values = new Set<string>();
        Object.values(currentSmes).forEach(v => {
          const id = normalizeUserId(v);
          if (id) values.add(id);
        });
        Object.values(fromData).forEach(v => {
          const id = normalizeUserId(v);
          if (id) values.add(id);
        });

        const extras: Array<{ value: string; label: string }> = [];
        for (const id of values) {
          // Skip if already present in base options
          if (idToUser.has(id)) continue;
          const fallbackUser = combinedUsers.find(u => u.id === id);
          const label = fallbackUser
            ? `${fallbackUser.name}${fallbackUser.department ? ` - ${fallbackUser.department}` : ''}`
            : id;
          extras.push({ value: id, label });
        }
        return extras;
      } catch {
        return [];
      }
    };

    return [...baseOptions, ...ensureAssignedOptions()];
  }, [teamLeads, salesReps, executives, allUsers, getValues, data, normalizeUserId]);

  // After options are loaded, resolve SME values that might be names into actual userIds
  useEffect(() => {
    const combined: User[] = [...teamLeads, ...salesReps, ...executives, ...allUsers];
    if (combined.length === 0) return;
    try {
      const current = getValues();
      const currentSMEs = (current.subjectMatterExperts as Record<string, string>) || {};
      let changed = false;
      const resolved: Record<string, string> = {};
      Object.entries(currentSMEs).forEach(([area, val]) => {
        let v = normalizeUserId(val);
        if (!combined.some(u => u.id === v) && v) {
          const lower = v.toLowerCase();
          const match = combined.find(u => u.name?.toLowerCase().includes(lower));
          if (match) v = match.id;
        }
        resolved[area] = v;
        if (v !== val) changed = true;
      });
      if (changed) {
        setValue('subjectMatterExperts', resolved as any, { shouldValidate: false });
        debouncedHandleUpdate(collectFormData());
      }
      // Ensure rows exist for all areas present in data
      const areas = Object.keys(currentSMEs) as ExpertiseArea[];
      if (areas.length) {
        setExpertiseAreas(prev => Array.from(new Set([...prev, ...areas])) as ExpertiseArea[]);
      }
    } catch {}
  }, [
    teamLeads,
    salesReps,
    executives,
    allUsers,
    getValues,
    setValue,
    debouncedHandleUpdate,
    collectFormData,
    normalizeUserId,
  ]);

  // Generate AI suggestions based on proposal context
  const generateAISuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    analytics?.trackWizardStep?.(2, 'Team Assignment', 'ai_suggestions_requested');

    // Simulate AI suggestion generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const suggestions = {
      teamLead: teamLeads[0],
      salesRep: salesReps[0],
      smes: {
        [ExpertiseArea.TECHNICAL]: teamLeads[1] || salesReps[1] || null,
        [ExpertiseArea.SECURITY]: teamLeads[2] || salesReps[2] || null,
      },
      executives: executives.slice(0, 1),
    } as const;

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

  // Add expertise area
  const addExpertiseArea = useCallback((area: ExpertiseArea) => {
    setExpertiseAreas(prev => [...prev, area]);
  }, []);

  // Remove expertise area
  const removeExpertiseArea = useCallback(
    (area: ExpertiseArea) => {
      setExpertiseAreas(prev => prev.filter(a => a !== area));
      // Clear the SME assignment for this area
      setValue(`subjectMatterExperts.${area}`, '');
    },
    [setValue]
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
                    {aiSuggestions.salesRep.department || 'Sales Department'}
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
              <p className="ml-3 text-gray-600">Loading team members...</p>
            </div>
          ) : teamDataError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800" role="alert">
                {teamDataError}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="teamLead" required>
                  Team Lead
                </Label>
                <Controller
                  name="teamLead"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="teamLead"
                      options={teamLeadOptions}
                      error={errors.teamLead?.message}
                      value={field.value || ''}
                      onChange={(value: string | string[]) => {
                        const stringValue = Array.isArray(value) ? value[0] || '' : value;
                        field.onChange(stringValue);
                        trackTeamAssignment('teamLead', stringValue);
                        debouncedHandleUpdate(collectFormData());
                      }}
                      placeholder="Select team lead..."
                    />
                  )}
                />
              </div>

              <div>
                <Label htmlFor="salesRepresentative" required>
                  Sales Representative
                </Label>
                <Controller
                  name="salesRepresentative"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="salesRepresentative"
                      options={salesRepOptions}
                      error={errors.salesRepresentative?.message}
                      value={field.value || ''}
                      onChange={(value: string | string[]) => {
                        const stringValue = Array.isArray(value) ? value[0] || '' : value;
                        field.onChange(stringValue);
                        trackTeamAssignment('salesRepresentative', stringValue);
                        debouncedHandleUpdate(collectFormData());
                      }}
                      placeholder="Select sales representative..."
                    />
                  )}
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

          {isLoadingTeamData ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-600">Loading subject matter experts...</p>
            </div>
          ) : teamDataError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800" role="alert">
                {teamDataError}
              </p>
            </div>
          ) : (
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
                              {area} <span className="text-gray-500">&nbsp;</span>
                            </Label>
                          </div>

                          <Controller
                            name={`subjectMatterExperts.${area}` as any}
                            control={control}
                            render={({ field }) => {
                              const fieldValue = String(
                                (field.value as string) ||
                                  normalizeUserId((data.subjectMatterExperts as any)?.[area]) ||
                                  ''
                              ).trim();
                              console.log(
                                `[SME Debug] ${area}: field.value=${field.value}, data=${(data.subjectMatterExperts as any)?.[area]}, normalized=${fieldValue}`
                              );
                              return (
                                <Select
                                  id={`sme-${area}`}
                                  options={smeOptions}
                                  value={fieldValue}
                                  onChange={(value: string | string[]) => {
                                    const stringValue = Array.isArray(value)
                                      ? value[0] || ''
                                      : value;
                                    field.onChange(stringValue);
                                    trackTeamAssignment('sme', stringValue);
                                    debouncedHandleUpdate(collectFormData());
                                  }}
                                  placeholder={`Select ${area.replace('_', ' ')} expert...`}
                                />
                              );
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpertiseArea(area)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Executive Reviewers */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Executive Reviewers</h3>
          <p className="text-gray-600 mb-4">
            Select executives who will review this proposal (optional)
          </p>

          {isLoadingTeamData ? (
            <div className="flex justify-center items-center h-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {executives.map(executive => (
                <div key={executive.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{executive.name}</h4>
                      <p className="text-sm text-gray-500">
                        {executive.roles?.map((r: any) => r.name).join(', ') ||
                          executive.department ||
                          'Executive'}
                      </p>
                    </div>
                    <Controller
                      name="executiveReviewers"
                      control={control}
                      render={({ field }) => {
                        const isSelected = (field.value || []).includes(executive.id);
                        return (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              const currentValue = field.value || [];
                              if (e.target.checked) {
                                field.onChange([...currentValue, executive.id]);
                              } else {
                                field.onChange(
                                  currentValue.filter((id: string) => id !== executive.id)
                                );
                              }
                              trackTeamAssignment('executive', executive.id, false);
                              // Ensure wizard step data is updated
                              debouncedHandleUpdate(collectFormData());
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
