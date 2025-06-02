# Project Implementation Rules - Phase 1.5

## 🎯 Overview
These rules define the mandatory practices and constraints for working with the PosalPro MVP2 project, ensuring consistency, quality, and preventing common implementation mistakes.

## 📁 Directory Structure Rules

### **Rule DS-1: Always Work from Correct Directory**
**MANDATORY**: All npm commands must be executed from the `posalpro-app/` directory, NOT the project root.

```bash
# ✅ CORRECT - Always navigate to posalpro-app first
cd /path/to/PosalPro/MVP2/posalpro-app
npm run dev:enhanced

# ❌ WRONG - Running from project root will fail
cd /path/to/PosalPro/MVP2
npm run dev:enhanced  # ERROR: package.json not found
```

### **Rule DS-2: Directory Navigation Verification**
Before running any npm command, verify you're in the correct directory:

```bash
# Verify you're in posalpro-app directory
pwd  # Should show: .../MVP2/posalpro-app
ls package.json  # Should exist and be readable

# If in wrong directory, navigate correctly
cd posalpro-app  # From MVP2 root
# OR
cd ../posalpro-app  # From docs or other subdirectory
```

### **Rule DS-3: Project Structure Integrity**
Never modify the established directory structure without updating documentation:

```
MVP2/                           # Project root - documentation only
├── docs/                      # Project documentation
├── posalpro-app/             # Application code - ALL npm commands here
│   ├── src/                  # Source code
│   ├── package.json          # Dependencies and scripts
│   └── scripts/              # Phase 1.5 automation scripts
└── platform/                # Platform engineering configs
```

## 🚀 Command Execution Rules

### **Rule CE-1: Command Execution Order**
Always follow this sequence when starting development:

```bash
# 1. Navigate to correct directory
cd posalpro-app

# 2. Start enhanced development server
npm run dev:enhanced

# 3. Verify quality baseline  
npm run quality:check

# 4. Open development dashboard
# Browser: http://localhost:3000/dev-dashboard
```

### **Rule CE-2: Prohibited Command Patterns**
These command patterns are **FORBIDDEN**:

```bash
# ❌ NEVER run npm commands from project root
cd MVP2
npm run anything  # Will always fail

# ❌ NEVER skip pre-commit validation
git commit -m "message"  # Without npm run pre-commit first

# ❌ NEVER use standard dev command
npm run dev  # Use npm run dev:enhanced instead

# ❌ NEVER commit code quality issues
git add . && git commit  # Without quality checks first
```

### **Rule CE-3: Mandatory Command Sequences**
These sequences are **REQUIRED** before specific actions:

**Before Any Commit:**
```bash
npm run pre-commit      # MANDATORY
# Only if successful:
git add .
git commit -m "message"
```

**Before Any Development Session:**
```bash
npm run dev:enhanced    # MANDATORY
npm run quality:check   # MANDATORY
```

**When Issues Are Found:**
```bash
npm run quality:fix     # MANDATORY first step
npm run quality:check   # MANDATORY verification
```

## 📝 File Organization Rules

