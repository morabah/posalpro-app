# Schema Validation System

## Overview

The Schema Validation System is a comprehensive solution to prevent deployment
failures caused by schema mismatches between the main Prisma schema
(`prisma/schema.prisma`) and the production schema
(`prisma/schema.production.prisma`).

## Problem Solved

### Common Issues Prevented:

- ❌ **Build Failures**:
  `Property 'fieldName' does not exist in type 'ModelSelect'`
- ❌ **TypeScript Errors**: Missing fields in Prisma client types
- ❌ **Runtime Errors**: Database queries failing due to missing fields
- ❌ **Deployment Failures**: Netlify builds failing during TypeScript
  compilation

### Root Causes:

1. **Schema Drift**: Main schema updated but production schema not synchronized
2. **Missing Fields**: New fields added to main schema but not production
3. **Missing Models**: New models added to main schema but not production
4. **Missing Relations**: Relationship fields missing between models
5. **Missing Indexes**: Database indexes not synchronized

## Solution Components

### 1. Schema Consistency Validator (`scripts/validate-schema-consistency.js`)

**Purpose**: Comprehensive validation of schema consistency between main and
production schemas.

**Features**:

- ✅ **Model Comparison**: Detects missing models in production schema
- ✅ **Field Comparison**: Identifies missing fields in models
- ✅ **Enum Comparison**: Validates enum definitions and values
- ✅ **Type Validation**: Compares field types between schemas
- ✅ **Detailed Reporting**: Provides specific line numbers and error details
- ✅ **Color-coded Output**: Easy-to-read validation reports

**Usage**:

```bash
# Manual validation
npm run validate:schema

# Direct script execution
node scripts/validate-schema-consistency.js
```

**Output Example**:

```
🔍 Starting schema consistency validation...
ℹ️  Parsing main schema...
ℹ️  Parsing production schema...
ℹ️  Comparing schemas...

================================================================================
SCHEMA CONSISTENCY VALIDATION REPORT
================================================================================
✅ 🎉 Schema consistency validation passed!
ℹ️  Both schemas are perfectly synchronized.
```

### 2. Pre-commit Schema Validation Hook (`scripts/pre-commit-schema-check.js`)

**Purpose**: Automatic validation before commits to prevent schema issues from
being committed.

**Features**:

- ✅ **Automatic Detection**: Runs only when schema files are staged
- ✅ **Comprehensive Validation**: Runs both schema and TypeScript checks
- ✅ **Commit Blocking**: Prevents commits with schema inconsistencies
- ✅ **Clear Error Messages**: Provides actionable feedback

**Usage**:

```bash
# Manual pre-commit check
npm run pre-commit:schema

# Automatic (via git hooks)
git commit -m "your message"  # Automatically runs validation
```

### 3. NPM Scripts Integration

**Added to `package.json`**:

```json
{
  "scripts": {
    "validate:schema": "node scripts/validate-schema-consistency.js",
    "pre-commit:schema": "node scripts/pre-commit-schema-check.js"
  }
}
```

## Validation Process

### 1. Schema Parsing

- Parses both main and production schemas
- Extracts models, fields, enums, and relationships
- Tracks line numbers for error reporting

### 2. Comparison Logic

- **Models**: Compares model names and structures
- **Fields**: Validates field names, types, and properties
- **Enums**: Checks enum definitions and values
- **Relations**: Validates relationship fields and references

### 3. Error Reporting

- **Critical Errors**: Missing models, fields, or enum values
- **Warnings**: Type mismatches or extra fields
- **Recommendations**: Actionable steps to fix issues

## Common Fixes Applied

### Recent Schema Synchronization:

1. **Added Missing Models**:
   - `Plan` model with `PlanTier` enum
   - `Subscription` model with `SubscriptionStatus` enum
   - `Entitlement` model

2. **Added Missing Fields**:
   - `Tenant.stripeCustomerId` for Stripe integration
   - `Product.datasheetPath` for document management
   - `ProposalSection.proposalProducts` relation
   - `ProposalProduct.sectionId` and `section` relation

