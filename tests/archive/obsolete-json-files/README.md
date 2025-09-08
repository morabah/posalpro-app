# Archived Obsolete JSON Files

This directory contains JSON files that were identified as obsolete or temporary and moved from the project root to reduce clutter and maintainability overhead.

## Archived JSON Files

### Session & Cache Files (10 files)
**Location:** `tests/archive/obsolete-json-files/`

**Description:** Authentication session files and IDE cache files that contain temporary state.

**Files Moved:**
- `.posalpro-cli-session.json` - CLI authentication session
- `.posalpro-cli-session-admin.json` - Admin CLI session
- `.posalpro-cli-session-dashboard-test.json` - Dashboard test session
- `.posalpro-cli-session-fresh-test.json` - Fresh test session
- `.posalpro-cli-session-get.json` - GET request session
- `.posalpro-ui-session.json` - UI authentication session
- `.cursor/environment.json` - IDE environment configuration

**Why Archived:**
- ✅ **Temporary state** - Contains authentication tokens and session data
- ✅ **Security sensitive** - Should not be committed to version control
- ✅ **Generated files** - Created during development/testing sessions
- ✅ **No active references** - Not imported or referenced by application code

### Test Output & Analysis Files (2 files)
**Location:** `tests/archive/obsolete-json-files/`

**Description:** Test execution results and code analysis reports.

**Files Moved:**
- `test_output.json` - Functional test execution results (61 tests, 86.9% pass rate)
- `any-implementation-report.json` - TypeScript "any" type analysis report (2376 instances found)

**Why Archived:**
- ✅ **Historical data** - Test results from specific test runs
- ✅ **Analysis artifacts** - Code analysis reports, not application data
- ✅ **Large files** - test_output.json is 488 lines, any-implementation-report.json is 10K+ lines
- ✅ **Not referenced** - Not imported by application code

### Sample Data Files (4 files)
**Location:** `tests/archive/obsolete-json-files/`

**Description:** Sample/test data files containing customer and product information.

**Files Moved:**
- `customers_2025-09-03.json` - Sample customer data (older version)
- `customers_2025-09-04.json` - Sample customer data (newer version)
- `products_2025-09-04.json` - Sample product data
- `database-integrity-report.json` - Database integrity check results

**Why Archived:**
- ✅ **Sample data** - Test/demo data, not production data
- ✅ **Not referenced** - No imports or references in application code
- ✅ **Dated filenames** - Version-specific data files
- ✅ **Large files** - Contains substantial test data

### Performance Analysis Files (4 files)
**Location:** `tests/archive/obsolete-json-files/`

**Description:** Performance baseline, current metrics, and regression analysis reports.

**Files Moved:**
- `performance-baseline.json` - Performance baseline measurements
- `performance-current.json` - Current performance metrics
- `performance-regression-report.json` - Performance regression analysis
- `performance-report.json` - General performance report

**Why Archived:**
- ✅ **Historical metrics** - Performance data from specific time periods
- ✅ **Analysis artifacts** - Not part of application runtime
- ✅ **Referenced in archives** - Only referenced in archived scripts/docs
- ✅ **Not current** - May not reflect current application state

## Archival Date
These JSON files were archived on: **2024-12-19**

## Archival Criteria Applied

JSON files were archived if they met **ALL** of the following conditions:
- ✅ **Not referenced in application code** - No imports or references
- ✅ **Not referenced in package.json** - Not in scripts or configuration
- ✅ **Not essential for development** - Not required for building/running
- ✅ **Contains temporary/state data** - Sessions, cache, test results
- ✅ **Large or historical files** - Substantial size or outdated content

## Active JSON Files Preserved

All **essential JSON files** remain in their original locations:

### Core Configuration Files
- **`package.json`** - NPM package configuration and scripts
- **`package-lock.json`** - NPM dependency lock file
- **`tsconfig.json`** & **`tsconfig.*.json`** - TypeScript configuration
- **`.vscode/settings.json`** - IDE workspace settings
- **`.vscode/extensions.json`** - Recommended VS Code extensions
- **`windsurf.json`** - Windsurf IDE configuration
- **`.pa11yci.json`** - Accessibility testing configuration

### Application Assets
- **`public/manifest.json`** - PWA manifest file
- **`src/app/api/docs/openapi.json`** - API documentation schema

## File Size Impact

**Before Archival:**
- 19+ JSON files in project root and main directories
- Significant disk usage from large test output files
- Cluttered project structure

**After Archival:**
- 9 essential JSON files remain active
- 10+ obsolete files moved to archive
- Cleaner project root directory
- Reduced maintenance overhead

## Restoration Process

If any archived JSON file is needed in the future:

1. **Check git history** for the original file:
   ```bash
   git show <commit>:<path/to/file.json>
   ```

2. **Restore from archive**:
   ```bash
   cp tests/archive/obsolete-json-files/<file.json> .
   ```

3. **Update project** if the file should be re-integrated:
   ```json
   // If it's configuration, update package.json or tsconfig.json
   // If it's data, update import statements
   ```

4. **Update this README** with restoration details

## Security Considerations

**Archived session files contain sensitive data:**
- Authentication tokens and cookies
- Session identifiers
- User credentials (hashed/signed)

**These files should never be:**
- Committed to version control
- Shared with other developers
- Used in production environments

## Contact

If you need to restore any of these JSON files, please contact the development team with:
- File name and purpose
- Why the file is needed
- How it will be maintained going forward

## Maintenance Notes

- This archive maintains historical development artifacts
- Session files should be regenerated, not restored
- Performance metrics may be outdated
- Sample data should be regenerated from current schemas

