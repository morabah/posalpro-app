# Netlify Deployment Guide - PosalPro MVP2

## 🎯 Overview

This guide provides a complete reference for deploying PosalPro MVP2 to Netlify,
based on lessons learned from critical deployment issues. Follow this guide
exactly to avoid the deployment failures we experienced.

**Live Application**: https://posalpro-mvp2.windsurf.build **Last Updated**:
2025-01-08 **Deployment Status**: ✅ Operational

---

## 🚨 CRITICAL FAILURES TO AVOID

### ❌ **NEVER Do These:**

1. **Never use `output: 'standalone'` in next.config.js**

   - Breaks Netlify's serverless function architecture
   - Causes API routes to return HTML instead of JSON
   - Results in authentication failures

2. **Never deploy without catch-all redirect**

   - Missing `/* -> /index.html` redirect breaks App Router
   - Causes 404 errors on all non-root routes
   - Must be the LAST redirect rule in netlify.toml

3. **Never reference non-existent pages in NextAuth config**

   - Missing `/auth/error` page causes authentication failures
   - Always implement all pages before deployment

4. **Never deploy without testing API endpoints**
   - API routes must return JSON, not HTML
   - Test with `curl -H "Accept: application/json"` before deployment

---

## ✅ REQUIRED CONFIGURATION

### 1. Essential netlify.toml

```toml
[build]
  command = "npx prisma migrate deploy && npx prisma generate && npm run build"

[build.environment]
  NODE_VERSION = "20.15.1"
  NEXT_USE_NETLIFY_EDGE = "true"

[[plugins]]
  package = "@netlify/plugin-nextjs"

# Set proper content type for API responses
[[headers]]
  for = "/api/*"
  [headers.values]
    Content-Type = "application/json; charset=utf-8"
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Origin, X-Requested-With, Content-Type, Accept, Authorization"

# Optimize static files
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Functions are managed by @netlify/plugin-nextjs
[functions]
  included_files = ["schema.prisma"]

# Development server
[dev]
  command = "npm run dev:smart"

# Image optimization
[[redirects]]
  from = "/_next/image"
  to = "/.netlify/images"
  status = 200

# Essential catch-all for Next.js App Router - MUST be last
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Critical next.config.js Settings

```javascript
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3001',
        'localhost:3000',
        'posalpro-mvp2.windsurf.build',
      ],
    },
    optimizePackageImports: [
      'react',
      'react-dom',
      '@headlessui/react',
      '@heroicons/react',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // CRITICAL: Never use 'standalone' output with Netlify
  // output: 'standalone', // Disabled for Netlify compatibility
  trailingSlash: false,
};
```

### 3. Required Environment Variables

Create these in Netlify dashboard under Site settings > Environment variables:

```env
# Database
DATABASE_URL=your-production-database-url

# NextAuth
NEXTAUTH_URL=https://posalpro-mvp2.windsurf.build
NEXTAUTH_SECRET=your-production-nextauth-secret

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://posalpro-mvp2.windsurf.build
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before every deployment, verify these items:

### Configuration Files

- [ ] `netlify.toml` exists with catch-all redirect as LAST rule
- [ ] `next.config.js` does NOT have `output: 'standalone'`
- [ ] All environment variables set in Netlify dashboard

### Required Pages

- [ ] `/auth/error` page exists and handles all NextAuth error types
- [ ] `/contact` page exists for user support
- [ ] All pages referenced in NextAuth config exist

### Build Verification

- [ ] `npm run build` completes successfully locally
- [ ] No TypeScript errors in production build
- [ ] No critical ESLint errors

### API Testing

- [ ] `npm run dev` works locally with authentication
- [ ] All API routes return JSON (test with curl)
- [ ] Authentication flow works end-to-end locally

---

## 🚀 DEPLOYMENT PROCESS

### Step 1: Pre-deployment Testing

```bash
# Verify configuration
cd posalpro-app

# Check netlify.toml catch-all redirect
tail -5 netlify.toml | grep -A 5 "from.*/*"

# Check next.config.js for standalone output
grep -n "output.*standalone" next.config.js
# Should return nothing or commented line

# Build and test locally
npm run build
npm run start

# Test API endpoints locally
curl -H "Accept: application/json" http://localhost:3000/api/auth/session
curl -H "Accept: application/json" http://localhost:3000/api/health
```

