/**
 * PosalPro MVP2 - SME Assignments Page
 * Interface for managing subject matter expert assignments
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-7.3', 'US-7.4'],
  acceptanceCriteria: ['AC-7.3.1', 'AC-7.4.1'],
  methods: ['manageAssignments()', 'acceptAssignment()', 'trackProgress()'],
  hypotheses: ['H15'],
  testCases: ['TC-H15-001'],
};

export default function SMEAssignmentsPage() {
  const [sessionStartTime] = useState(Date.now());
  const [selectedTab, setSelectedTab] = useState('active');

  const trackAction = useCallback(
    (action: string, metadata: Record<string, unknown> = {}) => {
      console.log('SME Assignments Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
        component: 'SMEAssignmentsPage',
        userStory: 'US-7.3',
        hypothesis: 'H15',
      });
    },
    [sessionStartTime]
  );

  interface Assignment {
    id: number;
    title: string;
    type: string;
    dueDate: string;
    priority: string;
    progress: number;
    description: string;
    status: string;
    completedDate?: string;
  }

  const assignments: { [key: string]: Assignment[] } = {
    active: [
      {
        id: 1,
        title: 'Enterprise Security Suite',
        type: 'Technical Review',
        dueDate: '2024-01-15',
        priority: 'High',
        progress: 75,
        description: 'Review security architecture and compliance requirements',
        status: 'In Progress',
      },
      {
        id: 2,
        title: 'Cloud Infrastructure Migration',
        type: 'Expertise Input',
        dueDate: '2024-01-18',
        priority: 'Medium',
        progress: 30,
        description: 'Provide cloud architecture recommendations',
        status: 'In Progress',
      },
    ],
    pending: [
      {
        id: 3,
        title: 'Healthcare Solutions Package',
        type: 'Content Creation',
        dueDate: '2024-01-20',
        priority: 'High',
        progress: 0,
        description: 'Create technical content for healthcare compliance',
        status: 'Pending',
      },
      {
        id: 4,
        title: 'Data Analytics Platform',
        type: 'Technical Review',
        dueDate: '2024-01-22',
        priority: 'Low',
        progress: 0,
        description: 'Review data processing capabilities and performance',
        status: 'Pending',
      },
    ],
    completed: [
      {
        id: 5,
        title: 'AI Integration Module',
        type: 'Expertise Input',
        dueDate: '2024-01-10',
        priority: 'High',
        progress: 100,
        description: 'Provided AI integration architecture recommendations',
        status: 'Completed',
        completedDate: '2024-01-09',
      },
    ],
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress':
        return ClockIcon;
      case 'Completed':
        return CheckCircleIcon;
      case 'Pending':
        return ExclamationTriangleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const handleAcceptAssignment = useCallback(
    (assignmentId: number) => {
      trackAction('assignment_accepted', { assignmentId });
      // Move assignment from pending to active in real implementation
    },
    [trackAction]
  );

  const tabs = [
    { id: 'active', label: 'Active', count: assignments.active.length },
    { id: 'pending', label: 'Pending', count: assignments.pending.length },
    { id: 'completed', label: 'Completed', count: assignments.completed.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
            <p className="text-gray-600 mt-1">Manage your current and pending expert assignments</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  trackAction('tab_changed', { tab: tab.id });
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    selectedTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-6">
        {assignments[selectedTab as keyof typeof assignments].map(assignment => {
          const StatusIcon = getStatusIcon(assignment.status);

          return (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <StatusIcon className="w-6 h-6 text-gray-400 mt-1" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-600">{assignment.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                        assignment.priority
                      )}`}
                    >
                      {assignment.priority}
                    </span>
                    <span className="text-sm text-gray-500">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{assignment.description}</p>

                {assignment.status !== 'Pending' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">{assignment.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${assignment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        assignment.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : assignment.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {assignment.status}
                    </span>
                    {assignment.completedDate && (
                      <span className="text-sm text-gray-500">
                        Completed: {new Date(assignment.completedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {assignment.status === 'Pending' && (
                      <Button
                        onClick={() => handleAcceptAssignment(assignment.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled
                      >
                        Accept Assignment
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        trackAction('view_assignment_details', { assignmentId: assignment.id })
                      }
                      disabled
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {assignments[selectedTab as keyof typeof assignments].length === 0 && (
          <Card>
            <div className="p-8 text-center">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedTab} assignments
              </h3>
              <p className="text-gray-600">
                {selectedTab === 'pending'
                  ? 'You have no pending assignments at the moment.'
                  : selectedTab === 'active'
                    ? 'You have no active assignments at the moment.'
                    : 'You have not completed any assignments yet.'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Coming Soon Notice */}
      <Card className="mt-8">
        <div className="p-6">
          <div className="text-center">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Enhanced Assignment Management Coming Soon
            </h4>
            <p className="text-gray-600 mb-4">
              Advanced assignment workflows, collaboration tools, and performance tracking will be
              available in the next release.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Real-time collaboration on assignments
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Automated assignment matching</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Progress tracking and notifications</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Performance analytics and feedback</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
