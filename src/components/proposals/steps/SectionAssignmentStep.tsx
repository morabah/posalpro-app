'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 5: Section Assignment
 * Based on PROPOSAL_CREATION_SCREEN.md and COORDINATION_HUB_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H4 & H7 hypothesis validation
 */

import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { SystemUser, useUsers } from '@/hooks/admin/useAdminData';
import { useResponsive } from '@/hooks/useResponsive';
import { debounce } from '@/lib/utils';
import { ProposalWizardStep5Data } from '@/lib/validation/schemas/proposal';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-4.1'],
  acceptanceCriteria: ['AC-2.2.1', 'AC-2.2.2', 'AC-4.1.1', 'AC-4.1.2'],
  methods: ['assignSections()', 'estimateTimeline()', 'balanceWorkload()'],
  hypotheses: ['H4', 'H7'],
  testCases: ['TC-H4-001', 'TC-H7-001'],
};

// Section interface for the component
interface ProposalSection {
  id: string;
  title: string;
  required: boolean;
  order: number;
  estimatedHours: number;
  dueDate?: Date;
  assignedTo?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'reviewed';
  description?: string;
  dependencies: string[];
  priority: 'high' | 'medium' | 'low';
  contentItems?: number; // Number of content items from Step 3
}

// Default proposal sections based on common proposal structure
const DEFAULT_PROPOSAL_SECTIONS: ProposalSection[] = [
  {
    id: '1',
    title: 'Executive Summary',
    required: true,
    order: 1,
    estimatedHours: 8,
    status: 'not_started',
    description: 'High-level overview of the proposal and value proposition',
    dependencies: [],
    priority: 'high',
    contentItems: 0,
  },
  {
    id: '2',
    title: 'Understanding & Requirements',
    required: true,
    order: 2,
    estimatedHours: 12,
    status: 'not_started',
    description: 'Analysis of client requirements and our understanding',
    dependencies: [],
    priority: 'high',
    contentItems: 0,
  },
  {
    id: '3',
    title: 'Technical Approach',
    required: true,
    order: 3,
    estimatedHours: 20,
    status: 'not_started',
    description: 'Detailed technical solution and methodology',
    dependencies: ['2'],
    priority: 'high',
    contentItems: 0,
  },
  {
    id: '4',
    title: 'Implementation Plan',
    required: true,
    order: 4,
    estimatedHours: 16,
    status: 'not_started',
    description: 'Project phases, timeline, and delivery approach',
    dependencies: ['3'],
    priority: 'high',
    contentItems: 0,
  },
  {
    id: '5',
    title: 'Team & Resources',
    required: true,
    order: 5,
    estimatedHours: 10,
    status: 'not_started',
    description: 'Team composition, roles, and resource allocation',
    dependencies: [],
    priority: 'medium',
    contentItems: 0,
  },
  {
    id: '6',
    title: 'Security & Compliance',
    required: false,
    order: 6,
    estimatedHours: 14,
    status: 'not_started',
    description: 'Security measures and compliance requirements',
    dependencies: ['3'],
    priority: 'medium',
    contentItems: 0,
  },
  {
    id: '7',
    title: 'Pricing & Commercial Terms',
    required: true,
    order: 7,
    estimatedHours: 12,
    status: 'not_started',
    description: 'Cost breakdown, pricing model, and commercial terms',
    dependencies: ['4'],
    priority: 'high',
    contentItems: 0,
  },
  {
    id: '8',
    title: 'Risk Management',
    required: false,
    order: 8,
    estimatedHours: 8,
    status: 'not_started',
    description: 'Risk assessment, mitigation strategies, and contingencies',
    dependencies: ['3', '4'],
    priority: 'medium',
    contentItems: 0,
  },
  {
    id: '9',
    title: 'Quality Assurance',
    required: false,
    order: 9,
    estimatedHours: 6,
    status: 'not_started',
    description: 'Quality control measures and testing procedures',
    dependencies: ['3'],
    priority: 'low',
    contentItems: 0,
  },
  {
    id: '10',
    title: 'Appendices',
    required: false,
    order: 10,
    estimatedHours: 4,
    status: 'not_started',
    description: 'Supporting documentation and additional materials',
    dependencies: [],
    priority: 'low',
    contentItems: 0,
  },
];

