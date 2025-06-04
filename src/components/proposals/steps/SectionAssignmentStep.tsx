'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 5: Section Assignment
 * Based on PROPOSAL_CREATION_SCREEN.md and COORDINATION_HUB_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H4 & H7 hypothesis validation
 */

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { ProposalWizardStep5Data } from '@/lib/validation/schemas/proposal';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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

// Team member interface (simplified from Step 2 data)
interface TeamMember {
  id: string;
  name: string;
  role: string;
  availability: number;
  skillMatch: number;
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

// Mock team members (would come from Step 2 data in production)
const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Mohamed Rabah', role: 'Team Lead', availability: 80, skillMatch: 95 },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'Sales Representative',
    availability: 90,
    skillMatch: 85,
  },
  { id: '3', name: 'John Smith', role: 'Technical SME', availability: 75, skillMatch: 92 },
  { id: '4', name: 'Alex Peterson', role: 'Security SME', availability: 85, skillMatch: 88 },
  { id: '5', name: 'Lisa Kim', role: 'Pricing SME', availability: 95, skillMatch: 90 },
  { id: '6', name: 'David Chen', role: 'Executive Reviewer', availability: 60, skillMatch: 80 },
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
  const [sections, setSections] = useState<ProposalSection[]>(DEFAULT_PROPOSAL_SECTIONS);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [timelineView, setTimelineView] = useState<'table' | 'gantt'>('table');
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
  } = useForm<SectionAssignmentFormData>({
    resolver: zodResolver(sectionAssignmentSchema),
    defaultValues: {
      sections: sections.map(section => ({
        id: section.id,
        assignedTo: section.assignedTo || '',
        estimatedHours: section.estimatedHours,
        priority: section.priority,
      })),
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

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

  // Stable update function to prevent infinite loops
  const handleUpdate = useCallback((formattedData: ProposalWizardStep5Data) => {
    const dataHash = JSON.stringify(formattedData);

    if (dataHash !== lastSentDataRef.current) {
      lastSentDataRef.current = dataHash;
      onUpdateRef.current(formattedData);
    }
  }, []);

  // Update parent component when form data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const sectionAssignments: Record<string, string> = {};
      const totalEstimatedHours = sections.reduce(
        (total, section) => total + section.estimatedHours,
        0
      );

      sections.forEach(section => {
        if (section.assignedTo) {
          sectionAssignments[section.id] = section.assignedTo;
        }
      });

      const formattedData: ProposalWizardStep5Data = {
        sections: sections,
        sectionAssignments,
        totalEstimatedHours,
        criticalPath: calculateCriticalPath(sections),
        timelineEstimate: {
          complexity: calculateComplexity(sections),
          riskFactors: identifyRiskFactors(sections),
        },
      };

      handleUpdate(formattedData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [sections, handleUpdate]);

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
      analytics.trackWizardStep(5, 'Section Assignment', action, {
        sectionId,
        totalSections: sections.length,
        assignedSections: sections.filter(s => s.assignedTo).length,
        totalHours: sections.reduce((total, s) => total + s.estimatedHours, 0),
        ...metadata,
      });
    },
    [analytics, sections]
  );

  // Generate AI workload recommendations
  const generateAIRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    setShowAIRecommendations(true);
    analytics.trackWizardStep(5, 'Section Assignment', 'ai_recommendations_requested');

    // Simulate AI recommendation generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // AI would suggest optimal assignments based on skills, availability, and workload
    const recommendations = generateSmartAssignments(sections, MOCK_TEAM_MEMBERS);

    setSections(recommendations);
    setIsLoadingRecommendations(false);

    analytics.trackWizardStep(5, 'Section Assignment', 'ai_recommendations_applied', {
      recommendationsCount: recommendations.filter(s => s.assignedTo).length,
      workloadBalanceScore: calculateWorkloadBalance(recommendations),
    });
  }, [analytics, sections]);

  // Generate smart assignments based on skills and availability
  const generateSmartAssignments = useCallback(
    (sectionList: ProposalSection[], teamMembers: TeamMember[]): ProposalSection[] => {
      return sectionList.map(section => {
        if (section.assignedTo) return section; // Don't override existing assignments

        // Simple assignment logic based on section type and team member skills
        let bestMember = teamMembers[0];

        if (section.title.includes('Technical') || section.title.includes('Implementation')) {
          bestMember = teamMembers.find(m => m.role.includes('Technical')) || teamMembers[0];
        } else if (section.title.includes('Security') || section.title.includes('Compliance')) {
          bestMember = teamMembers.find(m => m.role.includes('Security')) || teamMembers[0];
        } else if (section.title.includes('Pricing') || section.title.includes('Commercial')) {
          bestMember = teamMembers.find(m => m.role.includes('Pricing')) || teamMembers[0];
        } else if (section.title.includes('Executive')) {
          bestMember = teamMembers.find(m => m.role.includes('Lead')) || teamMembers[0];
        }

        return {
          ...section,
          assignedTo: bestMember.id,
        };
      });
    },
    []
  );

  // Calculate workload balance score
  const calculateWorkloadBalance = useCallback((sectionList: ProposalSection[]): number => {
    const memberWorkload: Record<string, number> = {};

    sectionList.forEach(section => {
      if (section.assignedTo) {
        memberWorkload[section.assignedTo] =
          (memberWorkload[section.assignedTo] || 0) + section.estimatedHours;
      }
    });

    const workloads = Object.values(memberWorkload);
    if (workloads.length === 0) return 0;

    const avg = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const variance = workloads.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) / workloads.length;

    // Lower variance means better balance (0-100 score)
    return Math.max(0, 100 - variance);
  }, []);

  // Update section assignment
  const updateSectionAssignment = useCallback(
    (sectionId: string, field: string, value: any) => {
      setSections(prev =>
        prev.map(section => (section.id === sectionId ? { ...section, [field]: value } : section))
      );

      trackSectionAssignment('section_updated', sectionId, { field, value });
    },
    [trackSectionAssignment]
  );

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

  return (
    <div className="space-y-8">
      {/* AI Recommendations Panel */}
      <Card>
        <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-purple-900">AI Workload Optimization</h3>
            </div>
            <Button
              variant="secondary"
              onClick={generateAIRecommendations}
              disabled={isLoadingRecommendations}
              loading={isLoadingRecommendations}
              className="flex items-center"
            >
              Optimize Assignments
            </Button>
          </div>

          {showAIRecommendations && (
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-600 mb-3">
                AI has analyzed team skills, availability, and section requirements:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {summaryStats.completionRate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{summaryStats.totalHours}h</div>
                  <div className="text-sm text-gray-600">Total Effort</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {calculateWorkloadBalance(sections).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600">Balance Score</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Section Assignment Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Proposal Sections ({sections.length})
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant={timelineView === 'table' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTimelineView('table')}
              >
                Table View
              </Button>
              <Button
                variant={timelineView === 'gantt' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTimelineView('gantt')}
              >
                Timeline View
              </Button>
            </div>
          </div>

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
                    <td className="py-3 px-4">
                      <Select
                        value={section.assignedTo || ''}
                        options={[
                          { value: '', label: 'Unassigned' },
                          ...MOCK_TEAM_MEMBERS.map(member => ({
                            value: member.id,
                            label: `${member.name} (${member.role})`,
                          })),
                        ]}
                        onChange={(value: string) =>
                          updateSectionAssignment(section.id, 'assignedTo', value || undefined)
                        }
                      />
                    </td>
                    <td className="py-3 px-4">
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
      </Card>

      {/* Summary and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Summary */}
        <Card>
          <div className="p-6">
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
                    summaryStats.requiredCompletionRate === 100
                      ? 'text-green-600'
                      : 'text-amber-600'
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

            {/* Progress Bar */}
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

        {/* Timeline Estimate */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              Timeline Estimate
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Complexity:</span>
                <span
                  className={`font-medium ${
                    calculateComplexity(sections) === 'high'
                      ? 'text-red-600'
                      : calculateComplexity(sections) === 'medium'
                        ? 'text-amber-600'
                        : 'text-green-600'
                  }`}
                >
                  {calculateComplexity(sections).charAt(0).toUpperCase() +
                    calculateComplexity(sections).slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical Path:</span>
                <span className="font-medium">{summaryStats.criticalPath.length} sections</span>
              </div>

              {/* Risk Factors */}
              {identifyRiskFactors(sections).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Risk Factors:</h4>
                  <ul className="space-y-1">
                    {identifyRiskFactors(sections).map((risk, index) => (
                      <li key={index} className="flex items-center text-sm text-amber-700">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critical Path Sections */}
              {summaryStats.criticalPath.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Critical Path:</h4>
                  <ul className="space-y-1">
                    {summaryStats.criticalPath.map(sectionId => {
                      const section = sections.find(s => s.id === sectionId);
                      return section ? (
                        <li key={sectionId} className="text-sm text-gray-600">
                          {section.title} ({section.estimatedHours}h)
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              summaryStats.requiredCompletionRate === 100 ? 'bg-success-600' : 'bg-amber-500'
            }`}
          />
          <span className="text-sm text-neutral-600">
            Step 5 of 6: {summaryStats.requiredCompletionRate === 100 ? 'Complete' : 'In Progress'}
          </span>
        </div>
        <div className="text-sm text-neutral-600">
          {summaryStats.assignedSections}/{summaryStats.totalSections} sections •{' '}
          {summaryStats.totalHours}h total
        </div>
      </div>
    </div>
  );
}
