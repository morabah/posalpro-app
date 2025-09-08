# Archived Obsolete Test Files

This directory contains Jest test files and test suites that were identified as obsolete or not integrated with the main Jest test runner.

## Archived Test Suites

### Functional Test Suite (88 files)
**Location:** `tests/archive/obsolete-tests/functional/`

**Description:** Custom functional test suite with orchestrators and API clients for customer, product, proposal, and version-history modules.

**Files Moved:**
- `tests/functional/customer/` - 25 files (Customer module tests)
- `tests/functional/product/` - 25 files (Product module tests)
- `tests/functional/proposal/` - 25 files (Proposal module tests)
- `tests/functional/version-history/` - 25 files (Version History module tests)
- `tests/functional/README.md` - Functional test suite documentation

### Root-Level Test Scripts (8 files)
**Location:** `tests/archive/obsolete-tests/`

**Description:** Individual test scripts for various modules and functionality.

**Files Moved:**
- `test-admin-data.js` - Admin data testing script
- `test-auth.js` - Authentication testing script
- `test-bridge-verification.js` - Bridge verification testing script
- `test-enhanced-patterns.js` - Enhanced patterns testing script
- `test-proposal-api.js` - Proposal API testing script
- `test-real-product-data.js` - Real product data testing script
- `test-version-history-api.js` - Version history API testing script
- `test-version-history-service.js` - Version history service testing script

**Why Archived:**
- ✅ **Not integrated with Jest** - Uses custom test runners instead of Jest
- ✅ **Separate execution** - Requires manual execution with `npx tsx` instead of `npm test`
- ✅ **Duplicate coverage** - Functionality already covered by Jest test suite in `src/test/`
- ✅ **Maintenance overhead** - Additional test suite to maintain separately

## Active Test Suite (54 files)

All active Jest tests remain in their original locations:
- `src/test/` - Main Jest test suite (54 files)
- `src/components/**/__tests__/` - Component tests
- `src/app/**/__tests__/` - Page/component tests

**Active Test Categories:**
- Unit tests (`src/test/unit/`)
- Integration tests (`src/test/integration/`)
- API tests (`src/test/api/`, `src/test/api-routes/`)
- Security tests (`src/test/security/`)
- Accessibility tests (`src/test/accessibility/`)
- Critical gap tests (`src/test/critical-gaps/`)
- Production readiness tests (`src/test/production/`)
- Component tests (`src/components/**/__tests__/`)
- Page tests (`src/app/**/__tests__/`)

## Archival Criteria Applied

Test files were archived if they met **ALL** of the following conditions:
- ✅ **Not run by Jest** - Not included in `jest.config.mjs` patterns
- ✅ **Not referenced in package.json** - Not in test scripts
- ✅ **Custom execution required** - Requires manual `npx tsx` execution
- ✅ **Functionality duplicated** - Coverage already exists in main Jest suite
- ✅ **Separate maintenance** - Additional test infrastructure to maintain

## Restoration Process

If functional tests need to be restored:

1. **Move back to main location:**
   ```bash
   mv tests/archive/obsolete-tests/functional/* tests/functional/
   ```

2. **Update package.json** if integration is desired:
   ```json
   {
     "scripts": {
       "test:functional": "npx tsx tests/functional/customer/main-orchestrator.ts"
     }
   }
   ```

3. **Update Jest configuration** if Jest integration is desired:
   ```javascript
   // jest.config.mjs
   testMatch: [
     // ... existing patterns
     'tests/functional/**/*.test.ts'
   ]
   ```

## Test Coverage Analysis

**Before Archival:**
- Jest tests: 54 files (actively maintained)
- Functional tests: 88 files (archived)
- Root-level test scripts: 8 files (archived)
- Total test files: 150 files

**After Archival:**
- Jest tests: 54 files (actively maintained)
- Functional tests: 88 files (archived, available if needed)
- Root-level test scripts: 8 files (archived, available if needed)
- Total active test files: 54 files
- Reduction: ~64% cleaner test directory

## Test Execution

**Active Jest Tests:**
```bash
npm run test                    # All Jest tests
npm run test:ci:unit           # Unit tests only
npm run test:integration       # Integration tests
npm run test:accessibility     # Accessibility tests
npm run test:security          # Security tests
npm run test:e2e               # End-to-end tests
```

**Archived Functional Tests (if restored):**
```bash
npx tsx tests/functional/customer/main-orchestrator.ts
npx tsx tests/functional/product/main-orchestrator.ts
npx tsx tests/functional/proposal/main-orchestrator.ts
npx tsx tests/functional/version-history/main-orchestrator.ts
```

## Quality Assurance

All active Jest tests are:
- ✅ **Integrated with CI/CD** - Run automatically in pipelines
- ✅ **Coverage reporting** - Included in coverage reports
- ✅ **Quality gates** - Block commits if failing
- ✅ **Modern patterns** - Use current Jest and Testing Library APIs
- ✅ **TypeScript support** - Full type checking enabled

## Contact

If functional tests need to be restored or if you need to access archived test files, please contact the development team.
