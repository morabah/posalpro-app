/**
 * PosalPro MVP2 - Error Codes
 * Standardized error codes for consistent error handling across the application
 */

// Error categories
export enum ErrorCategory {
  // System-level errors
  SYSTEM = 'SYSTEM',

  // Authentication and authorization errors
  AUTH = 'AUTH',

  // Security-specific errors
  SECURITY = 'SECURITY',

  // Validation errors (input validation, business rules)
  VALIDATION = 'VALIDATION',

  // Database and data access errors
  DATA = 'DATA',

  // API and external service errors
  API = 'API',

  // Business logic errors
  BUSINESS = 'BUSINESS',

  // UI and client-side errors
  UI = 'UI',

  // AI and machine learning errors
  AI = 'AI',

  // Analytics and tracking errors
  ANALYTICS = 'ANALYTICS',

  // Performance errors
  PERFORMANCE = 'PERFORMANCE',
}

// Error codes organized by category
export const ErrorCodes = {
  // System errors (1000-1999)
  [ErrorCategory.SYSTEM]: {
    UNKNOWN: 'SYS_1000',
    CONFIGURATION: 'SYS_1001',
    INITIALIZATION: 'SYS_1002',
    INITIALIZATION_FAILED: 'SYS_1003',
    RESOURCE_EXHAUSTED: 'SYS_1004',
    TIMEOUT: 'SYS_1005',
    DEPENDENCY_FAILURE: 'SYS_1006',
    INTERNAL_ERROR: 'SYS_1007',
    METRICS_COLLECTION_FAILED: 'SYS_1008',
    OPTIMIZATION_FAILED: 'SYS_1009',
    CACHE_OPERATION_FAILED: 'SYS_1010',
    REPORT_GENERATION_FAILED: 'SYS_1011',
    MONITORING_SETUP_FAILED: 'SYS_1012',
    COMPONENT_LOAD_FAILED: 'SYS_1013',
    DEBUG_INFO: 'SYS_1014',
    DETECTION_FAILED: 'SYS_1015',
    PERFORMANCE_MEASUREMENT_FAILED: 'SYS_1016',
    PRELOAD_FAILED: 'SYS_1017',
    CLEANUP_FAILED: 'SYS_1018',
  },

  // Authentication errors (2000-2999)
  [ErrorCategory.AUTH]: {
    UNAUTHORIZED: 'AUTH_2000',
    INVALID_CREDENTIALS: 'AUTH_2001',
    SESSION_EXPIRED: 'AUTH_2002',
    INSUFFICIENT_PERMISSIONS: 'AUTH_2003',
    ACCOUNT_LOCKED: 'AUTH_2004',
    INVALID_TOKEN: 'AUTH_2005',
    MISSING_TOKEN: 'AUTH_2006',
    FORBIDDEN: 'AUTH_2007',
    PERMISSION_DENIED: 'AUTH_2008',
    REGISTRATION_FAILED: 'AUTH_2009',
    LOGOUT_FAILED: 'AUTH_2010',
    TOKEN_REFRESH_FAILED: 'AUTH_2011',
    SESSION_INVALID: 'AUTH_2012',
    PASSWORD_RESET_FAILED: 'AUTH_2013',
    PASSWORD_CHANGE_FAILED: 'AUTH_2014',
    EMAIL_VERIFICATION_FAILED: 'AUTH_2015',
    AUTHORIZATION_FAILED: 'AUTH_2016',
  },

  // Security errors (2500-2999)
  [ErrorCategory.SECURITY]: {
    RATE_LIMIT_EXCEEDED: 'SEC_2500',
    SUSPICIOUS_ACTIVITY: 'SEC_2501',
    BRUTE_FORCE_DETECTED: 'SEC_2502',
    INVALID_SESSION: 'SEC_2503',
    CSRF_TOKEN_INVALID: 'SEC_2504',
    IP_BLOCKED: 'SEC_2505',
    SECURITY_VIOLATION: 'SEC_2506',
    TWO_FACTOR_SETUP_FAILED: 'SEC_2507',
    TWO_FACTOR_VERIFICATION_FAILED: 'SEC_2508',
    TWO_FACTOR_DISABLE_FAILED: 'SEC_2509',
  },

  // Validation errors (3000-3999)
  [ErrorCategory.VALIDATION]: {
    INVALID_INPUT: 'VAL_3000',
    REQUIRED_FIELD: 'VAL_3001',
    INVALID_FORMAT: 'VAL_3002',
    CONSTRAINT_VIOLATION: 'VAL_3003',
    BUSINESS_RULE_VIOLATION: 'VAL_3004',
    INVALID_STATE: 'VAL_3005',
    DUPLICATE_ENTRY: 'VAL_3006',
    DUPLICATE_ENTITY: 'VAL_3007',
    PROCESSING: 'VAL_3008',
    SUCCESS: 'VAL_3009',
    OPERATION_FAILED: 'VAL_3010',
    CRITICAL_ERROR: 'VAL_3011',
    PARTIAL_SUCCESS: 'VAL_3012',
  },

  // Data errors (4000-4999)
  [ErrorCategory.DATA]: {
    NOT_FOUND: 'DATA_4000',
    ALREADY_EXISTS: 'DATA_4001',
    CONFLICT: 'DATA_4002',
    DATABASE_ERROR: 'DATA_4003',
    QUERY_FAILED: 'DATA_4004',
    TRANSACTION_FAILED: 'DATA_4005',
    INTEGRITY_VIOLATION: 'DATA_4006',
    STALE_DATA: 'DATA_4007',
    TIMEOUT: 'DATA_4008',
    CREATE_FAILED: 'DATA_4009',
    UPDATE_FAILED: 'DATA_4010',
    DELETE_FAILED: 'DATA_4011',
    RETRIEVAL_FAILED: 'DATA_4012',
    DUPLICATE_ENTRY: 'DATA_4013',
    FETCH_FAILED: 'DATA_4014',
    SEARCH_FAILED: 'DATA_4015',
    CALCULATION_FAILED: 'DATA_4016',
    QUERY_EXECUTION_FAILED: 'DATA_4017',
    CONNECTION_POOL_EXHAUSTED: 'DATA_4018',
    SLOW_QUERY_DETECTED: 'DATA_4019',
  },

  // API errors (5000-5999)
  [ErrorCategory.API]: {
    REQUEST_FAILED: 'API_5000',
    RESPONSE_ERROR: 'API_5001',
    NETWORK_ERROR: 'API_5002',
    TIMEOUT: 'API_5003',
    RATE_LIMIT: 'API_5004',
    SERVICE_UNAVAILABLE: 'API_5005',
    INVALID_RESPONSE: 'API_5006',
    EXTERNAL_SERVICE_ERROR: 'API_5007',
  },

  // Business logic errors (6000-6999)
  [ErrorCategory.BUSINESS]: {
    PROCESS_FAILED: 'BUS_6000',
    INVALID_OPERATION: 'BUS_6001',
    PRECONDITION_FAILED: 'BUS_6002',
    WORKFLOW_ERROR: 'BUS_6003',
    BUSINESS_CONSTRAINT: 'BUS_6004',
    RESOURCE_LIMIT: 'BUS_6005',
  },

  // UI errors (7000-7999)
  [ErrorCategory.UI]: {
    RENDERING_ERROR: 'UI_7000',
    COMPONENT_ERROR: 'UI_7001',
    STATE_ERROR: 'UI_7002',
    INTERACTION_ERROR: 'UI_7003',
  },

  // AI errors (8000-8999)
  [ErrorCategory.AI]: {
    PROCESSING_FAILED: 'AI_8000',
    MODEL_ERROR: 'AI_8001',
    INVALID_RESPONSE: 'AI_8002',
    CONTENT_FILTER: 'AI_8003',
    RATE_LIMIT: 'AI_8004',
    CONTEXT_OVERFLOW: 'AI_8005',
  },

  // Analytics errors (9000-9999)
  [ErrorCategory.ANALYTICS]: {
    TRACKING_ERROR: 'ANA_9000',
    PROCESSING_FAILED: 'ANA_9001',
    INVALID_EVENT: 'ANA_9002',
    STORAGE_ERROR: 'ANA_9003',
    ANALYTICS_FAILED: 'ANA_9004',
    TRACKING_FAILED: 'ANA_9005',
  },

  // Performance errors (3500-3599)
  PERFORMANCE: {
    SLOW_RESPONSE: 'PERF_3500',
    HIGH_MEMORY_USAGE: 'PERF_3501',
    RESOURCE_EXHAUSTED: 'PERF_3502',
    OPTIMIZATION_FAILED: 'PERF_3503',
    CACHE_MISS: 'PERF_3504',
    BUNDLE_SIZE_EXCEEDED: 'PERF_3505',
  },
};

