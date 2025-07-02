// Enhanced API Types for Type Safety Improvements
// Phase 1: Type Safety Enhancement - PosalPro MVP2

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface QueryFilters {
  search?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

// Specific API Data Types
export interface ProposalApiData {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deadline?: string | Date | null;
  estimatedValue?: number | null;
  riskLevel?: 'low' | 'medium' | 'high';
  completionRate?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UserApiData {
  id: string;
  email: string;
  name?: string;
  roles: {
    id: string;
    role: {
      name: string;
      permissions: string[];
    };
  }[];
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerApiData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  proposals?: ProposalApiData[];
}

export interface ProductApiData {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: string;
  price?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowApiData {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  steps: WorkflowStepData[];
  rules: WorkflowRuleData[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepData {
  id: string;
  name: string;
  type: string;
  order: number;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  metadata?: Record<string, unknown>;
}

export interface WorkflowRuleData {
  id: string;
  name: string;
  type: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  triggers: WorkflowTrigger[];
  exceptions: WorkflowException[];
  isActive: boolean;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface WorkflowCondition {
  id: string;
  type: string;
  field: string;
  operator: string;
  value: string | number | boolean;
  metadata?: Record<string, unknown>;
}

export interface WorkflowAction {
  id: string;
  type: string;
  target: string;
  parameters: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTrigger {
  id: string;
  type: string;
  event: string;
  conditions?: WorkflowCondition[];
  metadata?: Record<string, unknown>;
}

export interface WorkflowException {
  id: string;
  type: string;
  condition: WorkflowCondition;
  action: WorkflowAction;
  metadata?: Record<string, unknown>;
}

// Analytics Data Types
export interface AnalyticsEventData {
  eventType: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  properties: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface AnalyticsDashboardData {
  summary: {
    totalProposals: number;
    activeUsers: number;
    completionRate: number;
    avgResponseTime: number;
  };
  charts: {
    proposalTrends: ChartDataPoint[];
    userActivity: ChartDataPoint[];
    performanceMetrics: ChartDataPoint[];
  };
  healthScore: number;
  lastUpdated: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

// Search and Content Types
export interface SearchResult {
  id: string;
  type: 'proposal' | 'customer' | 'product' | 'content';
  title: string;
  description?: string;
  relevanceScore: number;
  highlightedText?: string;
  metadata?: Record<string, unknown>;
}

export interface ContentApiData {
  id: string;
  title: string;
  type: string;
  content: string;
  tags: string[];
  category: string;
  status: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

// Database Operation Types
export interface DatabaseSyncResult {
  tableName: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  recordsProcessed?: number;
  differences?: {
    field: string;
    localValue: unknown;
    cloudValue: unknown;
  }[];
}

// Admin and System Types
export interface SystemHealthData {
  status: 'healthy' | 'warning' | 'error';
  services: {
    database: ServiceStatus;
    api: ServiceStatus;
    authentication: ServiceStatus;
    analytics: ServiceStatus;
  };
  metrics: Record<string, number>;
  lastCheck: string;
}

export interface ServiceStatus {
  status: 'healthy' | 'warning' | 'error';
  responseTime?: number;
  errorRate?: number;
  uptime?: number;
  message?: string;
}

// Validation and Form Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
  metadata?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

// Error Handling Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

// Update Operation Types
export interface UpdateOperation<T = Record<string, unknown>> {
  id: string;
  data: Partial<T>;
  metadata?: Record<string, unknown>;
}

// Batch Operation Types
export interface BatchOperation<T = Record<string, unknown>> {
  operation: 'create' | 'update' | 'delete';
  data: T[];
  options?: {
    skipValidation?: boolean;
    continueOnError?: boolean;
  };
}

export interface BatchResult<T = Record<string, unknown>> {
  successful: T[];
  failed: {
    data: T;
    error: ApiError;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