### **Rule FO-1: Source Code Organization**
All application code must follow this structure:

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components  
├── lib/                   # Utility functions and infrastructure
├── types/                 # TypeScript type definitions
└── styles/               # Global styles and design tokens
```

### **Rule FO-2: Configuration File Placement**
Configuration files must remain in designated locations:

```
posalpro-app/
├── package.json           # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint rules
├── prettier.config.js    # Code formatting rules
├── postcss.config.mjs    # PostCSS configuration
├── next.config.ts        # Next.js configuration
└── .env.local           # Environment variables
```

### **Rule FO-3: Documentation Placement**
Documentation must be organized in the project root:

```
MVP2/
├── docs/                 # All project documentation
│   ├── DEVELOPMENT_WORKFLOW_RULES.md
│   ├── QUICK_REFERENCE_COMMANDS.md
│   └── PROJECT_IMPLEMENTATION_RULES.md
├── PROJECT_REFERENCE.md  # Central navigation hub
├── IMPLEMENTATION_LOG.md # Development tracking
└── LESSONS_LEARNED.md   # Knowledge capture
```

## 🔍 Development Process Rules

### **Rule DP-1: Quality Gates**
No code may proceed to the next stage without passing quality gates:

**Gate 1: Development**
- `npm run type-check` passes
- Code compiles without errors
- Basic functionality verified

**Gate 2: Feature Completion**
- `npm run quality:check` passes
- All tests pass
- Code formatting consistent

**Gate 3: Commit**
- `npm run pre-commit` passes
- All quality issues resolved
- Meaningful commit message

**Gate 4: Pull Request**
- `npm run build` passes
- Development dashboard shows all green
- Code review completed

### **Rule DP-2: Issue Resolution Priority**
When issues are found, resolve them in this order:

1. **TypeScript Errors** - `npm run type-check`
2. **ESLint Issues** - `npm run lint:fix`
3. **Formatting Issues** - `npm run format`
4. **Environment Issues** - `npm run dev:enhanced`
5. **Build Issues** - `npm run build`

### **Rule DP-3: Development Workflow Mandatory Steps**

**Daily Startup Sequence:**
```bash
cd posalpro-app                    # Navigate correctly
npm run dev:enhanced               # Start with validation
# Open: http://localhost:3000/dev-dashboard
npm run quality:check              # Baseline check
```

**Hourly During Development:**
```bash
npm run type-check                 # Quick validation
```

**Before Any Commit:**
```bash
npm run quality:check              # Full validation
npm run quality:fix                # Fix issues
npm run pre-commit                 # Final gate
```

## 📊 Quality Assurance Rules

### **Rule QA-1: Code Quality Standards**
All code must meet these standards:

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Zero errors, warnings addressed
- **Prettier**: Consistent formatting applied
- **Imports**: Organized and analyzed
- **Performance**: Build time monitored

### **Rule QA-2: Testing Requirements**
- All new features must include tests
- Test coverage maintained or improved
- Quality metrics tracked in development dashboard
- Performance regressions identified and addressed

### **Rule QA-3: Code Review Standards**
- All PRs must pass `npm run quality:check`
- Development dashboard must show all green indicators
- No manual style discussions (automated by tools)
- Focus reviews on business logic and architecture

## 🚨 Error Prevention Rules

### **Rule EP-1: Common Mistake Prevention**

**Directory Navigation Mistakes:**
```bash
# ✅ ALWAYS verify location before commands
pwd
ls package.json  # Must exist

# ✅ ALWAYS use full path navigation when uncertain
cd /full/path/to/posalpro-app
```

**Command Execution Mistakes:**
```bash
# ✅ ALWAYS use enhanced commands
npm run dev:enhanced     # NOT npm run dev
npm run quality:check    # NOT npm run lint
npm run pre-commit       # NOT git commit directly
```

**Quality Skip Mistakes:**
```bash
# ✅ NEVER skip quality gates
npm run pre-commit       # MANDATORY before commit
npm run quality:fix      # MANDATORY when issues found
npm run dev:enhanced     # MANDATORY to start development
```

### **Rule EP-2: Automated Prevention**
Set up these safeguards to prevent mistakes:

**Git Hooks:**
```bash
# Install husky if not present
npm install --save-dev husky

