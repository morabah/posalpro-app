# PosalPro MVP2 - Comprehensive Project Rules

## 📋 Project Context
- **Technology Stack**: Next.js 15, TypeScript, Tailwind CSS, ESLint
- **Project Structure**: App Router with src/ directory organization
- **Documentation Hub**: PROJECT_REFERENCE.md (central navigation)
- **Phase Status**: Phase 1 Complete (5/5 prompts) - Ready for Phase 2

## 🚨 CRITICAL RULES (NON-NEGOTIABLE)

### **Rule CR-1: Directory Navigation (MANDATORY)**
**ALL npm commands MUST be executed from `posalpro-app/` directory, NOT project root**

```bash
# ✅ CORRECT - Always navigate to posalpro-app first
cd /path/to/PosalPro/MVP2/posalpro-app
npm run dev:enhanced

# ❌ FATAL ERROR - Running from project root will fail
cd /path/to/PosalPro/MVP2
npm run dev:enhanced  # ERROR: package.json not found
```

### **Rule CR-2: Enhanced Commands Only**
**NEVER use standard commands - use Phase 1.5 enhanced versions**

```bash
# ✅ MANDATORY
npm run dev:enhanced     # NOT npm run dev
npm run quality:check    # NOT npm run lint
npm run quality:fix      # For automatic issue resolution
npm run pre-commit       # MANDATORY before every commit

# ❌ FORBIDDEN
npm run dev             # Skips validation
git commit              # Without pre-commit validation
```

### **Rule CR-3: Safety Script Usage**
**Use safety script to prevent 99% of common mistakes**

```bash
# ✅ RECOMMENDED - Validates environment before execution
./check-and-run.sh dev:enhanced
./check-and-run.sh quality:check
./check-and-run.sh pre-commit
```

### **Rule CR-4: Quality Gates (MANDATORY)**
**No code advances without passing all quality gates**

1. **Development Gate**: `npm run type-check` passes
2. **Feature Gate**: `npm run quality:check` passes
3. **Commit Gate**: `npm run pre-commit` passes
4. **Release Gate**: `npm run build` passes

## 📁 Project Structure (ENFORCED)

```
MVP2/                           # Project root - documentation only
├── docs/                      # Project documentation
│   ├── PROJECT_IMPLEMENTATION_RULES.md    # ⭐ Mandatory rules
│   ├── CRITICAL_TROUBLESHOOTING_GUIDE.md  # ⭐ Emergency procedures
│   ├── DEVELOPMENT_WORKFLOW_RULES.md      # ⭐ Workflow guidance
│   ├── QUICK_REFERENCE_COMMANDS.md        # ⭐ Command cheat sheet
│   └── WORKFLOW_EXAMPLE_WALKTHROUGH.md    # ⭐ Practical examples
├── posalpro-app/             # ⭐ ALL npm commands executed here
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utility functions and infrastructure
│   │   ├── types/            # TypeScript type definitions
│   │   └── styles/           # Global styles and design tokens
│   ├── scripts/              # ⭐ Phase 1.5 automation scripts
│   ├── check-and-run.sh      # ⭐ Safety validation script
│   ├── package.json          # Dependencies and scripts
│   └── ...config files
├── platform/                # Platform engineering configs
├── PROJECT_REFERENCE.md      # Central navigation hub
├── IMPLEMENTATION_LOG.md     # Development tracking
└── LESSONS_LEARNED.md       # Knowledge capture
```

## 🔄 Development Workflow (MANDATORY)

### **Daily Startup Sequence**
```bash
# 1. Navigate to correct directory (CRITICAL)
cd posalpro-app

# 2. Verify location and start enhanced server
pwd  # Must show: .../MVP2/posalpro-app
npm run dev:enhanced  # OR: ./check-and-run.sh dev:enhanced

# 3. Establish quality baseline
npm run quality:check

# 4. Open monitoring dashboard
# Browser: http://localhost:3000/dev-dashboard
```

### **Development Session Commands**
```bash
# During development (every 30-60 minutes)
npm run type-check               # Quick validation (2-5s)

# After completing features
npm run quality:check            # Full validation (10-30s)

# When issues found
npm run quality:fix              # Auto-fix issues (5-15s)
```

### **Pre-Commit Sequence (MANDATORY)**
```bash
# NEVER commit without this sequence
npm run quality:check            # Identify all issues
npm run quality:fix              # Fix what can be automated
npm run pre-commit               # Final validation gate

# Only if pre-commit passes:
git add .
git commit -m "meaningful message"
```

## 🛠️ Phase 1.5 Infrastructure

### **Enhanced Development Scripts**
```json
{
  "scripts": {
    "dev:enhanced": "node scripts/dev/start.js",
    "quality:check": "node scripts/quality/check.js", 
    "quality:fix": "npm run format && npm run lint:fix",
    "pre-commit": "npm run type-check && npm run quality:check",
    "type-check": "tsc --noEmit"
  }
}
```

### **Development Dashboard**
- **URL**: http://localhost:3000/dev-dashboard
- **Features**: Real-time environment health, quality metrics, performance tracking
- **Usage**: Monitor during development, check after major changes

### **Safety Script Features**
- **Location**: `posalpro-app/check-and-run.sh`
- **Validates**: Directory, package.json, scripts, dependencies, ports, environment
- **Auto-fixes**: Missing node_modules, .env.local, environment setup

## 📊 Code Quality Standards (SENIOR-LEVEL)