// Helper type for accessing error codes
export type ErrorCode =
  (typeof ErrorCodes)[ErrorCategory.SYSTEM][keyof (typeof ErrorCodes)[ErrorCategory.SYSTEM]];

// Map from error code to HTTP status code
export const errorCodeToHttpStatus: Record<ErrorCode, number> = {
  // System errors
  SYS_1000: 500, // Unknown error
  SYS_1001: 500, // Configuration error
  SYS_1002: 500, // Initialization error
  SYS_1003: 503, // Resource exhausted
  SYS_1004: 504, // Timeout
  SYS_1005: 502, // Dependency failure
  SYS_1006: 500, // Internal error

  // Authentication errors
  AUTH_2000: 401, // Unauthorized
  AUTH_2001: 401, // Invalid credentials
  AUTH_2002: 401, // Session expired
  AUTH_2003: 403, // Insufficient permissions
  AUTH_2004: 403, // Account locked
  AUTH_2005: 401, // Invalid token
  AUTH_2006: 401, // Missing token
  AUTH_2007: 403, // Forbidden
  AUTH_2008: 403, // Permission denied
  AUTH_2009: 400, // Registration failed
  AUTH_2010: 500, // Logout failed
  AUTH_2011: 401, // Token refresh failed
  AUTH_2012: 401, // Session invalid
  AUTH_2013: 400, // Password reset failed
  AUTH_2014: 400, // Password change failed
  AUTH_2015: 400, // Email verification failed
  AUTH_2016: 403, // Authorization failed

  // Security errors
  SEC_2500: 429, // Rate limit exceeded
  SEC_2501: 403, // Suspicious activity
  SEC_2502: 429, // Brute force detected
  SEC_2503: 401, // Invalid session
  SEC_2504: 403, // CSRF token invalid
  SEC_2505: 403, // IP blocked
  SEC_2506: 403, // Security violation
  SEC_2507: 400, // Two factor setup failed
  SEC_2508: 401, // Two factor verification failed
  SEC_2509: 400, // Two factor disable failed

  // Validation errors
  VAL_3000: 400, // Invalid input
  VAL_3001: 400, // Required field
  VAL_3002: 400, // Invalid format
  VAL_3003: 400, // Constraint violation
  VAL_3004: 422, // Business rule violation
  VAL_3005: 422, // Invalid state
  VAL_3006: 409, // Duplicate entry
  VAL_3007: 409, // Duplicate entity
  VAL_3008: 400, // Processing
  VAL_3009: 400, // Success
  VAL_3010: 400, // Operation failed
  VAL_3011: 400, // Critical error
  VAL_3012: 400, // Partial success

  // Data errors
  DATA_4000: 404, // Not found
  DATA_4001: 409, // Already exists
  DATA_4002: 409, // Conflict
  DATA_4003: 500, // Database error
  DATA_4004: 500, // Query failed
  DATA_4005: 500, // Transaction failed
  DATA_4006: 500, // Integrity violation
  DATA_4007: 409, // Stale data
  DATA_4008: 504, // Timeout
  DATA_4009: 500, // Create failed
  DATA_4010: 500, // Update failed
  DATA_4011: 500, // Delete failed
  DATA_4012: 500, // Retrieval failed
  DATA_4013: 409, // Duplicate entry
  DATA_4014: 500, // Fetch failed
  DATA_4015: 500, // Search failed
  DATA_4016: 500, // Calculation failed
  DATA_4017: 500, // Query execution failed
  DATA_4018: 429, // Connection pool exhausted
  DATA_4019: 429, // Slow query detected

  // API errors
  API_5000: 400, // Request failed
  API_5001: 500, // Response error
  API_5002: 503, // Network error
  API_5003: 504, // Timeout
  API_5004: 429, // Rate limit
  API_5005: 503, // Service unavailable
  API_5006: 502, // Invalid response
  API_5007: 502, // External service error

  // Business logic errors
  BUS_6000: 422, // Process failed
  BUS_6001: 422, // Invalid operation
  BUS_6002: 412, // Precondition failed
  BUS_6003: 422, // Workflow error
  BUS_6004: 422, // Business constraint
  BUS_6005: 429, // Resource limit

  // UI errors
  UI_7000: 500, // Rendering error
  UI_7001: 500, // Component error
  UI_7002: 500, // State error
  UI_7003: 400, // Interaction error

  // AI errors
  AI_8000: 500, // Processing failed
  AI_8001: 500, // Model error
  AI_8002: 422, // Invalid response
  AI_8003: 422, // Content filter
  AI_8004: 429, // Rate limit
  AI_8005: 413, // Context overflow

  // Analytics errors
  ANA_9000: 500, // Tracking error
  ANA_9001: 500, // Processing failed
  ANA_9002: 400, // Invalid event
  ANA_9003: 500, // Storage error
  ANA_9004: 500, // Analytics failed

  // Performance errors
  PERF_3500: 500, // Slow response
  PERF_3501: 500, // High memory usage
  PERF_3502: 429, // Resource exhausted
  PERF_3503: 500, // Optimization failed
  PERF_3504: 400, // Cache miss
  PERF_3505: 400, // Bundle size exceeded
};