// Validation schema for section assignment step
const sectionAssignmentSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().min(1, 'Section ID is required'),
      assignedTo: z.string().optional(),
      estimatedHours: z.number().min(0, 'Estimated hours must be positive'),
      dueDate: z.date().optional(),
      priority: z.enum(['high', 'medium', 'low']),
    })
  ),
});

type SectionAssignmentFormData = z.infer<typeof sectionAssignmentSchema>;

interface SectionAssignmentStepProps {
  data: Partial<ProposalWizardStep5Data>;
  onUpdate: (data: Partial<ProposalWizardStep5Data>) => void;
  analytics: any;
}

export function SectionAssignmentStep({ data, onUpdate, analytics }: SectionAssignmentStepProps) {
  // ✅ MOBILE RESPONSIVENESS: Add responsive detection
  const { isMobile } = useResponsive();

  // State for sections and analytics
  const [sections, setSections] = useState<ProposalSection[]>(DEFAULT_PROPOSAL_SECTIONS);
  const [timelineView, setTimelineView] = useState<'table' | 'gantt'>('table');
  const { users, loading: isLoadingUsers, error: usersError } = useUsers();
  const onUpdateRef = useRef(onUpdate);
  const lastSentDataRef = useRef<string>('');

  // Update ref when onUpdate changes
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // ✅ PERFORMANCE FIX: Mobile-optimized form configuration
  const {
    control,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<SectionAssignmentFormData>({
    resolver: zodResolver(sectionAssignmentSchema),
    // ✅ CRITICAL FIX: Mobile-optimized validation mode
    mode: isMobile ? 'onBlur' : 'onChange',
    reValidateMode: 'onBlur',
    criteriaMode: 'firstError',
    defaultValues: {
      sections: sections.map(section => ({
        id: section.id,
        assignedTo: section.assignedTo || '',
        estimatedHours: section.estimatedHours,
        dueDate: section.dueDate,
        priority: section.priority,
      })),
    },
  });

  const teamMemberOptions = useMemo(() => {
    if (!users) return [];
    return users.map((user: SystemUser) => ({
      value: user.id,
      label: `${user.name} (${user.role})`,
    }));
  }, [users]);

  // ✅ PERFORMANCE OPTIMIZATION: Manual form data collection instead of watch()
  const collectFormData = useCallback(() => {
    const currentValues = getValues();
    return {
      sections: currentValues.sections,
    };
  }, [getValues]);

  // ✅ MOBILE OPTIMIZATION: Debounced updates with mobile-aware delays
  const debouncedOnUpdate = useCallback(
    debounce(
      (formData: SectionAssignmentFormData) => {
        const currentJson = JSON.stringify(formData);
        if (currentJson !== lastSentDataRef.current) {
          // Reconstruct the full section object to satisfy the onUpdate type
          const updatedSections = formData.sections.map(formSection => {
            const originalSection = sections.find(s => s.id === formSection.id);
            return {
              ...originalSection,
              ...formSection,
            };
          });

          onUpdateRef.current({ sections: updatedSections as ProposalSection[] });
          lastSentDataRef.current = currentJson;

          // Analytics tracking with mobile context
          if (analytics?.trackWizardStep) {
            analytics.trackWizardStep(5, 'Section Assignment', 'section_assignment_updated', {
              component: 'SectionAssignmentStep',
              ...COMPONENT_MAPPING,
              hypothesisId: ['H4', 'H7'],
              metadata: {
                totalSections: formData.sections.length,
                assignedSections: formData.sections.filter(s => s.assignedTo).length,
                isMobile,
              },
            });
          }
        }
      },
      isMobile ? 500 : 300
    ), // Mobile-aware delay
    [analytics, sections, isMobile]
  );

  // ✅ MOBILE-OPTIMIZED: Field change handler with debouncing
  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      // Set new timeout with mobile-optimized delay
      const delay = isMobile ? 500 : 300;

      setTimeout(() => {
        const formData = collectFormData();
        debouncedOnUpdate(formData);
      }, delay);
    },
    [collectFormData, debouncedOnUpdate, isMobile]
  );

  // Initialize sections from props
  useEffect(() => {
    if (data.sections && data.sections.length > 0) {
      // Map the incoming sections to match our ProposalSection interface
      const mappedSections = data.sections.map(section => ({
        ...section,
        dependencies: section.dependencies || [],
      }));
      setSections(mappedSections);
    }
  }, [data.sections]);

  // Calculate critical path based on dependencies and hours
  const calculateCriticalPath = useCallback((sectionList: ProposalSection[]): string[] => {
    // Simplified critical path calculation based on dependencies and hours
    return sectionList
      .filter(section => section.required && section.estimatedHours > 10)
      .sort((a, b) => b.estimatedHours - a.estimatedHours)
      .slice(0, 4)
      .map(section => section.id);
  }, []);

  // Calculate project complexity
  const calculateComplexity = useCallback(
    (sectionList: ProposalSection[]): 'low' | 'medium' | 'high' => {
      const totalHours = sectionList.reduce((total, section) => total + section.estimatedHours, 0);
      const requiredSections = sectionList.filter(section => section.required).length;
      const highPrioritySections = sectionList.filter(
        section => section.priority === 'high'
      ).length;

      if (totalHours > 100 || requiredSections > 6 || highPrioritySections > 4) {
        return 'high';
      } else if (totalHours > 60 || requiredSections > 4 || highPrioritySections > 2) {
        return 'medium';
      }
      return 'low';
    },
    []
  );

  // Identify risk factors
  const identifyRiskFactors = useCallback(
    (sectionList: ProposalSection[]): string[] => {
      const risks: string[] = [];
      const unassignedRequired = sectionList.filter(
        section => section.required && !section.assignedTo
      );
      const overloadedMembers = getOverloadedMembers(sectionList);

      if (unassignedRequired.length > 0) {
        risks.push(`${unassignedRequired.length} required sections unassigned`);
      }
      if (overloadedMembers.length > 0) {
        risks.push(`${overloadedMembers.length} team members overloaded`);
      }
      if (sections.filter(s => s.dependencies.length > 2).length > 0) {
        risks.push('Complex dependency chain identified');
      }

      return risks;
    },
    [sections]
  );

  // Get overloaded team members
  const getOverloadedMembers = useCallback((sectionList: ProposalSection[]): string[] => {
    const memberWorkload: Record<string, number> = {};

    sectionList.forEach(section => {
      if (section.assignedTo) {
        memberWorkload[section.assignedTo] =
          (memberWorkload[section.assignedTo] || 0) + section.estimatedHours;
      }
    });

    return Object.entries(memberWorkload)
      .filter(([_, hours]) => hours > 40) // More than 40 hours considered overloaded
      .map(([memberId, _]) => memberId);
  }, []);

  // Track analytics for section assignment
  const trackSectionAssignment = useCallback(
    (action: string, sectionId: string, metadata: any = {}) => {
      analytics?.trackWizardStep?.(5, 'Section Assignment', action, {
        sectionId,
        totalSections: sections.length,
        assignedSections: sections.filter(s => s.assignedTo).length,
        totalHours: sections.reduce((total, s) => total + s.estimatedHours, 0),
        ...metadata,
      });
    },
    [analytics, sections]
  );

  // Update section assignment
  const updateSectionAssignment = useCallback(
    (sectionId: string, key: string, value: any) => {
      setSections(prev =>
        prev.map(section => (section.id === sectionId ? { ...section, [key]: value } : section))
      );

      trackSectionAssignment('section_updated', sectionId, { field: key, value });
    },
    [trackSectionAssignment]
  );

  const updateMultipleAssignments = (
    assignments: Array<{ sectionId: string; assignedTo: string }>
  ) => {
    setSections(prev =>
      prev.map(section => {
        const assignment = assignments.find(a => a.sectionId === section.id);
        return assignment ? { ...section, assignedTo: assignment.assignedTo } : section;
      })
    );
  };

  // Move section up/down
  const moveSectionOrder = useCallback(
    (sectionId: string, direction: 'up' | 'down') => {
      setSections(prev => {
        const newSections = [...prev];
        const index = newSections.findIndex(s => s.id === sectionId);

        if (direction === 'up' && index > 0) {
          [newSections[index], newSections[index - 1]] = [
            newSections[index - 1],
            newSections[index],
          ];
          newSections[index].order = index + 1;
          newSections[index - 1].order = index;
        } else if (direction === 'down' && index < newSections.length - 1) {
          [newSections[index], newSections[index + 1]] = [
            newSections[index + 1],
            newSections[index],
          ];
          newSections[index].order = index + 1;
          newSections[index + 1].order = index + 2;
        }

        return newSections;
      });

      trackSectionAssignment('section_reordered', sectionId, { direction });
    },
    [trackSectionAssignment]
  );

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSections = sections.length;
    const assignedSections = sections.filter(s => s.assignedTo).length;
    const requiredSections = sections.filter(s => s.required).length;
    const assignedRequired = sections.filter(s => s.required && s.assignedTo).length;
    const totalHours = sections.reduce((total, s) => total + s.estimatedHours, 0);
    const criticalPath = calculateCriticalPath(sections);

    return {
      totalSections,
      assignedSections,
      requiredSections,
      assignedRequired,
      totalHours,
      criticalPath,
      completionRate: (assignedSections / totalSections) * 100,
      requiredCompletionRate:
        requiredSections > 0 ? (assignedRequired / requiredSections) * 100 : 0,
    };
  }, [sections, calculateCriticalPath]);

  // Debounced timeline recalculation
  const recalculateTimeline = useCallback(() => {
    // Implementation of recalculateTimeline function
  }, []);

  if (isLoadingUsers) {
    return (
      <Card className="p-6">
        <DashboardSkeleton />
      </Card>
    );
  }

  if (usersError) {
    return (
      <Card className="p-6">
        <Alert variant="error" title="Error Loading Team Members">
          <p>Could not load the list of team members. Please try again later.</p>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-6" data-testid="section-assignment-step">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Section Assignment</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={timelineView === 'table' ? 'primary' : 'secondary'}
            onClick={() => setTimelineView('table')}
            aria-pressed={timelineView === 'table'}
          >
            Table View
          </Button>
          <Button
            variant={timelineView === 'gantt' ? 'primary' : 'secondary'}
            onClick={() => setTimelineView('gantt')}
            aria-pressed={timelineView === 'gantt'}
          >
            Gantt View
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Order</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Section</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Assigned To</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Hours</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section, index) => (
                <tr key={section.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">{section.order}</span>
                      <div className="flex flex-col">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => moveSectionOrder(section.id, 'up')}
                          disabled={index === 0}
                          className="p-1 h-6 w-6"
                        >
                          <ArrowUpIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => moveSectionOrder(section.id, 'down')}
                          disabled={index === sections.length - 1}
                          className="p-1 h-6 w-6"
                        >
                          <ArrowDownIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {section.title}
                        {section.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <p className="text-sm text-gray-600">{section.description}</p>
                      {section.dependencies.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Depends on:{' '}
                          {section.dependencies
                            .map(dep => sections.find(s => s.id === dep)?.title)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Controller
                      name={`sections.${index}.assignedTo`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          placeholder="Unassigned"
                          options={teamMemberOptions}
                          value={field.value}
                          onChange={value => field.onChange(value)}
                          aria-label={`Assignee for ${section.title}`}
                        />
                      )}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <Input
                      type="number"
                      value={section.estimatedHours}
                      onChange={e =>
                        updateSectionAssignment(
                          section.id,
                          'estimatedHours',
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="0"
                      className="w-20"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Select
                      value={section.priority}
                      options={[
                        { value: 'high', label: 'High' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'low', label: 'Low' },
                      ]}
                      onChange={(value: string) =>
                        updateSectionAssignment(
                          section.id,
                          'priority',
                          value as 'high' | 'medium' | 'low'
                        )
                      }
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {section.status === 'not_started' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          Not Started
                        </span>
                      )}
                      {section.status === 'in_progress' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          <PlayIcon className="w-3 h-3 mr-1" />
                          In Progress
                        </span>
                      )}
                      {section.status === 'completed' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Completed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      {section.required && !section.assignedTo && (
                        <ExclamationTriangleIcon
                          className="w-4 h-4 text-amber-500"
                          title="Required section unassigned"
                        />
                      )}
                      {summaryStats.criticalPath.includes(section.id) && (
                        <span className="inline-flex items-center px-1 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                          Critical
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
          <UserGroupIcon className="w-5 h-5 mr-2" />
          Assignment Summary
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Sections:</span>
            <span className="font-medium">{summaryStats.totalSections}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Assigned:</span>
            <span className="font-medium">
              {summaryStats.assignedSections}/{summaryStats.totalSections}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Required Assigned:</span>
            <span
              className={`font-medium ${
                summaryStats.requiredCompletionRate === 100 ? 'text-green-600' : 'text-amber-600'
              }`}
            >
              {summaryStats.assignedRequired}/{summaryStats.requiredSections}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Effort:</span>
            <span className="font-medium">{summaryStats.totalHours} hours</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Estimated Duration:</span>
            <span className="font-medium">{Math.ceil(summaryStats.totalHours / 40)} weeks</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{summaryStats.completionRate.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${summaryStats.completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
