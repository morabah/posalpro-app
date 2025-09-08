# Archived Unused Scripts

This directory contains scripts that were identified as unused or deprecated and moved from the main `scripts/` directory to reduce clutter and maintainability overhead.

## Archived Scripts

### Development/Debugging Scripts
- **`detect-any-implementations.js`** - Comprehensive TypeScript "any" type detection (replaced by built-in type checking)
- **`quick-any-check.js`** - Fast "any" type scanner (deprecated)
- **`any-implementation-summary.js`** - "Any" type analysis summary generator (deprecated)

### API Management Scripts
- **`manage-api-keys.js`** - API key creation and management (not referenced in package.json)
- **`manage-idempotency.js`** - Idempotency key management (not referenced in package.json)

### Authentication Scripts
- **`generate-nextauth-token.ts`** - NextAuth token generation utility (not referenced)

### Build/Asset Scripts
- **`generate-pwa-icons.js`** - PWA icon generation (not referenced)

### Database Scripts
- **`fix-broken-imports.js`** - Import fixing utility (not referenced)
- **`fix-database-imports.js`** - Database import fixer (not referenced)
- **`fix-numeric-data.js`** - Numeric data correction (not referenced)

### Performance Scripts
- **`load-testing.js`** - Load testing utility (not referenced)
- **`performance-regression-test.js`** - Performance regression testing (not referenced)

### Testing Scripts
- **`test-bridge-templates.js`** - Bridge template testing (not referenced)

## Archival Date
These scripts were archived on: **2024-12-19**

## Restoration Process
If any of these scripts are needed in the future:

1. Check the git history for the original script
2. Restore from git: `git show <commit>:<path/to/script>`
3. Update package.json if the script should be re-integrated
4. Update this README to reflect the restoration

## Criteria for Archival
Scripts were archived if they met ALL of the following criteria:
- Not referenced in `package.json` scripts section
- Not referenced in any documentation files
- Not referenced in CI/CD configuration
- Not referenced in other build/deployment scripts
- Not essential for core development workflow

## Contact
If you need to restore any of these scripts, please contact the development team.

