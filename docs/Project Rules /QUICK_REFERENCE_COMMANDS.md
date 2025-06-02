# Quick Reference: Phase 1.5 Development Commands

## 🚨 **Essential Daily Commands**

### Start Development Session
```bash
npm run dev:enhanced     # Enhanced server with validation
```

### Before Every Commit
```bash
npm run pre-commit       # Mandatory validation
```

### Fix Issues Automatically  
```bash
npm run quality:fix      # Auto-fix linting & formatting
```

## ⚡ **Quick Validation Commands**

```bash
npm run type-check       # Fast TypeScript check (2-5s)
npm run quality:check    # Full quality validation (10-30s)
npm run lint            # ESLint validation only
npm run format:check    # Check formatting without changes
```

## 🔧 **Auto-Fix Commands**

```bash
npm run quality:fix     # Fix linting + formatting issues
npm run lint:fix        # Fix ESLint issues only
npm run format          # Format all source files
```

## 📊 **Monitoring & Debugging**

```bash
# Development Dashboard
http://localhost:3000/dev-dashboard

# Environment Test API
http://localhost:3000/test-env-api
```

## 🔄 **Common Workflows**

### Starting Work
```bash
npm run dev:enhanced
npm run quality:check
# Start coding...
```

### During Development
```bash
npm run type-check      # Every 30-60 minutes
# Continue coding...
```

### Before Commit
```bash
npm run pre-commit
# If fails:
npm run quality:fix
npm run pre-commit
git commit -m "your message"
```

### Troubleshooting
```bash
npm run dev:enhanced    # Check environment issues
npm run quality:check   # Check code quality issues
# Visit: http://localhost:3000/dev-dashboard
```

## ⚠️ **Error Resolution Priority**

1. **TypeScript Errors**: `npm run type-check`
2. **Linting Issues**: `npm run lint:fix`
3. **Formatting**: `npm run format`
4. **Environment**: `npm run dev:enhanced`

## 🎯 **Command Performance**

- **Fast (< 5s)**: `type-check`, `lint:fix`, `format`
- **Medium (5-15s)**: `dev:enhanced`, `quality:fix`
- **Slow (15-30s)**: `quality:check`, `build`

## 📝 **Remember**

- ✅ **Always**: Use `dev:enhanced` to start
- ✅ **Always**: Run `pre-commit` before commits
- ✅ **When issues found**: Use `quality:fix` first
- ✅ **Regularly**: Check development dashboard
- ❌ **Never**: Commit without passing `pre-commit` 