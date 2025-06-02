# Development Workflow Rules - Phase 1.5 Command Usage

## Overview
This document defines the logical rules and best practices for using Phase 1.5 development commands throughout the development lifecycle. These rules ensure consistent code quality, automated validation, and streamlined development workflows.

## Command Categories

### 🚀 **Development Server Commands**
- `npm run dev` - Standard Next.js development server
- `npm run dev:enhanced` - Enhanced server with pre-flight validation

### 🔍 **Quality Validation Commands**
- `npm run quality:check` - Comprehensive code quality validation
- `npm run quality:fix` - Automated fixing of issues
- `npm run type-check` - TypeScript compilation validation
- `npm run pre-commit` - Pre-commit validation checks

### 🎨 **Code Formatting Commands**
- `npm run format` - Format all source files
- `npm run format:check` - Check formatting without changing files
- `npm run lint` - Run ESLint validation
- `npm run lint:fix` - Auto-fix ESLint issues

## Workflow Rules

### **Rule 1: Always Start with Enhanced Development Server**

**When**: Beginning any development session
**Command**: `npm run dev:enhanced`
**Why**: Validates environment, dependencies, and configuration before starting

```bash
# ✅ Correct approach
npm run dev:enhanced

# ❌ Skip only if you're certain environment is valid
npm run dev
```

**What it validates**:
- Environment variables are properly configured
- All dependencies are installed and up-to-date
- Configuration files are present and valid
- Port availability for development server
- File system permissions and structure

### **Rule 2: Run Quality Checks Before Major Changes**

**When**: Before implementing new features, refactoring, or making significant changes
**Command**: `npm run quality:check`
**Why**: Establishes a quality baseline and identifies existing issues

```bash
# ✅ Before starting work
npm run quality:check

# If issues found, fix them first
npm run quality:fix

# Then proceed with development
```

### **Rule 3: Continuous Quality Validation During Development**

**Frequency**: Every 30-60 minutes of active development
**Commands**: 
```bash
# Quick validation (fast)
npm run type-check

# Full validation (comprehensive but slower)
npm run quality:check
```

**Logic**:
- **Type-check**: Use for quick feedback during active coding
- **Quality-check**: Use after completing logical code segments

### **Rule 4: Pre-Commit Validation (Mandatory)**

**When**: Before every git commit
**Command**: `npm run pre-commit`
**Why**: Prevents low-quality code from entering the repository

```bash
# ✅ Always run before committing
npm run pre-commit

# If it fails, fix issues before committing
npm run quality:fix

# Verify fixes
npm run pre-commit
```

**What it checks**:
- TypeScript compilation errors
- ESLint rule violations
- Code formatting consistency
- Import usage and organization

### **Rule 5: Automated Issue Resolution**

**When**: Quality checks reveal fixable issues
**Command**: `npm run quality:fix`
**Why**: Automatically resolves common issues like formatting and linting

```bash
# ✅ When quality:check shows fixable issues
npm run quality:fix

# ✅ After manual code changes to ensure consistency
npm run quality:fix

# ✅ Before submitting pull requests
npm run quality:fix
```

### **Rule 6: Development Dashboard Monitoring**

**When**: Periodically during development sessions
**URL**: http://localhost:3000/dev-dashboard
**Why**: Real-time monitoring of development environment health

**Access Pattern**:
- Check at start of development session
- Monitor after major changes
- Review before ending development session
- Use for troubleshooting environment issues

## Workflow Scenarios

### **Scenario 1: Starting a New Development Session**

```bash
# 1. Navigate to project directory
cd /path/to/posalpro-app

# 2. Start enhanced development server
npm run dev:enhanced

# 3. Open development dashboard in browser
# http://localhost:3000/dev-dashboard

# 4. Verify environment health before coding
npm run quality:check
```

### **Scenario 2: Implementing a New Feature**

```bash
# 1. Establish quality baseline
npm run quality:check

# 2. Create feature branch
git checkout -b feature/new-feature

# 3. Implement feature with periodic validation
# ... code development ...
npm run type-check  # Quick validation

# 4. Final validation before commit
npm run pre-commit

# 5. If issues found, auto-fix
npm run quality:fix

# 6. Verify fixes
npm run pre-commit

# 7. Commit changes
git add .
git commit -m "feat: implement new feature"
```

### **Scenario 3: Refactoring Existing Code**

```bash
# 1. Baseline quality check
npm run quality:check

# 2. Perform refactoring
# ... refactoring work ...

# 3. Continuous validation during refactoring
npm run type-check  # After each major change

# 4. Comprehensive validation after refactoring
npm run quality:check

# 5. Auto-fix any introduced issues
npm run quality:fix

# 6. Final pre-commit validation
npm run pre-commit
```

### **Scenario 4: Code Review Preparation**

