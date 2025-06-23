# CORE REQUIREMENTS (Non-Negotiable)

## 🔧 **ERROR HANDLING & TYPE SAFETY**

**🛡️ Error Handling: Use standardized ErrorHandlingService system only**

- Import: ErrorHandlingService, StandardError, ErrorCodes, useErrorHandler
- Pattern: errorHandlingService.processError() in all catch blocks
- Never: Custom error handling - always use established infrastructure

**📝 TypeScript: Maintain 100% type safety (0 errors)**

- Verify: npm run type-check → 0 errors before any commit
- Use: Explicit interfaces, strict typing, no any types
- Standard: Follow DEVELOPMENT_STANDARDS.md patterns

## 🔍 **DUPLICATE PREVENTION & EXISTING PATTERNS**

**♻️ Check for Established Implementations First**

- Search: src/lib/services/, src/hooks/, src/components/
- Audit: `npm run audit:duplicates` before creating new files
- Matrix: Consult File Responsibility Matrix in DEVELOPMENT_STANDARDS.md
- Reuse: Don't recreate existing functionality
- Extend: Build upon current infrastructure

**📋 Critical Reference Documents (MANDATORY)**

- **TIER 1**: PROJECT_REFERENCE.md, WIREFRAME_INTEGRATION_GUIDE.md,
  DEVELOPMENT_STANDARDS.md
- **TIER 2**: USER_STORY_TRACEABILITY_MATRIX.md, COMPONENT_STRUCTURE.md,
  DATA_MODEL.md
- **TIER 3**: IMPLEMENTATION_LOG.md, VERSION_HISTORY.md, LESSONS_LEARNED.md
- **Full List**: docs/CRITICAL_REFERENCE_DOCUMENTS.md

## 📱 **MOBILE TOUCH INTERACTIONS (CRITICAL)**

**🎯 Touch Event Conflict Prevention: Mandatory for touch + form components**

- Pattern: Smart event target filtering with interactive element detection
- Code: Skip gesture handling if touching input/select/textarea/button elements
- Forms: Use stopPropagation() + visual feedback in all form components
- Testing: Single-tap field access verified on mobile devices

## ⚡ **DATA FETCHING & PERFORMANCE (CRITICAL)**

**🚀 MANDATORY: Always use useApiClient pattern for data fetching**

- Pattern: Follow BasicInformationStep.tsx customer selection as gold standard
- Code: `const apiClient = useApiClient();` + simple `useEffect` +
  `apiClient.get()`
- Never: Custom caching systems, direct fetch() calls, complex loading states
- Reference: [Lesson #12 in LESSONS_LEARNED.md][memory:3929430536446174589]]

**⚡ Proven Performance Pattern:**

```typescript
const apiClient = useApiClient();
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/endpoint');
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

**🚫 FORBIDDEN Data Fetching Patterns:**

- Custom caching with localStorage/memory maps
- Direct `fetch()` calls or `axios` usage
- Complex loading state management
- Multiple useEffect dependencies causing re-fetches
- Any pattern that takes >1 second to load data

## ⚡ **PERFORMANCE & ANALYTICS**

**📊 Component Traceability Matrix: Map all implementations**

- Required: User stories, acceptance criteria, hypotheses, test cases
- Analytics: useAnalytics() with hypothesis validation tracking
- Performance: Web Vitals monitoring with usePerformanceOptimization()

**🚀 Optimization: Use existing performance infrastructure**

- Data Fetching: useApiClient pattern (MANDATORY - see above)
- Database: DatabaseQueryOptimizer for all queries
- Bundle: Lazy loading with BundleOptimizer
- Caching: Only use built-in apiClient caching (no custom solutions)

## ♿ **ACCESSIBILITY & UI STANDARDS**

**🎨 Wireframe Compliance: Reference wireframe documents for all UI**

- Path: front end structure/wireframes/[SCREEN_NAME].md
- Pattern: Follow WIREFRAME_INTEGRATION_GUIDE.md
- Consistency: Apply WIREFRAME_CONSISTENCY_REVIEW.md standards

**♿ WCAG 2.1 AA: Mandatory accessibility compliance**

- Touch: 44px+ minimum targets for mobile (enforced)
- Contrast: 4.5:1 ratio minimum
- Navigation: Full keyboard and screen reader support

## 📚 **DOCUMENTATION & VALIDATION**

**📝 Required Updates: Update documentation after implementation**

- Always: IMPLEMENTATION_LOG.md with phase, status, traceability
- Complex: LESSONS_LEARNED.md for significant implementations
- Major: PROJECT_REFERENCE.md for new components/APIs
- Scripts: Update File Responsibility Matrix for new scripts
- Mobile: Touch interaction patterns and conflict resolution documented

**🔍 Quality Gates: All implementations must pass**

- Build: npm run build → successful compilation
- Types: npm run type-check → 0 errors
- Duplicates: npm run audit:duplicates → review findings
- Mobile: Touch interaction testing on real devices
- Performance: Data loading <1 second (verify against customer selection
  baseline)

## 🔍 **PRE-IMPLEMENTATION CHECKLIST**

**📋 Before Starting ANY Implementation:**

- [ ] npm run type-check → 0 errors
- [ ] npm run audit:duplicates → no conflicts with new functionality
- [ ] Existing pattern search completed (services, hooks, components)
- [ ] File Responsibility Matrix consulted (DEVELOPMENT_STANDARDS.md)
- [ ] Critical reference documents reviewed (Tier 1 minimum)
- [ ] ErrorHandlingService imports ready
- [ ] useApiClient pattern planned (for any data fetching)
- [ ] Wireframe reference identified and reviewed
- [ ] Component Traceability Matrix planned
- [ ] Performance optimization strategy defined (must use proven patterns)
- [ ] Documentation update plan established
- [ ] Mobile touch interactions analyzed (if applicable)
- [ ] Touch event conflict prevention implemented (if touch + forms)
- [ ] Touch target sizing verified (44px+ minimum)

## 🚀 **DEPLOYMENT & VERSION MANAGEMENT**

**📦 Automated Systems (No Manual Intervention)**

- Version History: Automatically updated via scripts/update-version-history.js
- Deployment: Use scripts/deploy.sh with proper version type
  (alpha/beta/rc/patch/minor/major)
- Information: Check deployment status with `npm run deployment:info`
- Never: Manual version history entries or duplicate deployment scripts

**🎯 Script Usage Guidelines**

- **Deployment**: `npm run deploy:alpha` (primary deployment command)
- **Development**: `npm run dev:smart` (health checks + smart startup)
- **Information**: `npm run deployment:info` (deployment history and status)
- **Auditing**: `npm run audit:duplicates` (check for duplicate functionality)

---

**💡 Quick Reference Commands:**

```bash
# Pre-implementation checks
npm run type-check && npm run audit:duplicates

# Check critical documents
ls docs/CRITICAL_REFERENCE_DOCUMENTS.md

# Deployment (choose appropriate type)
npm run deploy:alpha  # For feature development
npm run deploy:beta   # For feature complete testing
npm run deploy:patch  # For production bug fixes

# Get deployment information
npm run deployment:info
```

**🚀 CRITICAL PERFORMANCE LESSONS:**

- **ALWAYS** use useApiClient pattern for data fetching
- **NEVER** implement custom caching systems
- **REFERENCE** BasicInformationStep.tsx customer selection as gold standard
- **VALIDATE** against <1 second loading time baseline
- **REMEMBER** [Lesson #12: Complex caching systems cause more problems than
  they solve][memory:3929430536446174589]]
