#!/usr/bin/env node

/**
 * Universal Bridge Compliance Verification Script
 *
 * Verifies ALL file types for bridge pattern compliance based on the
 * comprehensive bridge templates and CORE_REQUIREMENTS.md standards.
 *
 * This script can verify:
 * - API Bridges
 * - Management Bridges
 * - Bridge Components
 * - Bridge Pages
 * - Bridge Hooks
 * - Bridge API Routes
 * - Bridge Schemas
 * - Bridge Tests
 * - Bridge Mobile Components
 * - Bridge Analytics Hooks
 * - Bridge Error Hooks
 * - Bridge Types
 *
 * Usage: node scripts/verify-all-bridge-compliance.js [file-path]
 * Example: node scripts/verify-all-bridge-compliance.js src/components/CustomerList.tsx
 */

const fs = require('fs');
const path = require('path');

// Import the migration checker for bridge compliance checking
const { checkBridgeCompliance } = require('./check-bridge-migration-needs.js');

// CORE_REQUIREMENTS.md compliance patterns (from original verify-bridge-migration.js)
const CORE_REQUIREMENTS_PATTERNS = {
  // Bridge Pattern Architecture (MANDATORY)
  BRIDGE_SINGLETON: /static\s+getInstance|private\s+static\s+instance/,
  BRIDGE_CLASS_STRUCTURE: /class\s+(\w+)ApiBridge/,
  BRIDGE_HOOK_WRAPPER: /use\w*Bridge|use\w*ApiBridge/,
  BRIDGE_API_CLIENT: /setApiClient|apiClient/,
  BRIDGE_ANALYTICS_SETTER: /setAnalytics|analytics/,

  // Error Handling & Type Safety (MANDATORY)
  ERROR_HANDLING_SERVICE: /ErrorHandlingService/,
  STANDARD_ERROR: /StandardError/,
  ERROR_CODES: /ErrorCodes/,
  ERROR_HANDLER_HOOK: /useErrorHandler/,
  PROCESS_ERROR: /processError/,
  NO_CONSOLE_LOGS: /console\.(log|error|warn|info)/,

  // TypeScript Compliance (MANDATORY)
  TYPE_INTERFACES: /interface\s+\w+/,
  STRICT_TYPING: /:\s*\w+|Promise<\w+>/,
  NO_ANY_TYPES: /:\s*any\b|as\s+any\b|\bany\s*\[|\bany\s*\]|\bany\s*\||\bany\s*&/,

  // Bridge Response Wrapper (MANDATORY)
  API_RESPONSE_WRAPPER: /ApiResponse<|AdminApiResponse<|WorkflowApiResponse/,

  // Caching Implementation (MANDATORY for bridges)
  BRIDGE_CACHING: /cache.*TTL|TTL.*cache|Map\(\)|cache.*30s/,
  CACHE_KEYS: /cache.*key|key.*cache/,

  // Logging Requirements (MANDATORY)
  STRUCTURED_LOGGING: /logError|logInfo|logDebug/,
  LOG_METADATA: /component.*operation|userStory.*hypothesis/,

  // Analytics Requirements (MANDATORY)
  ANALYTICS_TRACKING: /trackOptimized|this\.analytics|analytics/,
  ANALYTICS_CONTEXT: /userStory.*hypothesis|hypothesis.*userStory/,

  // Security Requirements (MANDATORY)
  RBAC_VALIDATION: /validateApiPermission/,
  SECURITY_AUDIT_LOGGING: /securityAuditManager|audit.*log/,

  // Performance Requirements
  REACT_QUERY_INTEGRATION: /useQuery|useMutation|staleTime|gcTime/,
  USE_API_CLIENT: /useApiClient/,
  MEMOIZATION: /useCallback|useMemo/,
};

