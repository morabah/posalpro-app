/**
 * PosalPro MVP2 - Authentication System Types
 * Based on DATA_MODEL.md specifications
 * Enhanced RBAC with analytics and audit capabilities
 */

// ========================================
// ENUMS
// ========================================

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum PermissionScope {
  ALL = 'ALL',
  TEAM = 'TEAM',
  OWN = 'OWN',
}

export enum ContextOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
}

export enum ContextEffect {
  GRANT = 'GRANT',
  DENY = 'DENY',
}

export enum TemporaryAccessStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum TrendDirection {
  IMPROVING = 'IMPROVING',
  DECLINING = 'DECLINING',
  STABLE = 'STABLE',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AuditCategory {
  DATA = 'DATA',
  ACCESS = 'ACCESS',
  CONFIGURATION = 'CONFIGURATION',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
}

export enum SecurityEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_ACCESS = 'DATA_ACCESS',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SecurityEventStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
}

export enum NotificationRecipientType {
  USER = 'USER',
  ROLE = 'ROLE',
  GROUP = 'GROUP',
  EXTERNAL = 'EXTERNAL',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  WEBHOOK = 'WEBHOOK',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  READ = 'READ',
}

export enum AccessibilityLevel {
  AA = 'AA',
  AAA = 'AAA',
}

export enum AccessibilityTestType {
  AUTOMATED = 'AUTOMATED',
  MANUAL = 'MANUAL',
  USER_TESTING = 'USER_TESTING',
}

export enum AccessibilityStandard {
  WCAG_2_1_AA = 'WCAG_2_1_AA',
  WCAG_2_1_AAA = 'WCAG_2_1_AAA',
  SECTION_508 = 'SECTION_508',
  EN_301_549 = 'EN_301_549',
}

export enum HypothesisType {
  H1 = 'H1',
  H3 = 'H3',
  H4 = 'H4',
  H6 = 'H6',
  H7 = 'H7',
  H8 = 'H8',
}

// ========================================
// CORE USER MANAGEMENT TYPES
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // Hashed with bcrypt
  department: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;

  // Relationships
  roles?: UserRole[];
  permissions?: UserPermission[];
  preferences?: UserPreferences;
  analyticsProfile?: UserAnalyticsProfile;
  temporaryAccess?: TemporaryAccess[];

  // Audit and Security
  auditLogs?: AuditLog[];
  securityEvents?: SecurityEvent[];
  sessions?: UserSession[];

  // Communication
  communicationPrefs?: CommunicationPreferences;
  notificationDeliveries?: NotificationDelivery[];

  // Accessibility
  accessibilityConfig?: AccessibilityConfiguration;

  // Analytics Events
  hypothesisEvents?: HypothesisValidationEvent[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // Hierarchy level
  isSystem: boolean; // System roles cannot be modified
  createdAt: Date;
  updatedAt: Date;

  // Hierarchy
  parentId?: string;
  parent?: Role;
  children?: Role[];

  // Relationships
  permissions?: RolePermission[];
  userRoles?: UserRole[];
  contextRules?: ContextRule[];

  // Performance Expectations
  performanceExpectations?: Record<string, number>;
}

export interface Permission {
  id: string;
  resource: string; // e.g., 'proposals', 'products'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  scope: PermissionScope;
  constraints?: Record<string, unknown>; // Additional constraints
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  rolePermissions?: RolePermission[];
  userPermissions?: UserPermission[];
}

// ========================================
// RBAC JUNCTION TYPES
// ========================================

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  user: User;
  role: Role;
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  role: Role;
  permission: Permission;
  grantedAt: Date;
  grantedBy: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  user: User;
  permission: Permission;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  isActive: boolean;
}

// ========================================
// ENHANCED RBAC FEATURES
// ========================================

export interface ContextRule {
  id: string;
  roleId: string;
  role: Role;
  attribute: string; // e.g., 'time', 'location', 'customerTier'
  operator: ContextOperator;
  value: unknown; // Flexible value storage
  effect: ContextEffect;
  createdAt: Date;
}

export interface TemporaryAccess {
  id: string;
  userId: string;
  roleId: string;
  grantedBy: string;
  reason: string;
  expiresAt: Date;
  status: TemporaryAccessStatus;
  user: User;
  createdAt: Date;
  revokedAt?: Date;
  revokedBy?: string;
}

// ========================================
// USER PREFERENCES AND ANALYTICS
// ========================================

export interface UserPreferences {
  id: string;
  userId: string;
  user: User;
  theme: 'light' | 'dark' | 'system';
  language: string;
  analyticsConsent: boolean;
  performanceTracking: boolean;
  dashboardLayout?: LayoutConfiguration;
  updatedAt: Date;
}

export interface LayoutConfiguration {
  layout: string;
  components: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: Record<string, unknown>;
  }>;
  theme: string;
}

export interface UserAnalyticsProfile {
  id: string;
  userId: string;
  user: User;
  performanceMetrics: Record<string, number>;
  hypothesisContributions: Record<string, number>;
  skillAssessments: Record<string, number>;
  efficiencyRatings: Record<string, number>;
  lastAssessment: Date;
  performanceTrends?: PerformanceTrend[];
}