### Step 2: Deploy to Netlify

```bash
# Option 1: Git-based deployment (recommended)
git add .
git commit -m "Deploy: [description of changes]"
git push origin main

# Option 2: Manual deployment
npm install -g netlify-cli
netlify deploy --prod
```

### Step 3: Post-deployment Verification

```bash
# Test live API endpoints
curl -H "Accept: application/json" https://posalpro-mvp2.windsurf.build/api/auth/session
curl -H "Accept: application/json" https://posalpro-mvp2.windsurf.build/api/health

# Test authentication flow
# 1. Visit https://posalpro-mvp2.windsurf.build/auth/login
# 2. Login with admin@posalpro.com / PosalPro2024!
# 3. Verify redirect to dashboard
# 4. Check browser network tab for JSON API responses
```

---

## 🔧 TROUBLESHOOTING

### Issue: 404 on Login Page

**Symptom**: `/auth/login` returns "Page not found"

**Solution**:

```bash
# Add catch-all redirect to netlify.toml
echo '
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200' >> netlify.toml

git add netlify.toml
git commit -m "Fix: Add catch-all redirect for App Router"
git push
```

### Issue: API Routes Return HTML

**Symptom**: API endpoints return Netlify 404 HTML instead of JSON

**Solution**:

```bash
# Remove standalone output from next.config.js
sed -i 's/output: .standalone./\/\/ output: .standalone., \/\/ Disabled for Netlify compatibility/' next.config.js

git add next.config.js
git commit -m "Fix: Remove standalone output for Netlify compatibility"
git push
```

### Issue: NextAuth Errors

**Symptom**: Authentication redirects to error pages that don't exist

**Solution**:

1. Create `/auth/error` page handling all NextAuth error types
2. Create `/contact` page for user support
3. Ensure all pages use proper Next.js 15 App Router structure

### Issue: Build Failures

**Symptom**: Netlify build fails with Prisma or dependency errors

**Solution**:

```bash
# Update build command in netlify.toml
[build]
  command = "npx prisma migrate deploy && npx prisma generate && npm run build"
```

---

## 📊 MONITORING & MAINTENANCE

### Health Checks

```bash
# Daily health check script
curl -f https://posalpro-mvp2.windsurf.build/api/health || echo "❌ Health check failed"
curl -f https://posalpro-mvp2.windsurf.build/auth/login || echo "❌ Login page failed"
```

### Performance Monitoring

- Monitor Netlify function logs for errors
- Check Core Web Vitals in Netlify Analytics
- Monitor authentication success rates

### Regular Maintenance

- Update dependencies monthly
- Review Netlify function usage and costs
- Update environment variables as needed
- Test backup deployment procedures quarterly

---

## 🎓 LESSONS LEARNED

### Key Insights

1. **Netlify is NOT Docker**: Never use container-specific settings like
   `output: 'standalone'`
2. **App Router Requires Catch-All**: Next.js App Router needs
   `/* -> /index.html` redirect
3. **Complete Implementation Required**: All referenced pages must exist before
   deployment
4. **Test in Production Environment**: Development behavior ≠ production
   behavior
5. **API Route Architecture Matters**: Maintain clean separation between custom
   and NextAuth routes

### Time Saved

Following this guide prevents:

- ~8-12 hours of deployment troubleshooting
- Authentication flow debugging sessions
- Emergency hotfixes during business hours
- User support tickets from broken authentication

### Related Documentation

- [LESSONS_LEARNED.md](./LESSONS_LEARNED.md#lesson-12) - Complete deployment
  lessons
- [CRITICAL_TROUBLESHOOTING_GUIDE.md](./Project%20Rules%20/CRITICAL_TROUBLESHOOTING_GUIDE.md) -
  Emergency fixes
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - Development environment setup

---

**Remember**: This guide exists because we experienced every one of these
failures. Follow it exactly to avoid the same pain.
