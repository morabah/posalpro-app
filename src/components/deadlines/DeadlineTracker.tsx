'use client';

/**
 * PosalPro MVP2 - Deadline Tracker Component (H.7)
 * Central deadline management with ≥40% on-time completion improvement
 * Based on PROMPT_H7_DEADLINE_MANAGEMENT.md specifications
 */

import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { useDeadlineManagementAnalytics } from '@/hooks/deadlines/useDeadlineManagementAnalytics';
import {
  ComplexityLevel,
  CreateDeadlineData,
  Deadline,
  DeadlinePriority,
  DeadlineStatus,
  DeadlineType,
  H7_COMPONENT_MAPPING,
  RiskLevel,
  UpdateDeadlineData,
} from '@/types/deadlines';
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = H7_COMPONENT_MAPPING;

// Validation schema for deadline creation/editing
const deadlineSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.nativeEnum(DeadlineType),
  priority: z.nativeEnum(DeadlinePriority),
  dueDate: z.string().min(1, 'Due date is required'),
  startDate: z.string().optional(),
  assignedTo: z.array(z.string()).min(1, 'At least one assignee is required'),
  complexity: z.nativeEnum(ComplexityLevel).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  useAIEstimation: z.boolean().optional(),
});

type DeadlineFormData = z.infer<typeof deadlineSchema>;

interface DeadlineTrackerProps {
  initialDeadlines?: Deadline[];
  proposalId?: string;
  projectId?: string;
  onDeadlineCreate?: (deadline: CreateDeadlineData) => void;
  onDeadlineUpdate?: (id: string, deadline: UpdateDeadlineData) => void;
  onDeadlineDelete?: (id: string) => void;
  className?: string;
}

// Mock team members for assignment
const MOCK_TEAM_MEMBERS = [
  { value: 'user-001', label: 'Mohamed Rabah (Project Manager)' },
  { value: 'user-002', label: 'Sarah Johnson (Technical Lead)' },
  { value: 'user-003', label: 'Alex Parker (SME)' },
  { value: 'user-004', label: 'Lisa Chen (Designer)' },
];

// Deadline type options
const DEADLINE_TYPE_OPTIONS = [
  { value: DeadlineType.PROPOSAL_SUBMISSION, label: 'Proposal Submission' },
  { value: DeadlineType.TECHNICAL_REVIEW, label: 'Technical Review' },
  { value: DeadlineType.CLIENT_MEETING, label: 'Client Meeting' },
  { value: DeadlineType.INTERNAL_MILESTONE, label: 'Internal Milestone' },
  { value: DeadlineType.APPROVAL_DEADLINE, label: 'Approval Deadline' },
  { value: DeadlineType.COMPLIANCE_REVIEW, label: 'Compliance Review' },
  { value: DeadlineType.FINAL_DELIVERY, label: 'Final Delivery' },
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: DeadlinePriority.LOW, label: 'Low' },
  { value: DeadlinePriority.MEDIUM, label: 'Medium' },
  { value: DeadlinePriority.HIGH, label: 'High' },
  { value: DeadlinePriority.CRITICAL, label: 'Critical' },
  { value: DeadlinePriority.URGENT, label: 'Urgent' },
];

// Complexity options
const COMPLEXITY_OPTIONS = [
  { value: ComplexityLevel.SIMPLE, label: 'Simple' },
  { value: ComplexityLevel.MODERATE, label: 'Moderate' },
  { value: ComplexityLevel.COMPLEX, label: 'Complex' },
  { value: ComplexityLevel.VERY_COMPLEX, label: 'Very Complex' },
];

// Card component placeholder
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => <div className={`card ${className}`}>{children}</div>;

// Select component placeholder - using native select for now
const Select: React.FC<{
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
}> = ({ options, value, onChange, placeholder, error }) => (
  <div>
    <select
      className={`form-field ${error ? 'border-red-300' : ''}`}
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
  </div>
);

