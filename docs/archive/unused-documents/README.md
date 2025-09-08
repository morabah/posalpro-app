# Archived Unused Documents

This directory contains documentation files that were identified as unused or deprecated and moved from the main `docs/` directory to reduce clutter and maintainability overhead.

## Archived Documents

### Architecture & Design Documents
- **`ADMIN_MIGRATION_ASSESSMENT.md`** - Assessment of admin component migration (superseded by newer migration docs)
- **`ARCHITECTURE_DIAGRAM.md`** - Architecture diagram (replaced by current system documentation)
- **`ARCHITECTURE_DIAGRAM_SIMPLE.md`** - Simplified architecture diagram (outdated)

### Audit & Assessment Documents
- **`ADDITIONAL_ARCHIVE_CANDIDATES_AUDIT.md`** - Audit of additional archive candidates (completed audit)
- **`DOCUMENTATION_ARCHIVE_AUDIT.md`** - Documentation archive audit (completed audit)

### Component Documentation
- **`components/SuggestionCombobox.md`** - Component documentation for SuggestionCombobox (component likely removed)

### Development & Framework Documents
- **`framework/AI_DEVELOPMENT_METHODOLOGY.md`** - AI development methodology guide (superseded by current practices)
- **`error-boundaries-usage.md`** - Error boundaries usage guide (integrated into main docs)
- **`HTTP_CLIENT_GUIDE.md`** - HTTP client usage guide (integrated into main development standards)

### Testing Documents
- **`TESTING_GUIDELINES.md`** - Testing guidelines (superseded by current testing standards)

### Pattern & Implementation Documents
- **`outbox-pattern-usage.md`** - Outbox pattern usage guide (pattern not implemented)

## Archival Date
These documents were archived on: **2024-12-19**

## Archival Criteria Applied

Documents were archived if they met **ALL** of the following conditions:
- ✅ **Not referenced** in `README.md` or main project documentation
- ✅ **Not referenced** in any active source code files
- ✅ **Not referenced** in package.json scripts or configuration
- ✅ **Not referenced** in CI/CD or deployment scripts
- ✅ **Not essential** for current development workflow
- ✅ **Outdated** or superseded by newer documentation

## Active Documents Preserved

All **actively used documents** referenced in the main project documentation remain in the main `docs/` directory, including:

### Core Documentation (MANDATORY)
- **`CORE_REQUIREMENTS.md`** - Non-negotiable standards and patterns
- **`DEVELOPMENT_STANDARDS.md`** - Complete implementation guide
- **`PROJECT_REFERENCE.md`** - Central navigation hub
- **`IMPLEMENTATION_LOG.md`** - Implementation tracking
- **`LESSONS_LEARNED.md`** - Critical lessons and patterns

### Setup & Environment
- **`ENVIRONMENT_SETUP.md`** - Environment configuration
- **`NETLIFY_DEPLOYMENT_GUIDE.md`** - Deployment procedures
- **`DEPLOYMENT_GUIDE.md`** - Comprehensive deployment guide

### Feature Documentation
- **`FEATURE_GATE_USAGE.md`** - Feature gating implementation
- **`RBAC_SECURITY_GUIDE.md`** - Security and access control
- **`MOBILE_RESPONSIVENESS_GUIDE.md`** - Mobile development guide
- **`VALIDATION_LIBRARY_GUIDE.md`** - Validation patterns

### Testing & Quality
- **`TESTING_CODEBASE_AUDIT.md`** - Current testing standards
- **`VERSION_HISTORY.md`** - Version tracking and releases

## Restoration Process

If any archived document is needed in the future:

1. **Check git history** for the original document:
   ```bash
   git show <commit>:<path/to/document.md>
   ```

2. **Restore to main docs directory**:
   ```bash
   git checkout <commit> -- docs/<document-name>.md
   ```

3. **Update main documentation** to reference the restored document if needed

4. **Update this README** to reflect the restoration:
   ```bash
   # Remove from archived list
   # Add restoration note with date
   ```

## Contact

If you need to restore any of these documents, please contact the development team with:
- Document name and purpose
- Why the document is needed
- How it will be maintained going forward

## Maintenance Notes

- This archive is created to maintain project cleanliness
- Documents may contain useful historical information
- Restoration should be considered carefully to avoid documentation bloat
- New documents should follow the established patterns before being added to main docs