# Create pre-commit hook
echo "npm run pre-commit" > .husky/pre-commit
```

**Shell Aliases (Optional but Recommended):**
```bash
# Add to your shell profile (.bashrc, .zshrc)
alias ppdev='cd posalpro-app && npm run dev:enhanced'
alias ppcheck='cd posalpro-app && npm run quality:check'
alias ppfix='cd posalpro-app && npm run quality:fix'
alias ppcommit='cd posalpro-app && npm run pre-commit'
```

## 📈 Monitoring and Compliance Rules

### **Rule MC-1: Development Dashboard Monitoring**
**MANDATORY**: Check development dashboard regularly:

- **URL**: http://localhost:3000/dev-dashboard
- **Frequency**: Start of session, after major changes, before ending session
- **Action**: Address any red indicators immediately
- **Documentation**: Log issues found in development notes

### **Rule MC-2: Performance Monitoring**
Track and maintain performance standards:

- **Build Time**: < 30 seconds acceptable
- **Quality Check**: < 20 seconds acceptable  
- **Type Check**: < 5 seconds acceptable
- **Memory Usage**: < 500MB during development

### **Rule MC-3: Compliance Tracking**
Document compliance with these rules:

- **Implementation Log**: Update after major changes
- **Lessons Learned**: Capture rule violations and solutions
- **Quality Metrics**: Track improvement over time
- **Team Compliance**: Ensure all team members follow rules

## 🔧 Environment Management Rules

### **Rule EM-1: Environment Variable Management**
```bash
# ✅ REQUIRED: Always have .env.local configured
cat .env.local  # Must contain required variables

# ✅ REQUIRED: Environment validation passes
npm run dev:enhanced  # Will validate environment
```

### **Rule EM-2: Dependency Management**
```bash
# ✅ REQUIRED: Keep dependencies up to date
npm audit  # Address security vulnerabilities
npm outdated  # Review outdated packages

# ✅ REQUIRED: Install dependencies properly
npm install  # NOT yarn or other package managers
```

### **Rule EM-3: Configuration Validation**
```bash
# ✅ REQUIRED: All config files must be present and valid
ls tsconfig.json eslint.config.mjs prettier.config.js postcss.config.mjs next.config.ts
# All must exist and be readable
```

## 🎯 Implementation Enforcement

### **Rule IE-1: Mandatory Compliance**
These rules are **NON-NEGOTIABLE**:

1. **All npm commands from posalpro-app directory**
2. **npm run pre-commit before every commit**
3. **npm run dev:enhanced to start development**
4. **npm run quality:fix when issues found**
5. **Development dashboard monitoring**

### **Rule IE-2: Violation Consequences**
Rule violations will result in:

1. **Immediate correction required**
2. **Additional training on proper procedures**
3. **Increased monitoring of compliance**
4. **Documentation update if rules unclear**

### **Rule IE-3: Rule Updates**
These rules may be updated based on:

- **Lessons learned from violations**
- **Process improvements discovered**
- **Tool updates or changes**
- **Team feedback and suggestions**

## 📚 Quick Reference

### **Essential Commands (From posalpro-app directory)**
```bash
npm run dev:enhanced     # Start development (MANDATORY)
npm run quality:check    # Validate code quality
npm run quality:fix      # Fix issues automatically
npm run pre-commit       # Pre-commit validation (MANDATORY)
npm run type-check       # Quick TypeScript check
```

### **Essential URLs**
```
http://localhost:3000                    # Application
http://localhost:3000/dev-dashboard     # Development monitoring
http://localhost:3000/test-env-api      # Environment testing
```

### **Essential Directories**
```bash
cd posalpro-app          # Application development
cd docs                  # Documentation updates
cd platform              # Platform configuration
```

## 🔗 Related Documentation

- **[DEVELOPMENT_WORKFLOW_RULES.md](./DEVELOPMENT_WORKFLOW_RULES.md)** - Complete workflow guide
- **[QUICK_REFERENCE_COMMANDS.md](./QUICK_REFERENCE_COMMANDS.md)** - Command cheat sheet
- **[WORKFLOW_EXAMPLE_WALKTHROUGH.md](./WORKFLOW_EXAMPLE_WALKTHROUGH.md)** - Practical examples
- **[PROJECT_REFERENCE.md](../PROJECT_REFERENCE.md)** - Central navigation hub

---

**REMEMBER**: These rules exist to prevent mistakes, ensure quality, and maintain consistency. When in doubt, follow the rules exactly as written. If rules seem unclear or inadequate, update the documentation immediately. 