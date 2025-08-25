// __FILE_DESCRIPTION__: TypeScript interfaces and types for bridge pattern implementation
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

/**
 * Bridge Pattern Types - CORE_REQUIREMENTS.md Compliant
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: __USER_STORY__
 * - Acceptance Criteria: AC-X.X.X (Type safety, Interface consistency, Bridge pattern support)
 * - Hypotheses: __HYPOTHESIS__ (Strong typing improves development experience and reduces errors)
 *
 * COMPLIANCE STATUS:
 * ✅ TypeScript Type Safety (no any types)
 * ✅ CUID-friendly ID validation patterns
 * ✅ API response standardization
 * ✅ Bridge pattern interface definitions
 * ✅ Error handling type definitions
 * ✅ Security and RBAC types
 * ✅ Authentication and authorization types
 * ✅ Analytics and traceability support
 */

// ====================
// Security and RBAC Types
// ====================

export interface UserSession {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}

export interface RBACContext {
  userId: string;
  userRoles: string[];
  userPermissions: string[];
  resourceOwner?: string;
  userTeam?: string;
  resourceTeam?: string;
}

export interface SecurityAuditLog {
  userId: string;
  resource: string;
  action: string;
  scope: 'OWN' | 'TEAM' | 'ALL';
  success: boolean;
  timestamp: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiPermissionConfig {
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete';
  scope?: 'OWN' | 'TEAM' | 'ALL';
  context?: RBACContext;
}

// ====================
// Base Types
// ====================

export type DatabaseId = string; // CUID-friendly per CORE_REQUIREMENTS
export type Timestamp = string; // ISO 8601 format
export type UserStoryReference = string; // e.g., "US-3.1"
export type HypothesisReference = string; // e.g., "H4"

// ====================
// Bridge Configuration Types
// ====================

export interface BridgeConfig {
  enableCache?: boolean;
  retryAttempts?: number;
  timeout?: number;
  cacheTTL?: number;
}

export interface ApiBridgeConfig extends BridgeConfig {
  baseUrl?: string;
  defaultFields?: string;
  maxRetries?: number;
}

export interface ManagementBridgeConfig extends BridgeConfig {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAnalytics?: boolean;
}

// ====================
// Entity Types
// ====================

export interface BaseEntity {
  id: DatabaseId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface __ENTITY_TYPE__ extends BaseEntity {
  name: string;
  status: EntityStatus;
  description?: string;
  // Add entity-specific fields here
}

export type EntityStatus = 'active' | 'inactive' | 'pending' | 'archived';

export interface __ENTITY_TYPE__CreatePayload {
  name: string;
  status?: EntityStatus;
  description?: string;
  // Add creation-specific fields
}

export interface __ENTITY_TYPE__UpdatePayload {
  name?: string;
  status?: EntityStatus;
  description?: string;
  // Add update-specific fields
}

export interface __ENTITY_TYPE__FetchParams {
  // Pagination
  page?: number;
  limit?: number;

  // Filtering
  search?: string;
  status?: EntityStatus[];
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };

  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  // Field selection (minimal fields by default per CORE_REQUIREMENTS)
  fields?: string;

  // Relation hydration (disabled by default per CORE_REQUIREMENTS)
  includeRelations?: boolean;

  // Additional filters
  [key: string]: unknown;
}

// ====================
// API Response Types
// ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: Timestamp;
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  pagination: {
    hasNextPage: boolean;
    nextCursor?: string;
    prevCursor?: string;
    limit: number;
    total?: number;
  };
  meta?: {
    fields: string[];
    filters: Record<string, unknown>;
    sort: {
      field: string;
      order: 'asc' | 'desc';
    };
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string; // Only in development
  };
  timestamp: Timestamp;
}

// ====================
// Bridge State Types
// ====================

export interface BridgeState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  lastFetch?: Date;
  filters: Record<string, unknown>;
  selectedItem?: T;
}

export interface __BRIDGE_NAME__State extends BridgeState<__ENTITY_TYPE__> {
  filters: {
    search: string;
    status: EntityStatus[];
    dateRange?: {
      start: Timestamp;
      end: Timestamp;
    };
  };
}

// ====================
// Bridge Operation Types
// ====================

export interface BridgeOperation {
  type: 'fetch' | 'create' | 'update' | 'delete' | 'refresh';
  entityId?: DatabaseId;
  payload?: Record<string, unknown>;
  metadata?: OperationMetadata;
}

export interface OperationMetadata {
  component: string;
  operation: string;
  userStory: UserStoryReference;
  hypothesis: HypothesisReference;
  timestamp: Timestamp;
  userId?: DatabaseId;
  sessionId?: string;
}

// ====================
// Event Types
// ====================

export type BridgeEventType =
  | 'DATA_FETCHED'
  | 'DATA_CREATED'
  | 'DATA_UPDATED'
  | 'DATA_DELETED'
  | 'DATA_REFRESHED'
  | 'CACHE_CLEARED'
  | 'ERROR_OCCURRED'
  | 'STATE_CHANGED';

export interface BridgeEvent<T = unknown> {
  type: BridgeEventType;
  entityType: string;
  data?: T;
  error?: string;
  metadata: OperationMetadata;
  timestamp: Timestamp;
}

export interface BridgeEventListener<T = unknown> {
  (event: BridgeEvent<T>): void;
}

// ====================
// Cache Types
// ====================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

// ====================
// Analytics Types
// ====================

