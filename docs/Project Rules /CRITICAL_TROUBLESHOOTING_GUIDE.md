# Critical Troubleshooting Guide - Phase 1.5

## 🚨 CRITICAL: Most Common Mistakes & Immediate Solutions

### **Issue #1: "npm error ENOENT: package.json not found"**

**Symptom:**
```bash
npm error code ENOENT
npm error syscall open
npm error path /Volumes/.../MVP2/package.json
npm error errno -2
npm error enoent Could not read package.json
```

**Cause:** You're running npm commands from the wrong directory (MVP2 root instead of posalpro-app)

**IMMEDIATE SOLUTION:**
```bash
# ✅ Navigate to the correct directory
cd posalpro-app

# ✅ Verify you're in the right place
pwd  # Should show: .../MVP2/posalpro-app
ls package.json  # Should exist

# ✅ Now run your command
npm run dev:enhanced
```

**Prevention:**
```bash
# Always check your location before running npm commands
pwd && ls package.json && npm run dev:enhanced
```

---

### **Issue #2: "Command not found" or "Script missing"**

**Symptom:**
```bash
npm run dev:enhanced
npm ERR! Missing script: "dev:enhanced"
```

**Cause:** Either wrong directory or Phase 1.5 scripts not installed

**IMMEDIATE SOLUTION:**
```bash
# 1. Verify correct directory
cd posalpro-app
pwd  # Must show posalpro-app at the end

# 2. Check if scripts exist
cat package.json | grep -A 10 '"scripts"'

# 3. If scripts missing, you need to install Phase 1.5 infrastructure
# This should not happen if following the implementation correctly
```

---

### **Issue #3: Development Server Won't Start**

**Symptom:**
```bash
Error: listen EADDRINUSE :::3000
```

**Cause:** Port 3000 is already in use

**IMMEDIATE SOLUTION:**
```bash
# 1. Find what's using port 3000
lsof -ti:3000

# 2. Kill the process (if safe to do so)
kill $(lsof -ti:3000)

# 3. Or use a different port
npm run dev -- --port 3001
```

---

### **Issue #4: Quality Check Failures**

**Symptom:**
```bash
npm run quality:check
✗ TypeScript compilation failed
✗ ESLint validation failed
```

**IMMEDIATE SOLUTION:**
```bash
# 1. Auto-fix what can be fixed
npm run quality:fix

# 2. Re-run quality check
npm run quality:check

# 3. If still failing, check specific issues
npm run type-check    # For TypeScript issues
npm run lint         # For ESLint issues
```

---

### **Issue #5: Environment Variables Missing**

**Symptom:**
```bash
npm run dev:enhanced
✗ Environment validation failed
```

**IMMEDIATE SOLUTION:**
```bash
# 1. Check if .env.local exists
ls .env.local

# 2. If missing, create it
cat > .env.local << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/posalpro
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key-here
API_BASE_URL=http://localhost:3000/api
EOF

# 3. Restart development server
npm run dev:enhanced
```

---

## 🔧 Emergency Commands

### **Quick Environment Reset**
```bash
# Full reset sequence if everything is broken
cd posalpro-app
npm install
npm run quality:fix
npm run quality:check
npm run dev:enhanced
```

### **Clean Installation**
```bash
# If node_modules corrupted
cd posalpro-app
rm -rf node_modules package-lock.json
npm install
npm run dev:enhanced
```

### **Force Quality Compliance**
```bash
# Nuclear option: fix everything automatically
cd posalpro-app
npm run quality:fix
npm run format
npm run lint:fix
npm run quality:check
```

## 🚦 Status Verification Commands

### **Quick Health Check**
```bash
# Run this sequence to verify everything is working
cd posalpro-app && \
pwd && \
ls package.json && \
npm run type-check && \
echo "✅ All systems operational"
```

### **Full System Verification**
```bash
# Comprehensive check
cd posalpro-app && \
npm run quality:check && \
npm run build && \
echo "✅ Full system verification passed"
```

## 📞 When All Else Fails

### **Complete System Reset**
```bash
# 1. Stop all running processes
killall node

# 2. Navigate to correct directory
cd posalpro-app

# 3. Clean installation
rm -rf node_modules package-lock.json
npm install

# 4. Verify environment
cat .env.local  # Must exist and have required variables

# 5. Run full validation
npm run quality:check

# 6. Start development
npm run dev:enhanced
```

### **Documentation Check**
If issues persist, verify against documentation:

1. **[PROJECT_IMPLEMENTATION_RULES.md](./PROJECT_IMPLEMENTATION_RULES.md)** - Check you're following all rules
2. **[DEVELOPMENT_WORKFLOW_RULES.md](./DEVELOPMENT_WORKFLOW_RULES.md)** - Verify workflow compliance
3. **[QUICK_REFERENCE_COMMANDS.md](./QUICK_REFERENCE_COMMANDS.md)** - Confirm command usage

## 🎯 Prevention Checklist

Before running ANY command, verify:

- [ ] You're in the `posalpro-app` directory (`pwd` shows `.../posalpro-app`)
- [ ] `package.json` exists (`ls package.json`)
- [ ] `.env.local` exists with required variables
- [ ] No other processes using port 3000 (`lsof -ti:3000` returns empty)
- [ ] Recent `npm install` completed successfully

## 📋 Emergency Contact Information

**For Development Issues:**
1. Check this troubleshooting guide first
2. Run the health check sequence
3. Review recent changes in implementation log
4. Follow the complete system reset if necessary

**For Process Issues:**
1. Review PROJECT_IMPLEMENTATION_RULES.md
2. Ensure compliance with mandatory rules
3. Update documentation if rules are unclear
4. Log lessons learned for future prevention

---

**REMEMBER**: 99% of issues are caused by being in the wrong directory. Always run `cd posalpro-app` first! 