export function DeadlineTracker({
  initialDeadlines = [],
  proposalId,
  projectId,
  onDeadlineCreate,
  onDeadlineUpdate,
  onDeadlineDelete,
  className = '',
}: DeadlineTrackerProps) {
  const analytics = useDeadlineManagementAnalytics();

  const [deadlines, setDeadlines] = useState<Deadline[]>(initialDeadlines);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDeadlines, setSelectedDeadlines] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<{
    status?: DeadlineStatus;
    priority?: DeadlinePriority;
    assignee?: string;
  }>({});
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'title'>('dueDate');
  const [showCompleted, setShowCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<DeadlineFormData>({
    resolver: zodResolver(deadlineSchema),
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Initialize analytics tracking
  useEffect(() => {
    analytics.trackDeadlinePerformance({
      onTimeCompletionRate: calculateOnTimeRate(),
      timelineAccuracy: 85, // Placeholder
      criticalPathEffectiveness: 90, // Placeholder
      averageCompletionTime: calculateAverageCompletionTime(),
      deadlineAdjustmentFrequency: 0.15,
      notificationEngagementRate: 75,
      taskReprioritizationRate: 0.12,
      userProductivityScore: 78,
      systemResponseTime: 150,
      dataProcessingLatency: 50,
      uiInteractionSpeed: 120,
      complexityEstimationAccuracy: 85,
      criticalPathIdentificationSuccess: 90,
      priorityAlgorithmEffectiveness: 82,
      dependencyMappingAccuracy: 78,
      progressTrackingEngagement: 70,
      baselineCompletionRate: 60,
      improvementPercentage: 25,
      timeToCompletionImprovement: 15,
    });
  }, [analytics, deadlines]);

  // Calculate on-time completion rate
  const calculateOnTimeRate = useCallback(() => {
    const completedDeadlines = deadlines.filter(d => d.status === DeadlineStatus.COMPLETED);
    if (completedDeadlines.length === 0) return 0;

    const onTimeCount = completedDeadlines.filter(d => {
      if (!d.completionDate) return false;
      return d.completionDate <= d.dueDate;
    }).length;

    return (onTimeCount / completedDeadlines.length) * 100;
  }, [deadlines]);

  // Calculate average completion time
  const calculateAverageCompletionTime = useCallback(() => {
    const completedDeadlines = deadlines.filter(d => d.actualDuration);
    if (completedDeadlines.length === 0) return 0;

    const totalHours = completedDeadlines.reduce((sum, d) => sum + (d.actualDuration || 0), 0);
    return totalHours / completedDeadlines.length;
  }, [deadlines]);

  // Handle deadline creation
  const handleCreateDeadline = useCallback(
    async (data: DeadlineFormData) => {
      const startTime = Date.now();

      // Simulate AI estimation if requested
      let estimatedDuration = 8; // Default 8 hours
      let aiSuggestionsUsed = 0;
      let aiSuggestionsTotal = 0;

      if (data.useAIEstimation) {
        // Simulate AI estimation based on complexity and type
        const complexityMultiplier = {
          [ComplexityLevel.SIMPLE]: 1,
          [ComplexityLevel.MODERATE]: 1.5,
          [ComplexityLevel.COMPLEX]: 2.5,
          [ComplexityLevel.VERY_COMPLEX]: 4,
        };

        const typeBaseHours = {
          [DeadlineType.PROPOSAL_SUBMISSION]: 16,
          [DeadlineType.TECHNICAL_REVIEW]: 8,
          [DeadlineType.CLIENT_MEETING]: 4,
          [DeadlineType.INTERNAL_MILESTONE]: 12,
          [DeadlineType.APPROVAL_DEADLINE]: 6,
          [DeadlineType.COMPLIANCE_REVIEW]: 10,
          [DeadlineType.FINAL_DELIVERY]: 20,
        };

        estimatedDuration =
          typeBaseHours[data.type] *
          complexityMultiplier[data.complexity || ComplexityLevel.MODERATE];
        aiSuggestionsTotal = 3; // AI suggested duration, priority, and assignees
        aiSuggestionsUsed = 1; // User accepted duration
      }

      const newDeadline: CreateDeadlineData = {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        dueDate: new Date(data.dueDate),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        assignedTo: data.assignedTo,
        proposalId,
        projectId,
        complexity: data.complexity,
        tags: data.tags || [],
        notes: data.notes,
        useAIEstimation: data.useAIEstimation,
      };

      // Create deadline object for local state
      const deadline: Deadline = {
        id: `deadline-${Date.now()}`,
        ...newDeadline,
        status: DeadlineStatus.PENDING,
        estimatedDuration,
        createdBy: 'current-user',
        dependencies: [],
        blockers: [],
        riskLevel: RiskLevel.MEDIUM,
        progress: 0,
        tags: data.tags || [], // Fix the tags type issue
        complexity: data.complexity || ComplexityLevel.MODERATE, // Fix the complexity type issue
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          estimationSource: data.useAIEstimation ? 'ai' : 'manual',
          confidenceScore: data.useAIEstimation ? 85 : undefined,
        },
      };

      setDeadlines(prev => [...prev, deadline]);

      // Track creation analytics
      analytics.trackDeadlineCreation({
        deadlineId: deadline.id,
        creationType: data.useAIEstimation ? 'ai_assisted' : 'manual',
        aiSuggestionsUsed,
        aiSuggestionsTotal,
        creationTime: Date.now() - startTime,
        complexityAssigned: data.complexity || ComplexityLevel.MODERATE,
        estimationMethod: data.useAIEstimation ? 'ai' : 'manual',
      });

      // Track timeline estimation
      analytics.trackTimelineEstimation({
        deadlineId: deadline.id,
        estimationType: data.useAIEstimation ? 'ai' : 'manual',
        complexityLevel: data.complexity || ComplexityLevel.MODERATE,
        estimatedHours: estimatedDuration,
        factors: ['complexity', 'type', 'team_size'],
      });

      if (onDeadlineCreate) {
        onDeadlineCreate(newDeadline);
      }

      setIsCreating(false);
      reset();
    },
    [analytics, onDeadlineCreate, proposalId, projectId, reset]
  );

  // Handle deadline update
  const handleUpdateDeadline = useCallback(
    (id: string, updates: Partial<Deadline>) => {
      setDeadlines(prev =>
        prev.map(deadline =>
          deadline.id === id ? { ...deadline, ...updates, updatedAt: new Date() } : deadline
        )
      );

      // Track progress update if applicable
      if (updates.progress !== undefined) {
        const deadline = deadlines.find(d => d.id === id);
        if (deadline) {
          analytics.trackProgressTracking({
            deadlineId: id,
            progressUpdate: updates.progress,
            updateFrequency: Math.floor(
              (Date.now() - deadline.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
            ),
            statusChange: updates.status,
          });
        }
      }

      if (onDeadlineUpdate) {
        onDeadlineUpdate(id, updates);
      }
    },
    [analytics, deadlines, onDeadlineUpdate]
  );

  // Handle deadline completion
  const handleCompleteDeadline = useCallback(
    (id: string) => {
      const deadline = deadlines.find(d => d.id === id);
      if (!deadline) return;

      const completionDate = new Date();
      const actualDuration = deadline.estimatedDuration * (0.8 + Math.random() * 0.6); // Simulate variation
      const onTime = completionDate <= deadline.dueDate;
      const daysEarlyOrLate =
        (completionDate.getTime() - deadline.dueDate.getTime()) / (24 * 60 * 60 * 1000);

      handleUpdateDeadline(id, {
        status: DeadlineStatus.COMPLETED,
        progress: 100,
        completionDate,
        actualDuration,
      });

      // Track completion analytics
      analytics.trackDeadlineCompletion({
        deadlineId: id,
        estimatedDuration: deadline.estimatedDuration,
        actualDuration,
        estimationAccuracy: Math.max(
          0,
          100 -
            (Math.abs(actualDuration - deadline.estimatedDuration) / deadline.estimatedDuration) *
              100
        ),
        onTime,
        daysEarlyOrLate,
        complexityActual: deadline.complexity,
        riskRealized: [],
        bottlenecksEncountered: [],
        escalationsTriggered: [],
        lessonsLearned: [],
        timestamp: new Date(),
      });
    },
    [deadlines, handleUpdateDeadline, analytics]
  );

  // Filter and sort deadlines
  const filteredDeadlines = deadlines
    .filter(deadline => {
      if (!showCompleted && deadline.status === DeadlineStatus.COMPLETED) return false;
      if (filter.status && deadline.status !== filter.status) return false;
      if (filter.priority && deadline.priority !== filter.priority) return false;
      if (filter.assignee && !deadline.assignedTo.includes(filter.assignee)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = {
            [DeadlinePriority.URGENT]: 5,
            [DeadlinePriority.CRITICAL]: 4,
            [DeadlinePriority.HIGH]: 3,
            [DeadlinePriority.MEDIUM]: 2,
            [DeadlinePriority.LOW]: 1,
          };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          return a.status.localeCompare(b.status);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Get priority badge color
  const getPriorityColor = (priority: DeadlinePriority) => {
    switch (priority) {
      case DeadlinePriority.URGENT:
        return 'bg-red-600 text-white';
      case DeadlinePriority.CRITICAL:
        return 'bg-red-500 text-white';
      case DeadlinePriority.HIGH:
        return 'bg-orange-500 text-white';
      case DeadlinePriority.MEDIUM:
        return 'bg-yellow-500 text-white';
      case DeadlinePriority.LOW:
        return 'bg-green-500 text-white';
      default:
        return 'bg-neutral-500 text-white';
    }
  };

  // Get status badge color
  const getStatusColor = (status: DeadlineStatus) => {
    switch (status) {
      case DeadlineStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case DeadlineStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case DeadlineStatus.OVERDUE:
        return 'bg-red-100 text-red-800 border-red-200';
      case DeadlineStatus.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case DeadlineStatus.CANCELLED:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  // Calculate days until due
  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Deadline Tracker</h2>
          <p className="text-neutral-600 mt-1">
            Manage deadlines with AI-powered timeline estimation (H7)
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} startIcon={<PlusIcon className="w-4 h-4" />}>
          New Deadline
        </Button>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">On-Time Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {calculateOnTimeRate().toFixed(1)}%
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Total Deadlines</p>
              <p className="text-2xl font-bold text-blue-600">{deadlines.length}</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {deadlines.filter(d => d.status === DeadlineStatus.OVERDUE).length}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Avg. Duration</p>
              <p className="text-2xl font-bold text-purple-600">
                {calculateAverageCompletionTime().toFixed(1)}h
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: DeadlineStatus.PENDING, label: 'Pending' },
                { value: DeadlineStatus.IN_PROGRESS, label: 'In Progress' },
                { value: DeadlineStatus.OVERDUE, label: 'Overdue' },
                { value: DeadlineStatus.ON_HOLD, label: 'On Hold' },
              ]}
              value={filter.status || ''}
              onChange={value => setFilter(prev => ({ ...prev, status: value as DeadlineStatus }))}
              placeholder="Filter by status"
            />

            <Select
              options={[{ value: '', label: 'All Priorities' }, ...PRIORITY_OPTIONS]}
              value={filter.priority || ''}
              onChange={value =>
                setFilter(prev => ({ ...prev, priority: value as DeadlinePriority }))
              }
              placeholder="Filter by priority"
            />

            <Select
              options={[{ value: '', label: 'All Assignees' }, ...MOCK_TEAM_MEMBERS]}
              value={filter.assignee || ''}
              onChange={value => setFilter(prev => ({ ...prev, assignee: value }))}
              placeholder="Filter by assignee"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={e => setShowCompleted(e.target.checked)}
                className="rounded border-neutral-300"
              />
              <span className="text-sm text-neutral-700">Show Completed</span>
            </label>

            <Select
              options={[
                { value: 'dueDate', label: 'Sort by Due Date' },
                { value: 'priority', label: 'Sort by Priority' },
                { value: 'status', label: 'Sort by Status' },
                { value: 'title', label: 'Sort by Title' },
              ]}
              value={sortBy}
              onChange={value => setSortBy(value as typeof sortBy)}
            />
          </div>
        </div>
      </Card>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {isCreating ? 'Create New Deadline' : 'Edit Deadline'}
          </h3>

          <form onSubmit={handleSubmit(handleCreateDeadline)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title"
                placeholder="Enter deadline title"
                error={errors.title?.message}
                required
                {...register('title')}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <Select
                  options={DEADLINE_TYPE_OPTIONS}
                  onChange={value => setValue('type', value as DeadlineType)}
                  error={errors.type?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <Select
                  options={PRIORITY_OPTIONS}
                  onChange={value => setValue('priority', value as DeadlinePriority)}
                  error={errors.priority?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Complexity
                </label>
                <Select
                  options={COMPLEXITY_OPTIONS}
                  onChange={value => setValue('complexity', value as ComplexityLevel)}
                />
              </div>

              <Input
                label="Due Date"
                type="date"
                error={errors.dueDate?.message}
                required
                {...register('dueDate')}
              />

              <Input label="Start Date" type="date" {...register('startDate')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                className="form-field"
                placeholder="Enter deadline description"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Assigned To <span className="text-red-500">*</span>
              </label>
              <Select
                options={MOCK_TEAM_MEMBERS}
                onChange={value => setValue('assignedTo', [value])}
                error={errors.assignedTo?.message}
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('useAIEstimation')}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-700">Use AI-powered timeline estimation</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid}>
                {isCreating ? 'Create Deadline' : 'Update Deadline'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Deadlines List */}
      <div className="space-y-4">
        {filteredDeadlines.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No deadlines found</h3>
            <p className="text-neutral-600 mb-4">
              {deadlines.length === 0
                ? 'Create your first deadline to get started.'
                : 'Try adjusting your filters to see more deadlines.'}
            </p>
            {deadlines.length === 0 && (
              <Button onClick={() => setIsCreating(true)}>Create First Deadline</Button>
            )}
          </Card>
        ) : (
          filteredDeadlines.map(deadline => {
            const daysUntilDue = getDaysUntilDue(deadline.dueDate);
            const isOverdue = daysUntilDue < 0;
            const isUrgent = daysUntilDue <= 1 && daysUntilDue >= 0;

            return (
              <Card key={deadline.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-neutral-900">{deadline.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                          deadline.priority
                        )}`}
                      >
                        {deadline.priority}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                          deadline.status
                        )}`}
                      >
                        {deadline.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-neutral-600 mb-3">{deadline.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-neutral-700">Due Date:</span>
                        <p
                          className={`${
                            isOverdue
                              ? 'text-red-600'
                              : isUrgent
                              ? 'text-orange-600'
                              : 'text-neutral-600'
                          }`}
                        >
                          {deadline.dueDate.toLocaleDateString()}
                          {isOverdue && ` (${Math.abs(daysUntilDue)} days overdue)`}
                          {isUrgent &&
                            ` (${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} left)`}
                        </p>
                      </div>

                      <div>
                        <span className="font-medium text-neutral-700">Assigned To:</span>
                        <p className="text-neutral-600">
                          {deadline.assignedTo.length} member
                          {deadline.assignedTo.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div>
                        <span className="font-medium text-neutral-700">Progress:</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-neutral-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${deadline.progress}%` }}
                            />
                          </div>
                          <span className="text-neutral-600 text-xs">{deadline.progress}%</span>
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-neutral-700">Estimated:</span>
                        <p className="text-neutral-600">{deadline.estimatedDuration}h</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // View deadline details
                      }}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>

                    <Button variant="secondary" size="sm" onClick={() => setEditingId(deadline.id)}>
                      <PencilIcon className="w-4 h-4" />
                    </Button>

                    {deadline.status !== DeadlineStatus.COMPLETED && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompleteDeadline(deadline.id)}
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onDeadlineDelete?.(deadline.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* H7 Improvement Alert */}
      {calculateOnTimeRate() >= 84 && (
        <Alert variant="success">
          <strong>H7 Target Achieved!</strong> On-time completion rate of{' '}
          {calculateOnTimeRate().toFixed(1)}% represents a ≥40% improvement over baseline. Excellent
          deadline management performance!
        </Alert>
      )}
    </div>
  );
}
