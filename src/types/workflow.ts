export type WorkflowStatus = 'completed' | 'in_progress' | 'blocked' | 'pending' | 'not_started';

export interface WorkflowStage {
  id: string;
  name: string;
  type: 'Technical' | 'Legal' | 'Finance' | 'Executive' | 'Security' | 'Compliance';
  status: WorkflowStatus;
  isRequired: boolean;
  canRunInParallel: boolean;
  estimatedDuration: number;
  actualDuration?: number;
  slaHours: number;
  dependencies: string[];
  approverRoles: string[];
  slaCompliance: boolean;
  bottleneckRisk: 'High' | 'Medium' | 'Low';
  assignee?: string;
  deadline?: Date;
  startTime?: Date;
  endTime?: Date;
  isParallel?: boolean;
  isCriticalPath?: boolean;
  escalationRules: {
    at80Percent: boolean;
    at120Percent: boolean;
    bypasAfterSLA: boolean;
  };
}

export interface TimelineMetrics {
  totalEstimatedDuration: number;
  totalActualDuration: number;
  criticalPathDuration: number;
  parallelSavings: number;
  slaComplianceRate: number;
  onTimeCompletionLikelihood: number;
  bottleneckStages: string[];
  optimizationOpportunities: string[];
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'regex';
  value: string | number | boolean | string[] | number[] | null;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  logicalOperator?: 'AND' | 'OR';
  parentGroup?: string;
}

export interface RuleAction {
  id: string;
  type: 'route_to_stage' | 'assign_user' | 'send_notification' | 'set_priority' | 'escalate' | 'add_comment' | 'require_approval';
  parameters: Record<string, unknown>;
  delay?: number;
  conditions?: string[];
  target?: string;
  value?: string | number | boolean | Record<string, unknown> | null;
}

export interface RuleTrigger {
  id: string;
  type: 'onCreate' | 'onUpdate' | 'onStatusChange' | 'onSlaBreach' | 'manual' | 'scheduled';
  conditions?: RuleCondition[];
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    startDate: Date;
    endDate?: Date;
    timeOfDay: string;
    daysOfWeek?: number[];
  };
}

export interface RuleException {
  id: string;
  type: 'validation' | 'timeout' | 'rejection' | 'error' | 'conflict';
  message: string;
  handler: 'retry' | 'escalate' | 'notify' | 'abort' | 'skip';
  maxRetries?: number;
  retryDelay?: number;
  notifyUsers?: string[];
  escalationPath?: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  category: 'routing' | 'approval' | 'escalation' | 'notification' | 'validation';
  conditions: RuleCondition[];
  actions: RuleAction[];
  triggers: RuleTrigger[];
  exceptions: RuleException[];
  lastModified: Date;
  modifiedBy: string;
  testResults?: RuleTestResult[];
  isValid: boolean;
  validationErrors: string[];
  version?: number;
  tags?: string[];
  scope?: {
    type: 'global' | 'team' | 'project' | 'user';
    id: string;
    name: string;
  };
}

export interface RuleTestResult {
  id: string;
  testCase: string;
  input: Record<string, unknown>;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
  timestamp: Date;
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  rules: Array<Partial<WorkflowRule>>;
  useCase: string;
  popularity: number;
}

export interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  complexity: 'low' | 'medium' | 'high';
  performance: 'fast' | 'moderate' | 'slow';
}

export interface ApprovalTask {
  id: string;
  type: 'proposal_review' | 'technical_validation' | 'budget_approval' | 'executive_sign_off';
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  dueDate: Date;
  proposalId: string;
  proposalTitle: string;
  estimatedTime: number;
  actualTime?: number;
  dependencies: string[];
  tags: string[];
  slaCompliance: number;
  businessValue: number;
  urgencyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  currentStage: string;
  nextStage?: string;
  comments: unknown[];
  attachments: unknown[];
  metadata: Record<string, unknown>;
}