export interface PerformanceTrend {
  id: string;
  profileId: string;
  profile: UserAnalyticsProfile;
  metric: string;
  values: Array<{ date: Date; value: number }>;
  trend: TrendDirection;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// SECURITY AND AUDIT
// ========================================

export interface UserSession {
  id: string;
  userId: string;
  user: User;
  sessionToken: string;
  refreshToken?: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastUsed: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  userRole?: string;
  action: string;
  entity: string;
  entityId: string;
  changes: AuditChange[];
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  severity: AuditSeverity;
  category: AuditCategory;
  timestamp: Date;
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'create' | 'update' | 'delete';
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  user?: User;
  type: SecurityEventType;
  ipAddress: string;
  details: Record<string, unknown>;
  riskLevel: RiskLevel;
  status: SecurityEventStatus;
  timestamp: Date;
  responses?: SecurityResponse[];
}

export interface SecurityResponse {
  id: string;
  eventId: string;
  event: SecurityEvent;
  action: string;
  performedBy: string;
  result: string;
  notes?: string;
  timestamp: Date;
}

// ========================================
// COMMUNICATION AND NOTIFICATIONS
// ========================================

export interface CommunicationPreferences {
  id: string;
  userId: string;
  user: User;
  language: string;
  timezone: string;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
  channels: ChannelPreference[];
  frequency: FrequencySettings;
  categories: CategoryPreference[];
  updatedAt: Date;
}

export interface ChannelPreference {
  channel: NotificationChannel;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface FrequencySettings {
  immediate: boolean;
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
  custom?: {
    interval: number;
    unit: 'minutes' | 'hours' | 'days';
  };
}

export interface CategoryPreference {
  category: string;
  enabled: boolean;
  channels: NotificationChannel[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationDelivery {
  id: string;
  templateId: string;
  recipientId: string;
  recipient: User;
  recipientType: NotificationRecipientType;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  attempts: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// ========================================
// ACCESSIBILITY
// ========================================

export interface AccessibilityConfiguration {
  id: string;
  userId: string;
  user: User;
  complianceLevel: AccessibilityLevel;
  preferences: AccessibilityPreferences;
  assistiveTechnology: AssistiveTechInfo[];
  customizations: UICustomization[];
  lastUpdated: Date;
  testResults?: AccessibilityTestResult[];
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  colorBlindnessType?: 'protanopia' | 'deuteranopia' | 'tritanopia';
  fontSize: number;
  lineHeight: number;
}

export interface AssistiveTechInfo {
  type: 'screen_reader' | 'magnifier' | 'voice_control' | 'keyboard_only';
  name: string;
  version?: string;
  settings: Record<string, unknown>;
}

export interface UICustomization {
  target: string; // CSS selector or component ID
  property: string;
  value: string | number;
  condition?: string;
}

export interface AccessibilityTestResult {
  id: string;
  configId: string;
  config: AccessibilityConfiguration;
  testType: AccessibilityTestType;
  standard: AccessibilityStandard;
  component: string;
  passed: boolean;
  violations: AccessibilityViolation[];
  testedAt: Date;
  testedBy: string;
  environment: string;
}

export interface AccessibilityViolation {
  rule: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  element: string;
  suggestion?: string;
}

// ========================================
// ANALYTICS AND MEASUREMENT
// ========================================

export interface HypothesisValidationEvent {
  id: string;
  userId: string;
  user: User;
  hypothesis: HypothesisType;
  userStoryId: string;
  componentId: string;
  action: string;
  measurementData: Record<string, unknown>;
  targetValue: number;
  actualValue: number;
  performanceImprovement: number;
  userRole: string;
  sessionId: string;
  testCaseId?: string;
  timestamp: Date;
}

// ========================================
// AUTHENTICATION SPECIFIC TYPES
// ========================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  department: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  permissions: string[];
  roles: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ========================================
// PERMISSION CHECK TYPES
// ========================================

export interface PermissionCheckRequest {
  userId: string;
  resource: string;
  action: string;
  context?: Record<string, unknown>;
}

export interface PermissionCheckResponse {
  granted: boolean;
  reason?: string;
  constraints?: Record<string, unknown>;
}

// ========================================
// RBAC ADMINISTRATION TYPES
// ========================================

export interface CreateRoleRequest {
  name: string;
  description: string;
  level: number;
  parentId?: string;
  permissions: string[];
  performanceExpectations?: Record<string, number>;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
  expiresAt?: Date;
  reason?: string;
}

export interface GrantTemporaryAccessRequest {
  userId: string;
  roleId: string;
  reason: string;
  expiresAt: Date;
}

// ========================================
// ANALYTICS QUERY TYPES
// ========================================

export interface UserAnalyticsQuery {
  userId?: string;
  hypothesis?: HypothesisType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  metrics?: string[];
}

export interface SystemAnalyticsResponse {
  totalUsers: number;
  activeUsers: number;
  hypothesisMetrics: Record<
    HypothesisType,
    {
      totalEvents: number;
      averageImprovement: number;
      targetAchievement: number;
    }
  >;
  securityMetrics: {
    totalEvents: number;
    riskDistribution: Record<RiskLevel, number>;
    resolvedEvents: number;
  };
  performanceTrends: Array<{
    metric: string;
    trend: TrendDirection;
    improvement: number;
  }>;
}