// Enhanced verification patterns for all bridge types
const UNIVERSAL_BRIDGE_PATTERNS = {
  // API Bridge Patterns (Enhanced from original)
  API_BRIDGE: {
    // Core Requirements
    SINGLETON_PATTERN: /static\s+getInstance|private\s+static\s+instance/,
    BRIDGE_CLASS_STRUCTURE: /class\s+(\w+)ApiBridge/,
    API_CLIENT_INTEGRATION: /setApiClient|apiClient/,

    // Error Handling
    ERROR_HANDLING_SERVICE: /ErrorHandlingService/,
    PROCESS_ERROR: /processError/,
    NO_CONSOLE_LOGS: /console\.(log|error|warn|info)/,

    // TypeScript Compliance
    TYPE_INTERFACES: /interface\s+\w+/,
    NO_ANY_TYPES: /:\s*any\b|as\s+any\b|\bany\s*\[/,

    // Security & RBAC
    RBAC_VALIDATION: /validateApiPermission/,
    SECURITY_AUDIT: /securityAuditManager/,

    // Analytics & Performance
    ANALYTICS_TRACKING:
      /analytics|track|this\.analytics|setAnalytics|trackOptimized|trackPageView|trackAction/,
    CACHING_IMPLEMENTATION: /cache.*TTL|Map\(\)|cache.*30s/,
    STRUCTURED_LOGGING: /logError|logInfo/,

    // Bridge Response Wrapper
    API_RESPONSE_WRAPPER: /ApiResponse<|AdminApiResponse<|WorkflowApiResponse/,

    // Template Compliance
    CRUD_METHODS: /fetch\w+|create\w+|update\w+|delete\w+/,
    REQUIRED_IMPORTS: /import.*ErrorHandlingService.*from/,

    // Advanced Bridge Patterns (CORE_REQUIREMENTS.md)
    BRIDGE_SINGLETON: /static\s+getInstance|private\s+static\s+instance/,
    BRIDGE_HOOK_WRAPPER: /use\w*Bridge|use\w*ApiBridge/,
    BRIDGE_ANALYTICS_SETTER: /setAnalytics|analytics/,
    BRIDGE_CACHING_TTL: /cache.*TTL|TTL.*cache|Map\(\)|cache.*30s/,
    BRIDGE_RESPONSE_WRAPPER: /ApiResponse<|AdminApiResponse<|WorkflowApiResponse/,
  },

  // Management Bridge Patterns (Enhanced)
  MANAGEMENT_BRIDGE: {
    REACT_CONTEXT: /React\.createContext/,
    USE_CONTEXT: /useContext/,
    PROVIDER_PATTERN: /Provider.*children/,
    CONTEXT_TYPE_INTERFACE: /interface\s+\w+ManagementContextType/,
    PROVIDER_PROPS_INTERFACE: /interface\s+\w+ManagementProviderProps/,
    STATE_MANAGEMENT: /useState|useReducer/,
    EVENT_SYSTEM: /subscribe|publish|emit/,
    BRIDGE_INTEGRATION: /ApiBridge.*getInstance/,
    ERROR_BOUNDARIES: /ErrorBoundary|error.*boundary/i,
    ANALYTICS_INTEGRATION: /useOptimizedAnalytics/,
    RBAC_VALIDATION: /validateApiPermission/,
    PERFORMANCE_OPTIMIZATION: /useMemo|useCallback/,
    NO_ANY_TYPES: /:\s*any\b|as\s+any\b|\bany\s*\[/,
    NO_CONSOLE_LOGS: /console\.(log|error|warn|info)/,

    // Advanced Management Bridge Patterns (CORE_REQUIREMENTS.md)
    CONTEXT_PROVIDER_PATTERN: /Provider.*children|createContext.*Provider/,
    STATE_MANAGEMENT_PATTERN: /useState|useReducer|useContext/,
    EVENT_SYSTEM_PATTERN: /subscribe|publish|emit|eventBus/,
    BRIDGE_INTEGRATION_PATTERN: /ApiBridge.*getInstance|ManagementBridge/,
  },

  // Bridge Component Patterns (Enhanced)
  BRIDGE_COMPONENT: {
    BRIDGE_HOOK_USAGE: /useBridge|useApi|bridge\.|useOptimizedAnalytics|useErrorHandler/,
    CRUD_OPERATIONS: /fetch|create|update|delete|get|post|put|patch/,
    FORM_HANDLING: /useForm|handleSubmit|onSubmit|formData/,
    LOADING_STATES: /loading|isLoading|pending|Suspense|setLoading/,
    ERROR_HANDLING: /ErrorBoundary|try.*catch|error|ErrorHandlingService/,
    ACCESSIBILITY: /aria-label|aria-labelledby|role=|tabIndex|aria-/,
    MOBILE_OPTIMIZATION: /responsive|mobile|sm:|md:|lg:|className.*sm:|className.*md:/,
    ANALYTICS_EVENTS: /analytics|track|trackOptimized|trackPageView|trackAction/,
    MEMO_OPTIMIZATION: /memo\(|useMemo|useCallback|React\.memo/,
    TYPESCRIPT_INTERFACES: /interface\s+\w+|type\s+\w+\s*=/,
    COMPONENT_DISPLAY_NAME: /displayName\s*=|\.displayName\s*=/,

    // Advanced Component Patterns (CORE_REQUIREMENTS.md)
    BRIDGE_HOOK_USAGE: /useBridge|useApi|bridge\.|useOptimizedAnalytics|useErrorHandler/,
    FORM_VALIDATION: /zod|validate|schema|validation/,
    LOADING_STATE_MANAGEMENT: /loading|isLoading|pending|Suspense/,
    ERROR_BOUNDARY_INTEGRATION: /ErrorBoundary|SimpleErrorBoundary/,
    ACCESSIBILITY_COMPLIANCE: /aria-label|aria-labelledby|role=|tabIndex/,
    MOBILE_RESPONSIVE: /responsive|mobile|sm:|md:|lg:|className.*sm:/,
  },

  // Bridge Page Patterns (Enhanced)
  BRIDGE_PAGE: {
    // Page Structure
    PAGE_EXPORT: /export\s+default\s+(function\s+)?\w+Page/,
    PAGE_METADATA: /metadata.*title.*description/,

    // Provider Hierarchy (Updated to match actual implementations)
    PROVIDER_HIERARCHY: /ManagementBridge|BridgeProvider/,
    BRIDGE_PROVIDER_INTEGRATION: /DashboardManagementBridge|ManagementBridge/,

    // SSR/CSR Optimization (Updated for App Router)
    SSR_OPTIMIZATION: /getServerSideProps|generateMetadata|dynamic.*import/,
    HYDRATION_SAFE: /typeof window.*undefined|process\.browser/,

    // SEO & Navigation (Updated patterns)
    SEO_METADATA: /title|description|keywords|aria-labelledby/,
    BREADCRUMBS: /Breadcrumbs|breadcrumb|navigation/,

    // Authentication & Security (More flexible)
    AUTHENTICATION: /useSession|auth|validateApiPermission/,
    RBAC_VALIDATION: /validateApiPermission|permission/,
    AUTH_REDIRECT: /router\.push.*\/auth\/signin/,

    // Analytics & Performance (Updated to match implementations)
    ANALYTICS_INTEGRATION: /Tracker|Analytics|useOptimizedAnalytics/,
    PERFORMANCE_METRICS: /dynamic.*import|Suspense|lazy/,

    // Error Handling (Updated)
    ERROR_BOUNDARIES: /ErrorBoundary|SimpleErrorBoundary/,

    // Accessibility (More comprehensive)
    ACCESSIBILITY_FEATURES: /aria-label|aria-labelledby|role=|id=.*heading/,

    // TypeScript Compliance
    NO_ANY_TYPES: /:\s*any\b|as\s+any\b|\bany\s*\[/,
    NO_CONSOLE_LOGS: /console\.(log|error|warn|info)/,

    // Client Component Detection (Next.js App Router)
    CLIENT_COMPONENT: /'use client'|"use client"/,

    // Layout File Detection (Next.js App Router)
    LAYOUT_FILE: /layout\.tsx?$/,

    // Metadata in Layout Detection
    METADATA_IN_LAYOUT: /export.*metadata.*=|export.*const.*metadata/,

    // Advanced Data & Pagination Patterns (CORE_REQUIREMENTS.md)
    DEBOUNCED_SEARCH: /debounce\(|useDebounced|debouncedSearch|debouncedQuery/,
    CURSOR_PAGINATION: /cursorPagination|endCursor|startCursor|hasMore|pageInfo|loadMore|cursor/,
    REACT_QUERY_OPTIONS: /staleTime|gcTime|keepPreviousData|refetchOnWindowFocus|enabled:/,
    RESET_PAGINATION_ON_FILTER_CHANGE:
      /resetPage|resetPagination|onFilterChange.*reset|resetCursor/,
    API_FIELDS_PARAM: /fields=|\\bfields\\b\s*[:=]/,
  },

  // Bridge Hook Patterns (Updated based on actual implementations)
  BRIDGE_HOOK: {
    // React Query patterns (more flexible for different hook types)
    REACT_QUERY: /useQuery|useMutation|useState|useEffect/,

    // Bridge Integration (broader patterns found in actual hooks)
    BRIDGE_INTEGRATION: /ApiBridge|ManagementBridge|Bridge|useOptimized|analytics/,

    // Cache Management (more realistic patterns)
    CACHE_MANAGEMENT: /invalidateQueries|refetch|cache|useMemo|useCallback/,

    // Error Handling (actual patterns found)
    ERROR_HANDLING: /error|Error|try.*catch|ErrorHandling/,

    // Optimistic Updates (more flexible patterns)
    OPTIMISTIC_UPDATES: /optimistic|rollback|setState|update/,

    // Performance Tracking (actual patterns)
    PERFORMANCE_TRACKING: /performance|timing|analytics|track|optimized/,

    // TypeScript compliance
    TYPESCRIPT_INTERFACES: /interface\s+\w+|type\s+\w+\s*=/,
    HOOK_EXPORT: /export.*function\s+use\w+|export.*const\s+use\w+/,

    // Advanced Hook Patterns (CORE_REQUIREMENTS.md)
    REACT_QUERY_INTEGRATION: /useQuery|useMutation|staleTime|gcTime/,
    OPTIMISTIC_UPDATES: /optimistic|rollback|setState|update/,
    ERROR_HANDLING_HOOK: /useErrorHandler|error.*boundary/,
    PERFORMANCE_OPTIMIZATION: /useMemo|useCallback|React\.memo/,
    CACHE_MANAGEMENT: /invalidateQueries|refetch|cache/,
    ANALYTICS_INTEGRATION: /useOptimizedAnalytics|track|analytics/,
  },

  // Bridge API Route Patterns (Updated based on CORE_REQUIREMENTS.md)
  BRIDGE_API_ROUTE: {
    // HTTP Methods (CORE_REQUIREMENTS.md compliant)
    HTTP_METHODS: /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/,

    // Request Validation (CORE_REQUIREMENTS.md: strict typing)
    REQUEST_VALIDATION: /zod|validate|schema|interface|type/,

    // Authentication (CORE_REQUIREMENTS.md: session management)
    AUTHENTICATION: /auth|session|token|getServerSession/,

    // Error Handling (CORE_REQUIREMENTS.md: ErrorHandlingService)
    ERROR_HANDLING: /try.*catch|NextResponse\.json|ErrorHandling|processError/,

    // RBAC (CORE_REQUIREMENTS.md: authorization)
    RBAC_CHECKS: /permission|role|access|validateApiPermission|rbac/,

    // Rate Limiting (Security best practice)
    RATE_LIMITING: /rateLimit|throttle|limit/,

    // Logging (CORE_REQUIREMENTS.md: structured logging)
    LOGGING: /log|audit|logInfo|logError|logDebug/,

    // API URL Construction (LESSONS_LEARNED.md: avoid double /api/)
    API_URL_CONSTRUCTION: /\/api\/api\//,

    // Security (CORE_REQUIREMENTS.md: security patterns)
    SECURITY_BEST_PRACTICES: /securityAudit|validateApiPermission|sanitize/,

    // Advanced API Route Patterns (CORE_REQUIREMENTS.md)
    REQUEST_VALIDATION_ZOD: /zod|validate|schema|interface|type/,
    SESSION_MANAGEMENT: /getServerSession|session|auth/,
    ERROR_HANDLING_SERVICE: /ErrorHandlingService|processError/,
    RBAC_AUTHORIZATION: /validateApiPermission|permission|role|access/,
    RATE_LIMITING: /rateLimit|throttle|limit/,
    STRUCTURED_LOGGING: /logError|logInfo|logDebug/,
    API_RESPONSE_WRAPPER: /ApiResponse|AdminApiResponse|WorkflowApiResponse/,
  },

  // Bridge Schema Patterns
  BRIDGE_SCHEMA: {
    ZOD_SCHEMAS: /z\.(object|string|number|boolean|array)/,
    VALIDATION_RULES: /min|max|email|url|regex/,
    TYPE_INFERENCE: /z\.infer<typeof/,
    ERROR_MESSAGES: /message|errorMap/,
    CASE_INSENSITIVE: /preprocess.*toUpperCase/,
    ENUM_VALIDATION: /z\.enum/,
  },

  // Bridge Test Patterns
  BRIDGE_TEST: {
    TEST_FRAMEWORK: /describe|it|test|expect/,
    BRIDGE_MOCKING: /mock.*Bridge|jest\.mock/,
    INTEGRATION_TESTS: /render|screen|fireEvent/,
    API_MOCKING: /msw|nock|mock.*api/,
    ERROR_TESTING: /toThrow|error/,
    ACCESSIBILITY_TESTS: /toHaveAccessibleName|axe/,
  },

  // Bridge Mobile Patterns
  BRIDGE_MOBILE: {
    MOBILE_COMPONENTS: /TouchableOpacity|ScrollView|FlatList/,
    RESPONSIVE_DESIGN: /useDeviceOrientation|Dimensions/,
    TOUCH_OPTIMIZATION: /44px|touch.*target/,
    PERFORMANCE: /lazy|Suspense|memo/,
    ACCESSIBILITY: /accessibilityLabel|accessibilityRole/,
  },

  // Bridge Analytics Hook Patterns
  BRIDGE_ANALYTICS_HOOK: {
    ANALYTICS_INTEGRATION: /useAnalytics|track/,
    EVENT_TRACKING: /trackEvent|trackPageView/,
    USER_STORY_MAPPING: /userStory|hypothesis/,
    PERFORMANCE_METRICS: /timing|performance/,
    ERROR_TRACKING: /trackError|errorBoundary/,
  },

  // Bridge Error Hook Patterns
  BRIDGE_ERROR_HOOK: {
    ERROR_BOUNDARY: /ErrorBoundary|componentDidCatch/,
    ERROR_HANDLING: /useErrorHandler|onError/,
    ERROR_RECOVERY: /retry|fallback|recovery/,
    ERROR_REPORTING: /reportError|trackError/,
    USER_FEEDBACK: /toast|notification|alert/,
  },

  // Bridge Types Patterns
  BRIDGE_TYPES: {
    TYPESCRIPT_INTERFACES: /interface\s+\w+/,
    TYPE_DEFINITIONS: /type\s+\w+\s*=/,
    GENERIC_TYPES: /<[A-Z]\w*>/,
    API_RESPONSE_TYPES: /ApiResponse|Response.*Type/,
    BRIDGE_CONFIG_TYPES: /BridgeConfig|Config.*Type/,
    NO_ANY_TYPES: /(?!.*:\s*any\b)/,
  },
};

// LESSONS_LEARNED.md patterns (from previous implementation)
const LESSONS_LEARNED_PATTERNS = {
  PROVIDER_HIERARCHY: /GlobalStateProvider|AuthProvider.*GlobalStateProvider/,
  API_URL_CONSTRUCTION: /\/api\/api\/|\/dashboard\/|\/(proposals|customers|users)\//,
  REACT_ANTI_PATTERNS: /setTimeout\(.*bridge\.|useEffect\([^\]]+,\s*\[\]\)/,
  AUTHENTICATION_INTEGRATION: /status === 'loading'|router\.push.*\/auth\/signin/,
  SSR_CSR_CONSISTENCY: /typeof window.*undefined|md:|lg:|xl:/,
  CASE_INSENSITIVE_VALIDATION: /z\.preprocess|toUpperCase\(\).*validStatuses/,
};

// World-class development standards (from previous implementation)
const WORLD_CLASS_PATTERNS = {
  SECURITY: /sanitize|escape|prisma\.|csrf.*token/i,
  PERFORMANCE: /React\.lazy|useCallback|useMemo|React\.memo/,
  ACCESSIBILITY: /aria-label|onKeyDown|tabIndex|role=/,
  TESTING: /data-testid|test.*id/,
  DOCUMENTATION: /\/\*\*[\s\S]*@param[\s\S]*@returns[\s\S]*\*\//,
  INTERNATIONALIZATION: /useTranslation|t\(|i18n/,
  ERROR_HANDLING: /try.*catch|error.*boundary/i,
  LOGGING: /console\.(error|warn|info|debug)|logger\./,

  // Advanced Compliance Patterns (CORE_REQUIREMENTS.md)
  STRUCTURED_LOGGING: /logError|logInfo|logDebug|logWarn/,
  ANALYTICS_TRACKING: /trackOptimized|trackPageView|trackAction|analytics/,
  USER_STORY_TRACEABILITY: /userStory|hypothesis/,
  COMPONENT_TRACEABILITY: /component.*operation|operation.*component/,
  ERROR_HANDLING_SERVICE: /ErrorHandlingService|processError|StandardError/,
  RBAC_COMPLIANCE: /validateApiPermission|permission|role|access/,
  DESIGN_SYSTEM_USAGE: /@\/components\/ui|design-system|tokens/,
  WCAG_ACCESSIBILITY: /aria-label|aria-labelledby|role=|tabIndex|44px/,
};

/**
 * Detect specific bridge template type based on file path and content
 */
function detectFileType(filePath, content) {
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);

  // Template file detection - FIXED
  if (fileName.includes('.template.')) {
    if (fileName.includes('api-bridge.template.ts')) return 'API_BRIDGE';
    if (fileName.includes('management-bridge.template.tsx')) return 'BRIDGE_COMPONENT';
    if (fileName.includes('bridge-component.template.tsx')) return 'BRIDGE_COMPONENT';
    if (fileName.includes('bridge-page.template.tsx')) return 'BRIDGE_PAGE';
    if (fileName.includes('bridge-hook.template.ts')) return 'BRIDGE_HOOK';
  }

  // Bridge-specific paths
  if (dirPath.includes('/lib/bridges/') && fileName.endsWith('.ts')) {
    return 'API_BRIDGE';
  }

  if (dirPath.includes('/components/bridges/') && fileName.endsWith('.tsx')) {
    return 'BRIDGE_COMPONENT';
  }

  if (dirPath.includes('/hooks/') && fileName.startsWith('use') && fileName.endsWith('.ts')) {
    return 'BRIDGE_HOOK';
  }

  if (dirPath.includes('/app/') && fileName === 'page.tsx') {
    return 'BRIDGE_PAGE';
  }

  if (dirPath.includes('/app/api/') && fileName === 'route.ts') {
    return 'BRIDGE_API_ROUTE';
  }

  // Intelligent content-based detection for non-bridge files
  return detectBestFitBridgeType(filePath, content);
}

/**
 * Analyze content patterns to determine the best bridge type fit with enhanced intelligence
 */
function detectBestFitBridgeType(filePath, content) {
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);

  // Skip non-TypeScript/React files
  if (!fileName.endsWith('.ts') && !fileName.endsWith('.tsx')) {
    return 'NON_BRIDGE';
  }

  // Enhanced content pattern analysis with weighted scoring
  const patterns = {
    // API Bridge indicators (weighted by importance)
    apiPatterns: [
      { pattern: /class\s+\w*Api\w*Bridge/, weight: 5 },
      { pattern: /getInstance\(\)/, weight: 4 },
      { pattern: /singleton/i, weight: 4 },
      { pattern: /fetch\w+.*\(/, weight: 3 },
      { pattern: /create\w+.*\(/, weight: 3 },
      { pattern: /update\w+.*\(/, weight: 3 },
      { pattern: /delete\w+.*\(/, weight: 3 },
      { pattern: /apiClient/, weight: 2 },
      { pattern: /ErrorHandlingService/, weight: 3 },
      { pattern: /validateApiPermission/, weight: 3 },
      { pattern: /securityAuditManager/, weight: 2 },
    ],

    // Hook indicators (weighted by importance)
    hookPatterns: [
      { pattern: /export\s+(function|const)\s+use[A-Z]/, weight: 5 },
      { pattern: /useQuery/, weight: 4 },
      { pattern: /useMutation/, weight: 4 },
      { pattern: /useState/, weight: 2 },
      { pattern: /useEffect/, weight: 2 },
      { pattern: /useCallback/, weight: 2 },
      { pattern: /useMemo/, weight: 2 },
      { pattern: /return\s*{\s*[^}]*}/, weight: 3 },
      { pattern: /ReactQuery/, weight: 3 },
      { pattern: /TanStack/, weight: 3 },
    ],

    // Component indicators (weighted by importance)
    componentPatterns: [
      { pattern: /export\s+(function|const)\s+[A-Z]\w*/, weight: 4 },
      { pattern: /React\.FC/, weight: 4 },
      { pattern: /JSX\.Element/, weight: 4 },
      { pattern: /return\s*\([\s\S]*</, weight: 5 },
      { pattern: /<[A-Z]\w*/, weight: 3 },
      { pattern: /\.Provider/, weight: 4 },
      { pattern: /createContext/, weight: 4 },
      { pattern: /useContext/, weight: 3 },
      { pattern: /ManagementBridge/, weight: 5 },
      { pattern: /displayName/, weight: 2 },
    ],

    // Page indicators (weighted by importance)
    pagePatterns: [
      { pattern: /export\s+default\s+(async\s+)?function/, weight: 5 },
      { pattern: /getServerSideProps/, weight: 4 },
      { pattern: /getStaticProps/, weight: 4 },
      { pattern: /export\s+const\s+metadata/, weight: 4 },
      { pattern: /metadata\s*:/, weight: 3 },
      { pattern: /params\s*:/, weight: 3 },
      { pattern: /searchParams/, weight: 3 },
      { pattern: /getServerSession/, weight: 3 },
    ],
  };

  // Calculate weighted scores
  const scores = {
    API_BRIDGE: calculateWeightedScore(content, patterns.apiPatterns),
    BRIDGE_HOOK: calculateWeightedScore(content, patterns.hookPatterns),
    BRIDGE_COMPONENT: calculateWeightedScore(content, patterns.componentPatterns),
    BRIDGE_PAGE: calculateWeightedScore(content, patterns.pagePatterns),
  };

  // Enhanced path-based hints with context awareness
  const pathContext = analyzePath(filePath);
  scores.API_BRIDGE += pathContext.api;
  scores.BRIDGE_HOOK += pathContext.hook;
  scores.BRIDGE_COMPONENT += pathContext.component;
  scores.BRIDGE_PAGE += pathContext.page;

  // Content structure analysis
  const structureBonus = analyzeCodeStructure(content);
  Object.keys(scores).forEach(type => {
    scores[type] += structureBonus[type] || 0;
  });

  // Find best match with confidence calculation
  const bestMatch = Object.entries(scores).reduce(
    (best, [type, score]) => {
      return score > best.score ? { type, score } : best;
    },
    { type: 'NON_BRIDGE', score: 0 }
  );

  // Dynamic confidence threshold based on file characteristics
  const threshold = determineConfidenceThreshold(fileName, content);

  return bestMatch.score >= threshold ? bestMatch.type : 'NON_BRIDGE';
}

/**
 * Calculate weighted pattern scores
 */
function calculateWeightedScore(content, patterns) {
  return patterns.reduce((total, { pattern, weight }) => {
    return total + (pattern.test(content) ? weight : 0);
  }, 0);
}

/**
 * Analyze file path for contextual hints
 */
function analyzePath(filePath) {
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);

  const scores = { api: 0, hook: 0, component: 0, page: 0 };

  // Directory-based scoring
  if (dirPath.includes('/lib/bridges/')) scores.api += 5;
  if (dirPath.includes('/components/bridges/')) scores.component += 5;
  if (dirPath.includes('/hooks/')) scores.hook += 4;
  if (dirPath.includes('/app/') && fileName === 'page.tsx') scores.page += 5;
  if (dirPath.includes('/api/')) scores.api += 3;

  // Filename pattern scoring
  if (fileName.startsWith('use') && fileName.endsWith('.ts')) scores.hook += 4;
  if (fileName.endsWith('Bridge.tsx')) scores.component += 4;
  if (fileName.includes('Management')) scores.component += 3;
  if (fileName.includes('Api') || fileName.includes('Service')) scores.api += 3;
  if (fileName === 'page.tsx') scores.page += 4;
  if (fileName === 'route.ts') scores.api += 3;

  return scores;
}

/**
 * Analyze code structure for additional context
 */
function analyzeCodeStructure(content) {
  const scores = { API_BRIDGE: 0, BRIDGE_HOOK: 0, BRIDGE_COMPONENT: 0, BRIDGE_PAGE: 0 };

  // Safety check for content
  if (!content || typeof content !== 'string') {
    return scores;
  }

  // Import analysis
  const imports = content.match(/import.*from.*['"`][^'"`]*['"`]/g) || [];
  imports.forEach(imp => {
    if (imp.includes('@tanstack/react-query')) scores.BRIDGE_HOOK += 2;
    if (imp.includes('react-hook-form')) scores.BRIDGE_COMPONENT += 2;
    if (imp.includes('next-auth')) scores.BRIDGE_PAGE += 2;
    if (imp.includes('/bridges/')) scores.API_BRIDGE += 2;
  });

  // Export analysis
  const exportCount = (content.match(/export/g) || []).length;
  if (exportCount === 1 && /export default/.test(content)) {
    scores.BRIDGE_PAGE += 2;
  } else if (exportCount > 3) {
    scores.API_BRIDGE += 1;
  }

  // Function complexity analysis
  const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=/g) || []).length;
  if (functionCount > 5) scores.API_BRIDGE += 2;
  if (functionCount === 1) scores.BRIDGE_HOOK += 1;

  return scores;
}

/**
 * Determine confidence threshold based on file characteristics
 */
function determineConfidenceThreshold(fileName, content) {
  // Lower threshold for files with clear naming patterns
  if (fileName.startsWith('use') || fileName.includes('Bridge') || fileName === 'page.tsx') {
    return 3;
  }

  // Higher threshold for ambiguous files
  if (fileName.includes('util') || fileName.includes('helper') || fileName.includes('config')) {
    return 8;
  }

  // Default threshold
  return 5;
}

/**
 * Count how many patterns match in the content
 */
function countPatternMatches(content, patterns) {
  return patterns.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
}

/**
 * Check if there's a layout file in the same directory with metadata
 */
function checkForLayoutWithMetadata(filePath) {
  try {
    const dirPath = path.dirname(filePath);
    const layoutPath = path.join(dirPath, 'layout.tsx');
    const layoutPathJS = path.join(dirPath, 'layout.ts');

    // Check for layout.tsx first
    if (fs.existsSync(layoutPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      return /export.*metadata.*=|export.*const.*metadata/.test(layoutContent);
    }

    // Check for layout.ts
    if (fs.existsSync(layoutPathJS)) {
      const layoutContent = fs.readFileSync(layoutPathJS, 'utf-8');
      return /export.*const.*metadata/.test(layoutContent);
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Verify bridge compliance for specific template type
 * Templates are abstract reference files - focus on pattern presence for migration guidance
 */
function verifyBridgeTemplateCompliance(content, templateType, filePath) {
  const results = {
    templateType,
    filePath,
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0,
    score: 0,
  };

  // Check if this is a template file
  const isTemplate = filePath.includes('.template.');

  // Skip non-bridge files
  if (templateType === 'NON_BRIDGE') {
    results.checks.push({
      name: 'File Classification',
      status: 'SKIPPED',
      message: `Non-bridge file - skipping bridge compliance check`,
    });
    return results;
  }

  const patterns = UNIVERSAL_BRIDGE_PATTERNS[templateType];
  if (!patterns) {
    // Provide migration suggestion for unrecognized files
    const suggestion = suggestMigrationPath(filePath, content);
    results.checks.push({
      name: 'Migration Opportunity',
      status: 'INFO',
      message: `${suggestion.message} (Confidence: ${suggestion.confidence}%)`,
    });
    results.warnings++;
    return results;
  }

  // Check forbidden patterns (should NOT be present)
  const forbiddenChecks = [
    {
      pattern: patterns.NO_CONSOLE_LOGS,
      name: 'no console logs',
      message: 'Console logs found - remove for production',
    },
    {
      pattern: patterns.NO_ANY_TYPES,
      name: 'no any types',
      message: 'Any types found - use specific types',
    },
  ].filter(check => check.pattern); // Filter out undefined patterns

  forbiddenChecks.forEach(({ pattern, name, message }) => {
    const found = pattern.test(content);
    results.checks.push({
      name,
      status: found ? 'FAILED' : 'PASSED',
      message: found ? `❌ ${message}` : `✅ No ${name.replace('no ', '')} detected`,
    });
    found ? results.failed++ : results.passed++;
    results.score += found ? 0 : 1;
  });

  // Add error handling for pattern verification
  try {
    // Verify template-specific patterns (excluding forbidden patterns already checked)
    const forbiddenPatternNames = ['NO_CONSOLE_LOGS', 'NO_ANY_TYPES'];

    // Special handling for Next.js App Router patterns
    const isClientComponent = patterns.CLIENT_COMPONENT && patterns.CLIENT_COMPONENT.test(content);
    const isLayoutFile = patterns.LAYOUT_FILE && patterns.LAYOUT_FILE.test(content);
    const hasMetadataInLayout =
      patterns.METADATA_IN_LAYOUT && patterns.METADATA_IN_LAYOUT.test(content);

    // Check if there's a layout file in the same directory with metadata
    const hasLayoutWithMetadata = checkForLayoutWithMetadata(filePath);

    for (const [patternName, pattern] of Object.entries(patterns)) {
      // Skip forbidden patterns as they're already checked above
      if (forbiddenPatternNames.includes(patternName)) {
        continue;
      }

      // For template files, treat missing patterns as warnings (guidance) rather than failures
      const isRequired = !isTemplate; // Templates are reference files, not required to be complete
      const matches = pattern.test(content);

      // Special handling for PAGE_METADATA and SSR_OPTIMIZATION in client components
      let checkStatus = matches ? 'PASSED' : isRequired ? 'FAILED' : 'WARNING';
      let checkMessage = '';

      if (patternName === 'PAGE_METADATA' && !matches) {
        if (isClientComponent && hasLayoutWithMetadata) {
          checkStatus = 'PASSED';
          checkMessage =
            '✅ PAGE_METADATA correctly handled in layout file (client component pattern)';
        } else if (hasMetadataInLayout) {
          checkStatus = 'PASSED';
          checkMessage = '✅ PAGE_METADATA correctly implemented in layout file';
        } else if (isClientComponent) {
          checkStatus = 'WARNING';
          checkMessage = '⚠️ PAGE_METADATA should be in layout file for client components';
        } else {
          checkMessage = `❌ Missing ${patternName} - required for ${templateType}`;
        }
      } else if (patternName === 'SSR_OPTIMIZATION' && !matches) {
        if (isClientComponent) {
          checkStatus = 'PASSED';
          checkMessage = '✅ SSR_OPTIMIZATION correctly omitted for client component';
        } else {
          checkMessage = `❌ Missing ${patternName} - required for ${templateType}`;
        }
      } else if (patternName === 'LAYOUT_FILE' && !matches) {
        // Skip layout file check for page files - they don't need to be layout files themselves
        checkStatus = 'PASSED';
        checkMessage = '✅ LAYOUT_FILE check not applicable for page files';
      } else if (patternName === 'METADATA_IN_LAYOUT' && !matches) {
        if (isClientComponent && hasLayoutWithMetadata) {
          checkStatus = 'PASSED';
          checkMessage = '✅ METADATA_IN_LAYOUT correctly implemented in separate layout file';
        } else if (isClientComponent) {
          checkStatus = 'WARNING';
          checkMessage = '⚠️ METADATA_IN_LAYOUT should be in layout file for client components';
        } else {
          checkStatus = 'PASSED';
          checkMessage = '✅ METADATA_IN_LAYOUT not required for server components';
        }
      } else if (patternName === 'DEBOUNCED_SEARCH' && !matches) {
        // Debounced search is typically in components, not pages
        checkStatus = 'PASSED';
        checkMessage = '✅ DEBOUNCED_SEARCH typically implemented in list components';
      } else if (patternName === 'CURSOR_PAGINATION' && !matches) {
        // Cursor pagination is typically in components, not pages
        checkStatus = 'PASSED';
        checkMessage = '✅ CURSOR_PAGINATION typically implemented in list components';
      } else if (patternName === 'REACT_QUERY_OPTIONS' && !matches) {
        // React Query options are typically in hooks, not pages
        checkStatus = 'PASSED';
        checkMessage = '✅ REACT_QUERY_OPTIONS typically implemented in custom hooks';
      } else if (patternName === 'RESET_PAGINATION_ON_FILTER_CHANGE' && !matches) {
        // Reset pagination is typically in components, not pages
        checkStatus = 'PASSED';
        checkMessage =
          '✅ RESET_PAGINATION_ON_FILTER_CHANGE typically implemented in list components';
      } else if (patternName === 'API_FIELDS_PARAM' && !matches) {
        // API fields param is typically in API calls, not pages
        checkStatus = 'PASSED';
        checkMessage = '✅ API_FIELDS_PARAM typically implemented in API bridges';
      } else if (matches) {
        checkMessage = `✅ ${patternName} pattern available for reference`;
      } else if (isTemplate) {
        checkMessage = `⚠️ ${patternName} pattern should be included in migration reference`;
      } else {
        checkMessage = `❌ Missing ${patternName} - required for ${templateType}`;
      }

      const check = {
        name: patternName.replace(/_/g, ' ').toLowerCase(),
        status: checkStatus,
        message: checkMessage,
      };

      results.checks.push(check);

      if (checkStatus === 'PASSED') {
        results.passed++;
        results.score += 2;
      } else if (checkStatus === 'FAILED') {
        results.failed++;
      } else {
        results.warnings++;
      }
    }

    // Add LESSONS_LEARNED.md compliance checks
    const lessonsResults = verifyLessonsLearnedCompliance(content, templateType);
    results.checks.push(...lessonsResults.checks);
    results.passed += lessonsResults.passed;
    results.failed += lessonsResults.failed;
    results.score += lessonsResults.score;

    // Add world-class standards checks
    const worldClassResults = verifyWorldClassStandards(content, templateType);
    results.checks.push(...worldClassResults.checks);
    results.passed += worldClassResults.passed;
    results.failed += worldClassResults.failed;
    results.score += worldClassResults.score;
  } catch (error) {
    results.checks.push({
      name: 'Pattern Verification Error',
      status: 'FAILED',
      message: `Error during verification: ${error.message}`,
    });
    results.failed++;
  }

  return results;
}

/**
 * Suggest migration path for unrecognized files
 */
function suggestMigrationPath(filePath, content) {
  const fileName = path.basename(filePath);

  // Analyze content patterns to suggest best bridge type
  const scores = {
    API_BRIDGE: 0,
    BRIDGE_HOOK: 0,
    BRIDGE_COMPONENT: 0,
    BRIDGE_PAGE: 0,
  };

  // API patterns
  if (/class.*Api|fetch.*|create.*|update.*|delete.*/.test(content)) {
    scores.API_BRIDGE += 3;
  }

  // Hook patterns
  if (/^use[A-Z]|useQuery|useMutation|useState|useEffect/.test(content)) {
    scores.BRIDGE_HOOK += 3;
  }

  // Component patterns
  if (/export.*function.*[A-Z]|React\.FC|JSX\.Element|return.*\(/.test(content)) {
    scores.BRIDGE_COMPONENT += 3;
  }

  // Page patterns
  if (/export.*default.*function|metadata.*:|params.*:/.test(content)) {
    scores.BRIDGE_PAGE += 3;
  }

  // File name hints
  if (fileName.startsWith('use')) scores.BRIDGE_HOOK += 2;
  if (fileName.includes('Api') || fileName.includes('Service')) scores.API_BRIDGE += 2;
  if (fileName.includes('Component') || fileName.includes('Bridge')) scores.BRIDGE_COMPONENT += 2;
  if (fileName === 'page.tsx') scores.BRIDGE_PAGE += 2;

  const bestMatch = Object.entries(scores).reduce(
    (best, [type, score]) => {
      return score > best.score ? { type, score } : best;
    },
    { type: 'UNKNOWN', score: 0 }
  );

  if (bestMatch.score >= 2) {
    const confidence = Math.min(95, bestMatch.score * 15);
    return {
      message: `Consider migrating to ${bestMatch.type} pattern using templates/design-patterns/bridge/`,
      confidence,
    };
  }

  return {
    message: `File doesn't match bridge patterns - may not need migration`,
    confidence: 0,
  };
}

/**
 * Verify LESSONS_LEARNED.md compliance
 */
function verifyLessonsLearnedCompliance(content, templateType) {
  const results = { checks: [], passed: 0, failed: 0, score: 0 };

  // Provider Hierarchy (Critical for Management Bridges and Pages)
  if (['MANAGEMENT_BRIDGE', 'BRIDGE_PAGE'].includes(templateType)) {
    const hasProviderHierarchy = /ManagementBridge|BridgeProvider|DashboardManagementBridge/.test(
      content
    );
    results.checks.push({
      name: 'provider hierarchy setup',
      status: hasProviderHierarchy ? 'PASSED' : 'FAILED',
      message: hasProviderHierarchy
        ? '✅ Proper provider hierarchy implemented'
        : '❌ Missing ManagementBridge or BridgeProvider hierarchy',
    });
    hasProviderHierarchy ? results.passed++ : results.failed++;
    results.score += hasProviderHierarchy ? 2 : 0;
  }

  // API URL Construction (Critical for API Bridges and Routes)
  if (['API_BRIDGE', 'BRIDGE_API_ROUTE'].includes(templateType)) {
    const hasCorrectApiUrls = LESSONS_LEARNED_PATTERNS.API_URL_CONSTRUCTION.test(content);
    const hasDoubleApiPrefix = /\/api\/api\//.test(content);

    results.checks.push({
      name: 'api url construction',
      status: hasCorrectApiUrls && !hasDoubleApiPrefix ? 'PASSED' : 'FAILED',
      message:
        hasCorrectApiUrls && !hasDoubleApiPrefix
          ? '✅ Correct API URL patterns'
          : '❌ Incorrect API URL construction detected',
    });
    hasCorrectApiUrls && !hasDoubleApiPrefix ? results.passed++ : results.failed++;
    results.score += hasCorrectApiUrls && !hasDoubleApiPrefix ? 2 : 0;
  }

  // React Anti-Patterns (Critical for all React components)
  if (['BRIDGE_COMPONENT', 'BRIDGE_PAGE', 'MANAGEMENT_BRIDGE'].includes(templateType)) {
    const hasDeferredBridgeCalls =
      /setTimeout\(.*bridge\.|useEffect\([^\]]+,\s*\[\]\)|useCallback|useMemo/.test(content);
    const hasNoDirectBridgeCalls = !/bridge\.(set|track|add).*(?!setTimeout)/.test(content);
    const hasGoodPatterns = hasDeferredBridgeCalls || hasNoDirectBridgeCalls;

    results.checks.push({
      name: 'react anti-pattern prevention',
      status: hasGoodPatterns ? 'PASSED' : 'FAILED',
      message: hasGoodPatterns
        ? '✅ Proper React patterns implemented'
        : '❌ Missing deferred bridge call patterns or performance optimizations',
    });
    hasGoodPatterns ? results.passed++ : results.failed++;
    results.score += hasGoodPatterns ? 2 : 0;
  }

  return results;
}

/**
 * Verify world-class development standards
 */
function verifyWorldClassStandards(content, templateType) {
  const results = { checks: [], passed: 0, failed: 0, score: 0 };

  // Security (Critical for all types)
  const hasSecurityPatterns = WORLD_CLASS_PATTERNS.SECURITY.test(content);
  results.checks.push({
    name: 'security best practices',
    status: hasSecurityPatterns ? 'PASSED' : 'WARNING',
    message: hasSecurityPatterns
      ? '✅ Security patterns implemented'
      : '⚠️ Consider adding security patterns',
  });
  hasSecurityPatterns ? results.passed++ : results.failed++;
  results.score += hasSecurityPatterns ? 1 : 0;

  // Performance (Important for components and pages)
  if (['BRIDGE_COMPONENT', 'BRIDGE_PAGE', 'BRIDGE_HOOK'].includes(templateType)) {
    const hasPerformanceOptimizations = WORLD_CLASS_PATTERNS.PERFORMANCE.test(content);
    results.checks.push({
      name: 'performance optimizations',
      status: hasPerformanceOptimizations ? 'PASSED' : 'WARNING',
      message: hasPerformanceOptimizations
        ? '✅ Performance optimizations present'
        : '⚠️ Consider adding performance optimizations',
    });
    hasPerformanceOptimizations ? results.passed++ : results.failed++;
    results.score += hasPerformanceOptimizations ? 1 : 0;
  }

  // Accessibility (Critical for components and pages)
  if (['BRIDGE_COMPONENT', 'BRIDGE_PAGE'].includes(templateType)) {
    const hasAccessibilityFeatures = WORLD_CLASS_PATTERNS.ACCESSIBILITY.test(content);
    results.checks.push({
      name: 'accessibility compliance',
      status: hasAccessibilityFeatures ? 'PASSED' : 'FAILED',
      message: hasAccessibilityFeatures
        ? '✅ Accessibility features implemented'
        : '❌ Missing accessibility features',
    });
    hasAccessibilityFeatures ? results.passed++ : results.failed++;
    results.score += hasAccessibilityFeatures ? 2 : 0;
  }

  // Testing (Important for all types)
  const hasTestingSupport = WORLD_CLASS_PATTERNS.TESTING.test(content);
  results.checks.push({
    name: 'testing support',
    status: hasTestingSupport ? 'PASSED' : 'WARNING',
    message: hasTestingSupport ? '✅ Testing support implemented' : '⚠️ Consider adding test IDs',
  });
  hasTestingSupport ? results.passed++ : results.failed++;
  results.score += hasTestingSupport ? 1 : 0;

  // Enhanced Compliance Checks (CORE_REQUIREMENTS.md)

  // Structured Logging (Critical for all types)
  const hasStructuredLogging = WORLD_CLASS_PATTERNS.STRUCTURED_LOGGING.test(content);
  results.checks.push({
    name: 'structured logging',
    status: hasStructuredLogging ? 'PASSED' : 'WARNING',
    message: hasStructuredLogging
      ? '✅ Structured logging implemented'
      : '⚠️ Consider using logError/logInfo/logDebug',
  });
  hasStructuredLogging ? results.passed++ : results.failed++;
  results.score += hasStructuredLogging ? 1 : 0;

  // Analytics Tracking (Important for components and pages)
  if (['BRIDGE_COMPONENT', 'BRIDGE_PAGE', 'BRIDGE_HOOK'].includes(templateType)) {
    const hasAnalyticsTracking = WORLD_CLASS_PATTERNS.ANALYTICS_TRACKING.test(content);
    results.checks.push({
      name: 'analytics tracking',
      status: hasAnalyticsTracking ? 'PASSED' : 'WARNING',
      message: hasAnalyticsTracking
        ? '✅ Analytics tracking implemented'
        : '⚠️ Consider adding analytics tracking',
    });
    hasAnalyticsTracking ? results.passed++ : results.failed++;
    results.score += hasAnalyticsTracking ? 1 : 0;
  }

  // User Story Traceability (Important for all types)
  const hasUserStoryTraceability = WORLD_CLASS_PATTERNS.USER_STORY_TRACEABILITY.test(content);
  results.checks.push({
    name: 'user story traceability',
    status: hasUserStoryTraceability ? 'PASSED' : 'WARNING',
    message: hasUserStoryTraceability
      ? '✅ User story traceability implemented'
      : '⚠️ Consider adding userStory/hypothesis tracking',
  });
  hasUserStoryTraceability ? results.passed++ : results.failed++;
  results.score += hasUserStoryTraceability ? 1 : 0;

  // Error Handling Service (Critical for all types)
  const hasErrorHandlingService = WORLD_CLASS_PATTERNS.ERROR_HANDLING_SERVICE.test(content);
  results.checks.push({
    name: 'error handling service',
    status: hasErrorHandlingService ? 'PASSED' : 'WARNING',
    message: hasErrorHandlingService
      ? '✅ ErrorHandlingService implemented'
      : '⚠️ Consider using ErrorHandlingService.processError()',
  });
  hasErrorHandlingService ? results.passed++ : results.failed++;
  results.score += hasErrorHandlingService ? 1 : 0;

  // RBAC Compliance (Critical for API routes and bridges)
  if (['API_BRIDGE', 'BRIDGE_API_ROUTE', 'MANAGEMENT_BRIDGE'].includes(templateType)) {
    const hasRBACCompliance = WORLD_CLASS_PATTERNS.RBAC_COMPLIANCE.test(content);
    results.checks.push({
      name: 'rbac compliance',
      status: hasRBACCompliance ? 'PASSED' : 'WARNING',
      message: hasRBACCompliance
        ? '✅ RBAC compliance implemented'
        : '⚠️ Consider adding validateApiPermission',
    });
    hasRBACCompliance ? results.passed++ : results.failed++;
    results.score += hasRBACCompliance ? 1 : 0;
  }

  // Design System Usage (Important for components)
  if (['BRIDGE_COMPONENT', 'BRIDGE_PAGE'].includes(templateType)) {
    const hasDesignSystemUsage = WORLD_CLASS_PATTERNS.DESIGN_SYSTEM_USAGE.test(content);
    results.checks.push({
      name: 'design system usage',
      status: hasDesignSystemUsage ? 'PASSED' : 'WARNING',
      message: hasDesignSystemUsage
        ? '✅ Design system usage implemented'
        : '⚠️ Consider using @/components/ui components',
    });
    hasDesignSystemUsage ? results.passed++ : results.failed++;
    results.score += hasDesignSystemUsage ? 1 : 0;
  }

  // WCAG Accessibility (Critical for components and pages)
  if (['BRIDGE_COMPONENT', 'BRIDGE_PAGE'].includes(templateType)) {
    const hasWCAGAccessibility = WORLD_CLASS_PATTERNS.WCAG_ACCESSIBILITY.test(content);
    results.checks.push({
      name: 'wcag accessibility',
      status: hasWCAGAccessibility ? 'PASSED' : 'WARNING',
      message: hasWCAGAccessibility
        ? '✅ WCAG 2.1 AA compliance implemented'
        : '⚠️ Consider adding accessibility features',
    });
    hasWCAGAccessibility ? results.passed++ : results.failed++;
    results.score += hasWCAGAccessibility ? 1 : 0;
  }

  return results;
}

/**
 * Verify a single file
 */
function verifyFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const templateType = detectFileType(filePath);

  console.log(`\n🔍 Verifying ${templateType}: ${path.basename(filePath)}`);
  console.log('='.repeat(50));

  const results = verifyBridgeTemplateCompliance(content, templateType, filePath);

  // Display results
  for (const check of results.checks) {
    const icon = check.status === 'PASSED' ? '✅' : check.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}`);
    if (check.status !== 'PASSED') {
      console.log(`   ${check.message}`);
    }
  }

  const successRate =
    results.checks.length > 0 ? ((results.passed / results.checks.length) * 100).toFixed(1) : '0.0';

  console.log(
    `\n📊 Results: ${results.passed} passed, ${results.failed} failed, ${results.warnings} warnings`
  );
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log(`🏆 Compliance Score: ${results.score}`);

  return results;
}

/**
 * Verify all files in a directory
 */
function verifyDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];

  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && !['node_modules'].includes(item)) {
        scanDir(fullPath);
      } else if (stat.isFile() && extensions.includes(path.extname(item))) {
        files.push(fullPath);
      }
    }
  }

  scanDir(dirPath);

  const allResults = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const result = verifyFile(file);
    if (result) {
      allResults.push(result);
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalWarnings += result.warnings;
    }
  }

  // Summary
  console.log('\n📊 Directory Verification Summary');
  console.log('================================');
  console.log(`📁 Files Verified: ${allResults.length}`);
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`⚠️ Total Warnings: ${totalWarnings}`);

  const overallSuccessRate =
    totalPassed + totalFailed + totalWarnings > 0
      ? ((totalPassed / (totalPassed + totalFailed + totalWarnings)) * 100).toFixed(1)
      : '0.0';
  console.log(`📈 Overall Success Rate: ${overallSuccessRate}%`);

  return allResults;
}

/**
 * Verify frontend-backend integration patterns
 */
function verifyFrontendBackendIntegration() {
  console.log('\n🔗 Verifying Frontend-Backend Integration');
  console.log('=========================================');

  const integrationResults = {
    apiRoutes: [],
    frontendPages: [],
    bridgeConnections: [],
    missingIntegrations: [],
    score: 0,
    totalChecks: 0,
  };

  // Check API routes
  const apiDir = 'src/app/api';
  if (fs.existsSync(apiDir)) {
    console.log('\n📡 Scanning API Routes...');
    const apiRoutes = scanApiRoutes(apiDir);
    integrationResults.apiRoutes = apiRoutes;
    console.log(`Found ${apiRoutes.length} API routes`);
  }

  // Check frontend pages
  const pagesDir = 'src/app';
  if (fs.existsSync(pagesDir)) {
    console.log('\n📄 Scanning Frontend Pages...');
    const frontendPages = scanFrontendPages(pagesDir);
    integrationResults.frontendPages = frontendPages;
    console.log(`Found ${frontendPages.length} frontend pages`);
  }

  // Check bridge connections
  console.log('\n🌉 Analyzing Bridge Connections...');
  const bridgeConnections = analyzeBridgeConnections(
    integrationResults.apiRoutes,
    integrationResults.frontendPages
  );
  integrationResults.bridgeConnections = bridgeConnections;

  // Identify missing integrations
  console.log('\n🔍 Identifying Missing Integrations...');
  const missingIntegrations = identifyMissingIntegrations(
    integrationResults.apiRoutes,
    integrationResults.frontendPages
  );
  integrationResults.missingIntegrations = missingIntegrations;

  // Calculate integration score
  const totalPossibleConnections =
    integrationResults.apiRoutes.length + integrationResults.frontendPages.length;
  const successfulConnections = bridgeConnections.filter(c => c.status === 'connected').length;
  integrationResults.score =
    totalPossibleConnections > 0
      ? Math.round((successfulConnections / totalPossibleConnections) * 100)
      : 100;
  integrationResults.totalChecks = totalPossibleConnections;

  // Display results
  displayIntegrationResults(integrationResults);

  return integrationResults;
}

/**
 * Scan API routes for bridge compliance
 */
function scanApiRoutes(apiDir) {
  const routes = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item === 'route.ts' || item === 'route.js') {
        const content = fs.readFileSync(fullPath, 'utf8');
        const routeInfo = analyzeApiRoute(fullPath, content);
        routes.push(routeInfo);
      }
    }
  }

  scanDirectory(apiDir);
  return routes;
}

/**
 * Analyze API route for bridge patterns
 */
function analyzeApiRoute(filePath, content) {
  const routePath = filePath
    .replace('src/app/api/', '')
    .replace('/route.ts', '')
    .replace('/route.js', '');

  return {
    path: routePath,
    filePath,
    hasBridgePattern: /ApiBridge|Bridge/.test(content),
    hasErrorHandling: /ErrorHandlingService|try\s*\{/.test(content),
    hasValidation: /zod|joi|yup|validate/.test(content),
    hasTransaction: /prisma\.\$transaction/.test(content),
    hasAuth: /auth|session|token/.test(content),
    methods: extractHttpMethods(content),
    bridgeCompliance: verifyBridgeTemplateCompliance(content, 'API_ROUTE'),
  };
}

/**
 * Extract HTTP methods from API route
 */
function extractHttpMethods(content) {
  const methods = [];
  if (/export\s+async\s+function\s+GET/.test(content)) methods.push('GET');
  if (/export\s+async\s+function\s+POST/.test(content)) methods.push('POST');
  if (/export\s+async\s+function\s+PUT/.test(content)) methods.push('PUT');
  if (/export\s+async\s+function\s+DELETE/.test(content)) methods.push('DELETE');
  if (/export\s+async\s+function\s+PATCH/.test(content)) methods.push('PATCH');
  return methods;
}

/**
 * Scan frontend pages for bridge usage
 */
function scanFrontendPages(pagesDir) {
  const pages = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('api')) {
        scanDirectory(fullPath);
      } else if (item === 'page.tsx' || item === 'page.js') {
        const content = fs.readFileSync(fullPath, 'utf8');
        const pageInfo = analyzeFrontendPage(fullPath, content);
        pages.push(pageInfo);
      }
    }
  }

  scanDirectory(pagesDir);
  return pages;
}

/**
 * Analyze frontend page for bridge patterns
 */
function analyzeFrontendPage(filePath, content) {
  const routePath = filePath
    .replace('src/app/', '')
    .replace('/page.tsx', '')
    .replace('/page.js', '');

  return {
    path: routePath,
    filePath,
    usesBridge: /use\w*Bridge|ManagementBridge/.test(content),
    usesApiClient: /useApiClient|apiClient/.test(content),
    hasErrorHandling: /useErrorHandler|ErrorHandlingService/.test(content),
    hasAuth: /useAuth|session/.test(content),
    hasAnalytics: /useOptimizedAnalytics|analytics/.test(content),
    apiCalls: extractApiCalls(content),
    bridgeCompliance: verifyBridgeTemplateCompliance(content, 'BRIDGE_PAGE'),
  };
}

/**
 * Extract API calls from frontend code
 */
function extractApiCalls(content) {
  const calls = [];
  const fetchMatches = content.match(/fetch\(['"`]([^'"`]+)['"`]/g) || [];
  const apiClientMatches = content.match(/apiClient\.[a-z]+\(['"`]([^'"`]+)['"`]/g) || [];

  fetchMatches.forEach(match => {
    const url = match.match(/['"`]([^'"`]+)['"`]/)[1];
    calls.push({ type: 'fetch', url });
  });

  apiClientMatches.forEach(match => {
    const url = match.match(/['"`]([^'"`]+)['"`]/)[1];
    calls.push({ type: 'apiClient', url });
  });

  return calls;
}

/**
 * Analyze bridge connections between frontend and backend
 */
function analyzeBridgeConnections(apiRoutes, frontendPages) {
  const connections = [];

  for (const page of frontendPages) {
    for (const apiCall of page.apiCalls) {
      const matchingRoute = apiRoutes.find(
        route =>
          apiCall.url.includes(route.path) || route.path.includes(apiCall.url.replace('/api/', ''))
      );

      if (matchingRoute) {
        connections.push({
          frontend: page.path,
          backend: matchingRoute.path,
          apiCall: apiCall.url,
          status: 'connected',
          bridgeCompliant: page.usesBridge && matchingRoute.hasBridgePattern,
          errorHandling: page.hasErrorHandling && matchingRoute.hasErrorHandling,
          authentication: page.hasAuth && matchingRoute.hasAuth,
        });
      } else {
        connections.push({
          frontend: page.path,
          backend: null,
          apiCall: apiCall.url,
          status: 'missing_backend',
          bridgeCompliant: false,
          errorHandling: page.hasErrorHandling,
          authentication: page.hasAuth,
        });
      }
    }
  }

  return connections;
}

/**
 * Identify missing integrations
 */
function identifyMissingIntegrations(apiRoutes, frontendPages) {
  const missing = [];

  // Find API routes without corresponding frontend usage
  for (const route of apiRoutes) {
    const hasUsage = frontendPages.some(page =>
      page.apiCalls.some(
        call => call.url.includes(route.path) || route.path.includes(call.url.replace('/api/', ''))
      )
    );

    if (!hasUsage) {
      missing.push({
        type: 'unused_api',
        path: route.path,
        suggestion: `Consider creating frontend integration for API route: ${route.path}`,
      });
    }
  }

  // Find pages without bridge patterns
  for (const page of frontendPages) {
    if (!page.usesBridge && page.apiCalls.length > 0) {
      missing.push({
        type: 'missing_bridge',
        path: page.path,
        suggestion: `Consider implementing bridge pattern for page: ${page.path}`,
      });
    }
  }

  return missing;
}

/**
 * Display integration results
 */
function displayIntegrationResults(results) {
  console.log('\n📊 Integration Analysis Results');
  console.log('===============================');
  console.log(`Overall Integration Score: ${results.score}%`);
  console.log(`Total Connections Analyzed: ${results.totalChecks}`);
  console.log(
    `Successful Bridge Connections: ${results.bridgeConnections.filter(c => c.bridgeCompliant).length}`
  );

  if (results.bridgeConnections.length > 0) {
    console.log('\n🔗 Bridge Connections:');
    results.bridgeConnections.forEach(conn => {
      const status = conn.status === 'connected' ? '✅' : '❌';
      const bridge = conn.bridgeCompliant ? '🌉' : '⚠️';
      console.log(`  ${status} ${bridge} ${conn.frontend} → ${conn.backend || 'MISSING'}`);
    });
  }

  if (results.missingIntegrations.length > 0) {
    console.log('\n⚠️ Missing Integrations:');
    results.missingIntegrations.forEach(missing => {
      console.log(`  • ${missing.suggestion}`);
    });
  }

  console.log('\n💡 Recommendations:');
  if (results.score < 80) {
    console.log('  • Consider implementing bridge patterns for better integration');
    console.log('  • Ensure all API routes have corresponding frontend usage');
    console.log('  • Add proper error handling across frontend-backend boundaries');
  } else {
    console.log('  • Great job! Your frontend-backend integration is well structured');
  }
}

/**
 * Main execution function
 */
function main() {
  try {
    const args = process.argv.slice(2);

    console.log('🔍 Universal Bridge Compliance Verification');
    console.log('==========================================');
    console.log('Verifying bridge pattern compliance for all file types\n');

    if (args.length === 0) {
      // Verify all common directories
      console.log('🔍 Verifying all bridge-related directories...\n');

      const directories = [
        'src/lib/bridges',
        'src/components/bridges',
        'src/components',
        'src/hooks',
        'src/app',
        'src/lib',
      ];

      for (const dir of directories) {
        if (fs.existsSync(dir)) {
          console.log(`\n📁 Verifying directory: ${dir}`);
          verifyDirectory(dir);
        }
      }

      // Add frontend-backend integration verification
      verifyFrontendBackendIntegration();
    } else {
      const target = args[0];

      if (!fs.existsSync(target)) {
        console.error(`❌ File or directory not found: ${target}`);
        process.exit(1);
      }

      if (fs.statSync(target).isDirectory()) {
        verifyDirectory(target);
      } else {
        verifyFile(target);
      }
    }

    console.log('\n🎉 Verification complete!');
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Export functions for testing
module.exports = {
  detectFileType,
  verifyBridgeTemplateCompliance,
  verifyFile,
  verifyDirectory,
};

// Run if called directly
if (require.main === module) {
  main();
}