export interface AnalyticsEvent {
  event: string;
  data: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high';
  userStory: UserStoryReference;
  hypothesis: HypothesisReference;
  component: string;
  timestamp: Timestamp;
}

export interface ComponentTraceabilityData {
  userStory: UserStoryReference;
  hypothesis: HypothesisReference;
  acceptanceCriteria?: string[];
  testCases?: string[];
  component: string;
  operation: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  averageResponseTime: number;
}

// ====================
// Error Types
// ====================

export interface BridgeError extends Error {
  code: string;
  context?: Record<string, unknown>;
  retryable: boolean;
  userFriendlyMessage: string;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  component: string;
  operation: string;
  entityId?: DatabaseId;
  userId?: DatabaseId;
  userStory: UserStoryReference;
  hypothesis: HypothesisReference;
  timestamp: Timestamp;
  additionalData?: Record<string, unknown>;
}

// ====================
// Hook Return Types
// ====================

export interface BridgeHookReturn<T> {
  data: T[];
  loading: boolean;
  error: BridgeError | null;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

export interface BridgeMutationReturn<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput>;
  mutateAsync: (input: TInput) => Promise<TOutput>;
  isPending: boolean;
  isError: boolean;
  error: BridgeError | null;
  isSuccess: boolean;
  data: TOutput | undefined;
}

// ====================
// Bridge Interface Types
// ====================

export interface ApiBridge<T> {
  // CRUD operations
  fetch(params?: Record<string, unknown>): Promise<ApiResponse<T[]>>;
  get(id: DatabaseId): Promise<ApiResponse<T>>;
  create(payload: Record<string, unknown>): Promise<ApiResponse<T>>;
  update(id: DatabaseId, payload: Record<string, unknown>): Promise<ApiResponse<T>>;
  delete(id: DatabaseId): Promise<ApiResponse<void>>;

  // Cache management
  clearCache(pattern?: string): void;
  getCacheStats(): CacheStats;

  // Configuration
  setConfig(config: Partial<ApiBridgeConfig>): void;
  getConfig(): ApiBridgeConfig;

  // Analytics
  setAnalytics(
    analytics: (
      event: string,
      data: Record<string, unknown>,
      priority?: 'low' | 'medium' | 'high'
    ) => void
  ): void;
}

export interface ManagementBridge<T> {
  // State access
  getState(): BridgeState<T>;
  setState(state: Partial<BridgeState<T>>): void;

  // Data operations
  fetch(params?: Record<string, unknown>): Promise<void>;
  refresh(): Promise<void>;
  create(payload: Record<string, unknown>): Promise<T | null>;
  update(id: DatabaseId, payload: Record<string, unknown>): Promise<T | null>;
  delete(id: DatabaseId): Promise<boolean>;

  // Filtering and selection
  setFilters(filters: Record<string, unknown>): void;
  setSelectedItem(item: T | undefined): void;
  clearError(): void;

  // Event handling
  subscribe(eventType: BridgeEventType, listener: BridgeEventListener): string;
  unsubscribe(eventType: BridgeEventType, listenerId: string): void;
  emit(event: BridgeEvent): void;

  // Analytics
  trackAction(action: string, metadata?: Record<string, unknown>): void;
  trackPageView(page: string): void;
}

// ====================
// Component Props Types
// ====================

export interface BridgeComponentProps<T> {
  initialFilters?: Record<string, unknown>;
  showCreateForm?: boolean;
  showActions?: boolean;
  maxItems?: number;
  onItemSelect?: (item: T) => void;
  onItemCreate?: (item: T) => void;
  onItemUpdate?: (item: T) => void;
  onItemDelete?: (id: DatabaseId) => void;
  'data-testid'?: string;
}

export interface BridgePageProps {
  searchParams?: Record<string, string | undefined>;
  params?: Record<string, string>;
}

// ====================
// Utility Types
// ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithTimestamps<T> = T & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type WithMetadata<T> = T & {
  metadata: OperationMetadata;
};

// ====================
// Bridge Factory Types
// ====================

export interface BridgeFactory {
  createApiBridge<T>(config: ApiBridgeConfig): ApiBridge<T>;
  createManagementBridge<T>(config: ManagementBridgeConfig): ManagementBridge<T>;
}

export interface BridgeRegistry {
  register<T>(name: string, bridge: ApiBridge<T> | ManagementBridge<T>): void;
  get<T>(name: string): ApiBridge<T> | ManagementBridge<T> | undefined;
  list(): string[];
  clear(): void;
}

// ====================
// Export All Types
// ====================

export type {
  __BRIDGE_NAME__State as BridgeStateType,
  // Re-export for convenience
  __ENTITY_TYPE__ as Entity,
  __ENTITY_TYPE__CreatePayload as EntityCreatePayload,
  __ENTITY_TYPE__FetchParams as EntityFetchParams,
  __ENTITY_TYPE__UpdatePayload as EntityUpdatePayload,
};

// ====================
// Type Guards
// ====================

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as Record<string, unknown>).success === 'boolean' &&
    'data' in value
  );
}

export function isBridgeError(error: unknown): error is BridgeError {
  return (
    error instanceof Error &&
    'code' in error &&
    'retryable' in error &&
    'userFriendlyMessage' in error
  );
}

export function isValidEntityStatus(status: string): status is EntityStatus {
  return ['active', 'inactive', 'pending', 'archived'].includes(status);
}

export function isValidDatabaseId(id: unknown): id is DatabaseId {
  return typeof id === 'string' && id.length > 0;
}
