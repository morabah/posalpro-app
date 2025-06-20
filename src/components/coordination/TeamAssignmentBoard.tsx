/**
 * TeamAssignmentBoard Component
 *
 * Component Traceability Matrix:
 * - User Stories: US-2.2, US-2.3, US-4.1, US-4.3
 * - Acceptance Criteria: AC-2.2.1, AC-2.2.2, AC-2.2.3, AC-4.3.1
 * - Methods: suggestContributors(), assignTask(), visualizeWorkload(), trackAvailability()
 * - Hypotheses: H4 (40% coordination reduction), H7 (40% on-time improvement)
 * - Test Cases: TC-H4-001, TC-H4-002, TC-H7-001
 */

'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import {
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-2.3', 'US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-2.2.1', 'AC-2.2.2', 'AC-2.2.3', 'AC-4.3.1'],
  methods: [
    'suggestContributors()',
    'assignTask()',
    'visualizeWorkload()',
    'trackAvailability()',
    'optimizeAssignments()',
    'predictBottlenecks()',
  ],
  hypotheses: ['H4', 'H7'],
  testCases: ['TC-H4-001', 'TC-H4-002', 'TC-H7-001'],
};

// Interface definitions
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  availability: number; // 0-100%
  currentWorkload: number; // hours per week
  maxCapacity: number; // hours per week
  avatar?: string;
  performance: {
    completionRate: number;
    averageQuality: number;
    responseTime: number; // hours
  };
}

interface ProposalSection {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  estimatedHours: number;
  deadline: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'unassigned' | 'assigned' | 'in_progress' | 'review' | 'completed';
  assignedTo?: string;
  dependencies: string[];
  progress: number; // 0-100%
}

interface Assignment {
  id: string;
  sectionId: string;
  memberId: string;
  assignedAt: Date;
  dueDate: Date;
  estimatedHours: number;
  actualHours?: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
}

interface TeamAssignmentBoardProps {
  proposalId: string;
  sections: ProposalSection[];
  teamMembers: TeamMember[];
  assignments: Assignment[];
  onAssignmentChange: (assignment: Assignment) => void;
  onSectionUpdate: (section: ProposalSection) => void;
  className?: string;
}