### **TypeScript Requirements**
- Strict mode enabled (no `any` types)
- Comprehensive input validation at all boundaries
- Proper error handling with client/server distinction
- Clear variable/function names following Next.js conventions

### **Code Organization**
- Modular code adhering to Single Responsibility Principle
- Efficient algorithms and performance optimization
- Secure coding practices and data sanitization
- No direct DOM manipulation - use React patterns
- No inline styles - use Tailwind CSS classes

### **Performance Standards**
- Build time: < 30 seconds
- Quality check: < 20 seconds
- Type check: < 5 seconds
- Memory usage: < 500MB during development

## 🚨 Emergency Procedures

### **Issue #1: "package.json not found"**
```bash
# IMMEDIATE SOLUTION:
cd posalpro-app
pwd  # Verify location
ls package.json  # Must exist
npm run dev:enhanced
```

### **Issue #2: Quality Check Failures**
```bash
# AUTO-FIX SEQUENCE:
npm run quality:fix
npm run quality:check
# If still failing: check specific issues with npm run type-check
```

### **Issue #3: Complete System Reset**
```bash
cd posalpro-app
rm -rf node_modules package-lock.json
npm install
npm run quality:fix
npm run quality:check
npm run dev:enhanced
```

### **Quick Health Check**
```bash
cd posalpro-app && pwd && ls package.json && npm run type-check
```

## 📚 Documentation Integration

### **Central Navigation Hub**
- **PROJECT_REFERENCE.md**: Central documentation hub with all links
- **Auto-update required**: For major architectural changes
- **Cross-references**: Maintain links between related components

### **Implementation Tracking**
- **IMPLEMENTATION_LOG.md**: Log all prompt executions
- **LESSONS_LEARNED.md**: Capture insights for complex implementations
- **Quality metrics**: Track improvement over time

### **Validation Requirements**
```javascript
// Execute for each checkpoint
logValidation(phase, status, details, lessons?, patterns?)
```

## 🔒 Security & Environment

### **Environment Configuration**
- Multi-environment support (local, development, staging, production)
- Environment-aware API client implementation
- Proper environment variable validation
- Configuration utility for type-safe access

### **Security Implementation**
- Input validation at all boundaries
- Proper authentication and authorization patterns
- Secure API communication
- Data sanitization and XSS prevention
- Security headers and CORS configuration

## 🚫 Forbidden Practices

### **NEVER DO THESE:**
```bash
# ❌ Wrong directory
cd MVP2 && npm run anything

# ❌ Skip quality gates
git commit -m "message"  # Without pre-commit

# ❌ Use deprecated commands
npm run dev  # Use dev:enhanced
console.log()  # Use proper logging
```

### **❌ Code Violations**
- Direct DOM manipulation
- Inline styles
- Hardcoded API URLs
- Skipping TypeScript strict mode
- Modifications without documentation updates

## 🎯 AI Development Context

### **Prompt Patterns**
- Reference PROMPT_PATTERNS.md for standardized interactions
- Use established prompt patterns for consistency
- Maintain context management throughout sessions
- Apply validation criteria for quality assurance

### **Implementation Constraints**
- Execute ONLY tasks specified in current prompt
- NO additional features, logic, files, or suggestions beyond request
- Adhere strictly to specified paths, names, and versions
- Follow the 11-phase implementation structure

## 📈 Platform Engineering Integration

### **Golden Path Templates**
- Follow golden path templates from platform/ directory
- Reference platform engineering foundation patterns
- Integrate with developer experience metrics tracking
- Maintain compatibility with Internal Developer Platform (IDP)

### **Technology Guidelines**
- Use Next.js 15 App Router patterns exclusively
- Implement TypeScript strict mode with proper type safety
- Follow Tailwind CSS utility-first approach
- Use ESLint configuration without deviation
- Maintain path aliases (@/* for src/*)

## 🔗 Quick Access Links

### **Critical Documentation**
- **[PROJECT_IMPLEMENTATION_RULES.md](./PROJECT_IMPLEMENTATION_RULES.md)** - Complete mandatory rules
- **[CRITICAL_TROUBLESHOOTING_GUIDE.md](./CRITICAL_TROUBLESHOOTING_GUIDE.md)** - Emergency solutions
- **[DEVELOPMENT_WORKFLOW_RULES.md](./DEVELOPMENT_WORKFLOW_RULES.md)** - Workflow guidance
- **[QUICK_REFERENCE_COMMANDS.md](./QUICK_REFERENCE_COMMANDS.md)** - Command cheat sheet

### **Essential Commands**
```bash
# From posalpro-app directory:
npm run dev:enhanced     # Start development (MANDATORY)
npm run quality:check    # Validate code quality
npm run quality:fix      # Fix issues automatically
npm run pre-commit       # Pre-commit validation (MANDATORY)
./check-and-run.sh [cmd] # Safety script validation
```

### **Essential URLs**
```
http://localhost:3000                    # Application
http://localhost:3000/dev-dashboard     # Development monitoring
http://localhost:3000/test-env-api      # Environment testing
```

---

## ⚠️ CRITICAL REMINDERS

1. **99% of issues are caused by being in the wrong directory** - Always `cd posalpro-app` first
2. **Never skip pre-commit validation** - It prevents quality issues from entering the repository
3. **Use safety script when uncertain** - `./check-and-run.sh [command]`
4. **Monitor development dashboard regularly** - Address red indicators immediately
5. **Update documentation for all changes** - Maintain knowledge capture system

**These rules are NON-NEGOTIABLE and must be followed by all team members and AI assistants.** 