// Map from common error scenarios to error codes
export const commonErrorsToErrorCodes = {
  // Prisma errors
  prismaErrors: {
    P2000: ErrorCodes.VALIDATION.INVALID_FORMAT, // Value too long for column
    P2001: ErrorCodes.DATA.NOT_FOUND, // Record does not exist
    P2002: ErrorCodes.VALIDATION.DUPLICATE_ENTRY, // Unique constraint failed
    P2003: ErrorCodes.DATA.INTEGRITY_VIOLATION, // Foreign key constraint failed
    P2004: ErrorCodes.DATA.DATABASE_ERROR, // Database constraint failed
    P2005: ErrorCodes.VALIDATION.INVALID_FORMAT, // Value invalid for column
    P2006: ErrorCodes.VALIDATION.INVALID_FORMAT, // Value invalid for type
    P2007: ErrorCodes.DATA.DATABASE_ERROR, // Data validation error
    P2008: ErrorCodes.DATA.QUERY_FAILED, // Failed to parse query
    P2009: ErrorCodes.DATA.QUERY_FAILED, // Failed to validate query
    P2010: ErrorCodes.DATA.QUERY_FAILED, // Raw query failed
    P2011: ErrorCodes.VALIDATION.REQUIRED_FIELD, // Null constraint violation
    P2012: ErrorCodes.VALIDATION.REQUIRED_FIELD, // Missing required value
    P2013: ErrorCodes.VALIDATION.INVALID_INPUT, // Missing required argument
    P2014: ErrorCodes.DATA.INTEGRITY_VIOLATION, // Relation violation
    P2015: ErrorCodes.DATA.NOT_FOUND, // Related record not found
    P2016: ErrorCodes.DATA.QUERY_FAILED, // Query interpretation error
    P2017: ErrorCodes.DATA.INTEGRITY_VIOLATION, // Records not connected
    P2018: ErrorCodes.DATA.NOT_FOUND, // Required connected records not found
    P2019: ErrorCodes.VALIDATION.INVALID_INPUT, // Input error
    P2020: ErrorCodes.VALIDATION.INVALID_INPUT, // Value out of range
    P2021: ErrorCodes.DATA.DATABASE_ERROR, // Table does not exist
    P2022: ErrorCodes.DATA.DATABASE_ERROR, // Column does not exist
    P2023: ErrorCodes.VALIDATION.INVALID_FORMAT, // Inconsistent column data
    P2024: ErrorCodes.DATA.TIMEOUT, // Connection timed out
    P2025: ErrorCodes.DATA.NOT_FOUND, // Record not found for update/delete
    P2026: ErrorCodes.DATA.DATABASE_ERROR, // Database error
    P2027: ErrorCodes.DATA.DATABASE_ERROR, // Multiple errors occurred
    P2028: ErrorCodes.DATA.TRANSACTION_FAILED, // Transaction API error
    P2030: ErrorCodes.DATA.QUERY_FAILED, // Full-text search not supported
    P2033: ErrorCodes.DATA.DATABASE_ERROR, // Number out of range
    P2034: ErrorCodes.DATA.TRANSACTION_FAILED, // Transaction failed
  },

  // Zod validation errors
  zodErrors: {
    invalid_type: ErrorCodes.VALIDATION.INVALID_FORMAT,
    required_error: ErrorCodes.VALIDATION.REQUIRED_FIELD,
    too_small: ErrorCodes.VALIDATION.CONSTRAINT_VIOLATION,
    too_big: ErrorCodes.VALIDATION.CONSTRAINT_VIOLATION,
    invalid_string: ErrorCodes.VALIDATION.INVALID_FORMAT,
    invalid_date: ErrorCodes.VALIDATION.INVALID_FORMAT,
  },

  // HTTP errors
  httpErrors: {
    400: ErrorCodes.VALIDATION.INVALID_INPUT,
    401: ErrorCodes.AUTH.UNAUTHORIZED,
    403: ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
    404: ErrorCodes.DATA.NOT_FOUND,
    409: ErrorCodes.DATA.CONFLICT,
    422: ErrorCodes.VALIDATION.BUSINESS_RULE_VIOLATION,
    429: ErrorCodes.API.RATE_LIMIT,
    500: ErrorCodes.SYSTEM.INTERNAL_ERROR,
    502: ErrorCodes.API.EXTERNAL_SERVICE_ERROR,
    503: ErrorCodes.API.SERVICE_UNAVAILABLE,
    504: ErrorCodes.API.TIMEOUT,
  },
};

// Export the ErrorCode type