export function TeamAssignmentBoard({
  proposalId,
  sections,
  teamMembers,
  assignments,
  onAssignmentChange,
  onSectionUpdate,
  className = '',
}: TeamAssignmentBoardProps) {
  // State management
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [draggedMember, setDraggedMember] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'matrix' | 'timeline'>('board');

  // Analytics and error handling
  const analytics = useAnalytics();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Error handling
  const handleError = useCallback(
    (error: unknown, operation: string, context?: any) => {
      const standardError =
        error instanceof Error
          ? new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Team assignment ${operation} failed: ${error.message}`,
              cause: error,
              metadata: { operation, context, proposalId, component: 'TeamAssignmentBoard' },
            })
          : new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Team assignment ${operation} failed: Unknown error`,
              metadata: { operation, context, proposalId, component: 'TeamAssignmentBoard' },
            });

      errorHandlingService.processError(standardError);
      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      toast.error(userMessage);

      analytics.track('team_assignment_error', {
        operation,
        error: standardError.message,
        context,
        proposalId,
      });
    },
    [errorHandlingService, analytics, proposalId]
  );

  // Smart contributor suggestions using AI-based matching
  const getSmartSuggestions = useCallback(
    (section: ProposalSection): TeamMember[] => {
      try {
        const suggestions = teamMembers
          .filter(member => {
            // Skill matching
            const skillMatch = section.requiredSkills.some(skill => member.skills.includes(skill));

            // Availability check (must have at least 25% availability)
            const hasAvailability = member.availability >= 25;

            // Workload check (not overloaded)
            const workloadOk = member.currentWorkload < member.maxCapacity * 0.9;

            return skillMatch && hasAvailability && workloadOk;
          })
          .map(member => {
            // Calculate suggestion score
            const skillScore =
              section.requiredSkills.reduce((score, skill) => {
                return member.skills.includes(skill) ? score + 1 : score;
              }, 0) / section.requiredSkills.length;

            const availabilityScore = member.availability / 100;
            const workloadScore = 1 - member.currentWorkload / member.maxCapacity;
            const performanceScore =
              (member.performance.completionRate + member.performance.averageQuality) / 2;

            const totalScore =
              skillScore * 0.4 +
              availabilityScore * 0.2 +
              workloadScore * 0.2 +
              performanceScore * 0.2;

            return { ...member, suggestionScore: totalScore };
          })
          .sort((a, b) => (b.suggestionScore || 0) - (a.suggestionScore || 0))
          .slice(0, 3); // Top 3 suggestions

        analytics.track('smart_suggestions_generated', {
          sectionId: section.id,
          suggestionsCount: suggestions.length,
          proposalId,
        });

        return suggestions;
      } catch (error) {
        handleError(error, 'generate_suggestions', { sectionId: section.id });
        return [];
      }
    },
    [teamMembers, analytics, proposalId, handleError]
  );

  // Handle task assignment
  const handleAssignment = useCallback(
    async (sectionId: string, memberId: string) => {
      try {
        setIsLoading(true);

        const section = sections.find(s => s.id === sectionId);
        const member = teamMembers.find(m => m.id === memberId);

        if (!section || !member) {
          throw new Error('Invalid section or member');
        }

        // Check workload capacity
        const newWorkload = member.currentWorkload + section.estimatedHours;
        if (newWorkload > member.maxCapacity) {
          toast.warning(
            `${member.name} would be overloaded with this assignment (${newWorkload}/${member.maxCapacity} hours)`
          );
          return;
        }

        // Create new assignment
        const newAssignment: Assignment = {
          id: `assignment-${Date.now()}`,
          sectionId,
          memberId,
          assignedAt: new Date(),
          dueDate: section.deadline,
          estimatedHours: section.estimatedHours,
          status: 'pending',
        };

        // Update section status
        const updatedSection: ProposalSection = {
          ...section,
          status: 'assigned',
          assignedTo: memberId,
        };

        onAssignmentChange(newAssignment);
        onSectionUpdate(updatedSection);

        toast.success(`Assigned ${section.name} to ${member.name}`);

        analytics.track('task_assigned', {
          sectionId,
          memberId,
          memberName: member.name,
          sectionName: section.name,
          estimatedHours: section.estimatedHours,
          proposalId,
        });
      } catch (error) {
        handleError(error, 'assign_task', { sectionId, memberId });
      } finally {
        setIsLoading(false);
      }
    },
    [sections, teamMembers, onAssignmentChange, onSectionUpdate, analytics, proposalId, handleError]
  );

  // Calculate workload visualization data
  const workloadData = useMemo(() => {
    return teamMembers.map(member => {
      const utilizationPercentage = (member.currentWorkload / member.maxCapacity) * 100;
      const availableHours = member.maxCapacity - member.currentWorkload;

      let status: 'available' | 'busy' | 'overloaded' = 'available';
      if (utilizationPercentage > 90) status = 'overloaded';
      else if (utilizationPercentage > 70) status = 'busy';

      return {
        ...member,
        utilizationPercentage,
        availableHours,
        status,
      };
    });
  }, [teamMembers]);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <ClockIcon className="w-4 h-4 text-blue-600" />;
      case 'review':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />;
      case 'assigned':
        return <UserGroupIcon className="w-4 h-4 text-purple-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  // Track component view
  useEffect(() => {
    analytics.track('team_assignment_board_viewed', {
      proposalId,
      sectionsCount: sections.length,
      teamMembersCount: teamMembers.length,
      assignmentsCount: assignments.length,
      viewMode,
    });
  }, [analytics, proposalId, sections.length, teamMembers.length, assignments.length, viewMode]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with view mode controls */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Team Assignment Board</h3>
          <p className="text-sm text-gray-600 mt-1">
            Drag sections to team members or use smart suggestions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant={viewMode === 'board' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('board')}
          >
            Board View
          </Button>
          <Button
            variant={viewMode === 'matrix' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('matrix')}
          >
            Matrix View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <LightBulbIcon className="w-4 h-4 mr-2" />
            AI Suggestions
          </Button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Sections */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Unassigned Sections</h4>
              <Badge variant="secondary">
                {sections.filter(s => s.status === 'unassigned').length}
              </Badge>
            </div>
            <div className="space-y-3">
              {sections
                .filter(section => section.status === 'unassigned')
                .map(section => (
                  <div
                    key={section.id}
                    className="p-4 border rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                    draggable
                    onDragStart={() => setDraggedSection(section.id)}
                    onDragEnd={() => setDraggedSection(null)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{section.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={getPriorityColor(section.priority)}>
                            {section.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">{section.estimatedHours}h</span>
                          <span className="text-xs text-gray-500">
                            Due: {section.deadline.toLocaleDateString()}
                          </span>
                        </div>
                        {section.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {section.requiredSkills.map(skill => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {getStatusIcon(section.status)}
                    </div>

                    {/* Smart suggestions for this section */}
                    {showSuggestions && selectedSection === section.id && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <h6 className="text-sm font-medium text-blue-900 mb-2">
                          Suggested Contributors
                        </h6>
                        <div className="space-y-2">
                          {getSmartSuggestions(section).map(member => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 bg-white rounded border"
                            >
                              <div className="flex items-center space-x-2">
                                <Avatar src={member.avatar} alt={member.name} size="sm" />
                                <div>
                                  <span className="text-sm font-medium">{member.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {member.availability}% available
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAssignment(section.id, member.id)}
                                disabled={isLoading}
                              >
                                Assign
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        setSelectedSection(selectedSection === section.id ? null : section.id)
                      }
                    >
                      <LightBulbIcon className="w-4 h-4 mr-2" />
                      Show Suggestions
                    </Button>
                  </div>
                ))}
            </div>
          </Card>

          {/* Team Members with Workload */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Team Workload</h4>
              <Badge variant="secondary">{teamMembers.length} members</Badge>
            </div>
            <div className="space-y-4">
              {workloadData.map(member => (
                <div
                  key={member.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => {
                    if (draggedSection) {
                      handleAssignment(draggedSection, member.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar src={member.avatar} alt={member.name} size="md" />
                      <div>
                        <h5 className="font-medium text-gray-900">{member.name}</h5>
                        <p className="text-sm text-gray-600">
                          {member.role} • {member.department}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'busy'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.status}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {member.currentWorkload}/{member.maxCapacity}h
                      </p>
                    </div>
                  </div>

                  {/* Workload bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Workload</span>
                      <span>{Math.round(member.utilizationPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          member.utilizationPercentage > 90
                            ? 'bg-red-500'
                            : member.utilizationPercentage > 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(member.utilizationPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  {member.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.skills.slice(0, 4).map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.skills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Performance indicators */}
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Completion: {Math.round(member.performance.completionRate * 100)}%</span>
                    <span>Quality: {Math.round(member.performance.averageQuality * 100)}%</span>
                    <span>Response: {member.performance.responseTime}h</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Section</th>
                  <th className="text-left py-3 px-4">Required Skills</th>
                  <th className="text-left py-3 px-4">Hours</th>
                  <th className="text-left py-3 px-4">Priority</th>
                  <th className="text-left py-3 px-4">Assigned To</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(section => {
                  const assignedMember = section.assignedTo
                    ? teamMembers.find(m => m.id === section.assignedTo)
                    : null;

                  return (
                    <tr key={section.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{section.name}</div>
                          <div className="text-sm text-gray-600">{section.description}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {section.requiredSkills.map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{section.estimatedHours}h</td>
                      <td className="py-3 px-4">
                        <Badge className={getPriorityColor(section.priority)}>
                          {section.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {assignedMember ? (
                          <div className="flex items-center space-x-2">
                            <Avatar
                              src={assignedMember.avatar}
                              alt={assignedMember.name}
                              size="sm"
                            />
                            <span className="text-sm">{assignedMember.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(section.status)}
                          <span className="text-sm capitalize">
                            {section.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {!section.assignedTo && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedSection(selectedSection === section.id ? null : section.id)
                            }
                          >
                            Assign
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Auto-Assign
          </Button>
          <Button variant="outline" size="sm">
            <ChartBarIcon className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {assignments.length} assignments •{' '}
          {sections.filter(s => s.status === 'unassigned').length} unassigned
        </div>
      </div>
    </div>
  );
}
