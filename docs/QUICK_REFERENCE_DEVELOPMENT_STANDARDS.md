# 🚀 QUICK REFERENCE: Development Standards Checklist

## ⚡ IMMEDIATE PRE-DEVELOPMENT VALIDATION

### 🔧 Technical Prerequisites

- [ ] `npm run type-check` → 0 errors ✅
- [ ] ErrorHandlingService imports ready (ErrorHandlingService, StandardError,
      ErrorCodes, useErrorHandler)
- [ ] Existing pattern search completed (src/lib/, src/hooks/, src/components/)
- [ ] Performance optimization strategy defined

### 📱 Mobile Touch Interaction Review (CRITICAL)

- [ ] Component contains touch handlers? → **Smart event filtering REQUIRED**
- [ ] Form fields present? → **stopPropagation() pattern REQUIRED**
- [ ] Touch target sizing verified (44px+ minimum)
- [ ] Single-tap field access tested on mobile devices

### 🎨 UI & Accessibility Compliance

- [ ] Wireframe reference identified:
      `front end structure/wireframes/[SCREEN_NAME].md`
- [ ] WCAG 2.1 AA compliance verified (contrast 4.5:1, keyboard navigation)
- [ ] Component Traceability Matrix planned (user stories, acceptance criteria,
      hypotheses)

## 🔥 CRITICAL IMPLEMENTATION PATTERNS

### 📱 Mobile Touch Event Conflict Prevention (MANDATORY)

```javascript
// ✅ REQUIRED: Smart event target filtering for touch + form components
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  const target = e.target as HTMLElement;
  const isInteractiveElement =
    target.matches('input, select, textarea, button, [role="button"], [tabindex], a') ||
    target.closest('input, select, textarea, button, [role="button"], [tabindex], a');

  // Skip gesture handling if touching form fields
  if (isInteractiveElement) return;

  // Continue with gesture handling...
}, []);

// ✅ REQUIRED: Form component touch isolation
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  e.stopPropagation(); // Prevent parent interference
  // Add visual feedback...
}, []);
```

### 🔧 Error Handling (MANDATORY)

```javascript
// ✅ REQUIRED: Standardized error handling
import {
  ErrorHandlingService,
  StandardError,
  ErrorCodes,
  useErrorHandler,
} from '@/lib/errors';

const errorHandlingService = ErrorHandlingService.getInstance();
const { handleAsyncError } = useErrorHandler();

try {
  // Implementation
} catch (error) {
  errorHandlingService.processError(
    error,
    'Operation description',
    ErrorCodes.CATEGORY.SPECIFIC_ERROR,
    { component: 'ComponentName', operation: 'operationName' }
  );
}
```

### 📊 Analytics Integration (REQUIRED)

```javascript
// ✅ REQUIRED: Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-X.X'],
  acceptanceCriteria: ['AC-X.X.X'],
  hypotheses: ['HX'],
  testCases: ['TC-HX-XXX'],
};

// ✅ REQUIRED: Analytics tracking
analytics.track('event_name', {
  userStories: COMPONENT_MAPPING.userStories,
  hypotheses: COMPONENT_MAPPING.hypotheses,
  componentMapping: COMPONENT_MAPPING,
});
```

## 🔍 SYSTEMATIC ANALYSIS METHODOLOGY

### Touch-Enabled Component Analysis

1. **Pattern Search**: `grep -r "onTouchStart|onTouchMove|onTouchEnd" src/`
2. **Classification**: Safe/Problematic/Enhanced
3. **Conflict Detection**: Touch event hierarchy analysis
4. **Solution Application**: Smart event filtering implementation
5. **Documentation**: Touch patterns and prevention strategies

## ✅ POST-IMPLEMENTATION VALIDATION

### 🔧 Technical Verification

- [ ] `npm run type-check` → 0 errors
- [ ] `npm run build` → successful compilation
- [ ] Mobile testing: Single-tap field access verified
- [ ] Performance metrics within thresholds

### 📚 Documentation Updates (MANDATORY)

- [ ] **IMPLEMENTATION_LOG.md** updated with phase, status, traceability
- [ ] **LESSONS_LEARNED.md** updated for complex implementations
- [ ] Touch interaction patterns documented
- [ ] Prevention strategies established

### 📱 Mobile Touch Validation

- [ ] Systematic analysis completed for touch-enabled components
- [ ] Universal solution patterns applied consistently
- [ ] Touch conflict prevention documented
- [ ] Single-tap accessibility verified

## 🚨 CRITICAL FAILURE POINTS TO AVOID

### ❌ NEVER DO

- Custom error handling (use ErrorHandlingService only)
- TypeScript `any` types (maintain 100% type safety)
- Touch handlers without interactive element filtering
- Form components without stopPropagation()
- UI implementation without wireframe reference
- Missing Component Traceability Matrix

### ✅ ALWAYS DO

- Search existing patterns before implementing
- Apply smart event target filtering for touch + form combinations
- Use established performance infrastructure
- Update documentation after implementation
- Test mobile touch interactions on real devices
- Follow systematic analysis methodology

## 🎯 QUALITY GATES CHECKLIST

### Pre-Commit Validation

- [ ] TypeScript: 0 errors
- [ ] Mobile: Touch interactions tested
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Performance: Optimizations applied
- [ ] Documentation: Updates completed

### Mobile Touch Interaction Gates

- [ ] Smart event filtering implemented
- [ ] Form field isolation verified
- [ ] Touch target sizing validated (44px+)
- [ ] Single-tap field access confirmed
- [ ] Cross-platform testing completed

---

**⚡ SPEED TIP**: Use this checklist for every implementation to maintain our
industry-leading 100% TypeScript compliance, zero mobile touch conflicts, and
comprehensive quality standards!