```bash
# 1. Final quality validation
npm run quality:check

# 2. Fix any remaining issues
npm run quality:fix

# 3. Verify build works
npm run build

# 4. Final pre-commit check
npm run pre-commit

# 5. Push for review
git push origin feature-branch
```

### **Scenario 5: Troubleshooting Development Issues**

```bash
# 1. Check development environment health
npm run dev:enhanced  # Will show validation issues

# 2. Check development dashboard
# http://localhost:3000/dev-dashboard

# 3. Run comprehensive quality check
npm run quality:check

# 4. Check specific TypeScript issues
npm run type-check

# 5. Verify environment configuration
# Check .env.local file and environment variables
```

## Command Priority Matrix

### **High Priority (Always Use)**
- `npm run dev:enhanced` - Every development session start
- `npm run pre-commit` - Before every commit
- `npm run quality:fix` - When issues are detected

### **Medium Priority (Regular Use)**
- `npm run quality:check` - Every major change or daily
- `npm run type-check` - During active development
- Development Dashboard - Weekly or when troubleshooting

### **Low Priority (As Needed)**
- `npm run format:check` - When format issues suspected
- `npm run lint` - For specific linting checks

## Integration with Git Workflow

### **Pre-Commit Hook Integration**
```bash
# Install husky for git hooks (if not already installed)
npm install --save-dev husky

# Create pre-commit hook
echo "npm run pre-commit" > .husky/pre-commit
```

### **Branch Protection Rules**
1. All commits must pass `npm run pre-commit`
2. Pull requests must pass `npm run quality:check`
3. Builds must complete successfully before merging

## Team Collaboration Rules

### **Shared Environment Standards**
1. All team members use `npm run dev:enhanced` for development
2. Code quality standards enforced by automated checks
3. Consistent formatting through `npm run quality:fix`
4. Shared environment configuration in `.env.example`

### **Code Review Process**
1. Reviewer runs `npm run quality:check` on PR branch
2. PR must pass all quality validations
3. No manual style discussions - automated by tools
4. Focus reviews on business logic and architecture

## Performance Considerations

### **Command Execution Times**
- `type-check`: ~2-5 seconds (use frequently)
- `quality:check`: ~10-30 seconds (use moderately)
- `dev:enhanced`: ~5-10 seconds startup (use at session start)
- `quality:fix`: ~5-15 seconds (use when needed)

### **Optimization Strategies**
- Use `type-check` for quick feedback loops
- Run `quality:check` after logical code segments, not every save
- Cache validation results when possible
- Use development dashboard for continuous monitoring

## Error Resolution Patterns

### **Common Error Types and Solutions**

#### **TypeScript Errors**
```bash
# Check specific issues
npm run type-check

# Common solutions
# - Fix type annotations
# - Update import statements
# - Check interface definitions
```

#### **ESLint Errors**
```bash
# Auto-fix common issues
npm run lint:fix

# Manual review for complex issues
npm run lint
```

#### **Formatting Issues**
```bash
# Auto-fix all formatting
npm run format

# Verify formatting
npm run format:check
```

#### **Environment Issues**
```bash
# Use enhanced server for diagnosis
npm run dev:enhanced

# Check development dashboard
# http://localhost:3000/dev-dashboard

# Verify environment variables in .env.local
```

## Success Metrics

### **Quality Indicators**
- All quality checks pass consistently
- Reduced debugging time during development
- Faster code review cycles
- Fewer production issues

### **Developer Experience Metrics**
- Reduced time to start development session
- Immediate feedback on code quality issues
- Automated resolution of common problems
- Consistent development environment across team

## Advanced Usage Patterns

### **CI/CD Integration**
```yaml
# Example GitHub Actions workflow
- name: Quality Check
  run: npm run quality:check

- name: Type Check
  run: npm run type-check

- name: Build Validation
  run: npm run build
```

### **IDE Integration**
- Configure IDE to run `npm run type-check` on save
- Set up format-on-save using project prettier config
- Integrate ESLint for real-time feedback

### **Custom Validation Scripts**
```json
{
  "scripts": {
    "validate:full": "npm run type-check && npm run quality:check && npm run build",
    "validate:quick": "npm run type-check && npm run lint",
    "dev:clean": "npm run quality:fix && npm run dev:enhanced"
  }
}
```

## Best Practices Summary

1. **Start Clean**: Always use `npm run dev:enhanced` to start development
2. **Validate Early**: Run quality checks before major changes
3. **Fix Immediately**: Address quality issues as they arise
4. **Automate**: Use `npm run quality:fix` for automatic issue resolution
5. **Monitor Continuously**: Check development dashboard regularly
6. **Commit Clean**: Always pass `npm run pre-commit` before committing
7. **Team Consistency**: Ensure all team members follow these rules
8. **Performance Balance**: Use quick checks frequently, comprehensive checks strategically

This workflow ensures high code quality, reduces debugging time, and maintains a consistent development environment across the entire team. 