3. **Added Missing Indexes**:
   - `[proposalId, sectionId]` composite index

## Integration with Development Workflow

### 1. Pre-commit Validation

```bash
# Automatic validation on commit
git add prisma/schema.production.prisma
git commit -m "update schema"  # Runs validation automatically
```

### 2. Manual Validation

```bash
# Before deployment
npm run validate:schema

# Before committing
npm run pre-commit:schema
```

### 3. CI/CD Integration

```bash
# In deployment pipeline
npm run validate:schema
npm run type-check
npm run build
```

## Error Prevention Strategies

### 1. **Schema-First Development**

- Always update both schemas when making changes
- Run validation after schema modifications
- Test locally before committing

### 2. **Automated Validation**

- Pre-commit hooks prevent bad commits
- CI/CD validation catches issues early
- Regular validation runs in development

### 3. **Documentation**

- Keep schema changes documented
- Update this guide when adding new validation rules
- Share validation results with team

## Troubleshooting

### Common Validation Errors:

#### 1. Missing Field Error

```
❌ Missing field in production schema: ModelName.fieldName (line 123 in main schema)
```

**Fix**: Add the missing field to production schema

#### 2. Missing Model Error

```
❌ Missing model in production schema: ModelName (line 456 in main schema)
```

**Fix**: Copy the entire model from main to production schema

#### 3. Type Mismatch Warning

```
⚠️ Field type mismatch: ModelName.fieldName - Main: String, Production: Int
```

**Fix**: Update field type in production schema to match main

### Validation Script Issues:

#### 1. Script Not Found

```bash
# Make sure scripts are executable
chmod +x scripts/validate-schema-consistency.js
chmod +x scripts/pre-commit-schema-check.js
```

#### 2. Permission Denied

```bash
# Run with proper permissions
node scripts/validate-schema-consistency.js
```

## Best Practices

### 1. **Regular Validation**

- Run validation before every deployment
- Validate after schema changes
- Include validation in CI/CD pipeline

### 2. **Schema Maintenance**

- Keep both schemas synchronized
- Document schema changes
- Review validation reports regularly

### 3. **Error Handling**

- Fix critical errors immediately
- Address warnings proactively
- Test fixes locally before committing

## Future Enhancements

### Planned Features:

- 🔄 **Auto-sync**: Automatic schema synchronization
- 📊 **Validation Metrics**: Track validation history
- 🔔 **Notifications**: Alert on schema drift
- 🎯 **Selective Validation**: Validate specific models only

### Integration Opportunities:

- **GitHub Actions**: Automated validation on PR
- **Slack Integration**: Validation notifications
- **Database Migrations**: Auto-generate migration scripts

## Support

### Getting Help:

1. **Check Validation Output**: Review error messages and recommendations
2. **Compare Schemas**: Use diff tools to identify differences
3. **Test Locally**: Run validation and type-check before committing
4. **Document Issues**: Keep track of common problems and solutions

### Contact:

- **Documentation**: This file and inline comments
- **Scripts**: `scripts/validate-schema-consistency.js`
- **Issues**: Create GitHub issues for bugs or feature requests

---

## Quick Reference

### Commands:

```bash
# Validate schemas
npm run validate:schema

# Pre-commit check
npm run pre-commit:schema

# Type check
npm run type-check

# Full validation
npm run validate:schema && npm run type-check
```

### Files:

- **Main Schema**: `prisma/schema.prisma`
- **Production Schema**: `prisma/schema.production.prisma`
- **Validator**: `scripts/validate-schema-consistency.js`
- **Pre-commit Hook**: `scripts/pre-commit-schema-check.js`

### Success Criteria:

- ✅ Schema validation passes
- ✅ TypeScript compilation succeeds
- ✅ Build completes without errors
- ✅ Deployment succeeds

---

_Last Updated: September 14, 2025_ _Version: 1.0.0_
