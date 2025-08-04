# PosalPro MVP2 Deployment Guide

## 🚀 Quick Start

The PosalPro MVP2 project now uses a comprehensive versioning and deployment
system starting with **alpha releases**. Each deployment automatically
increments the version number and tracks deployment history.

### Current Version: `0.1.0-alpha.1`

## 📋 Version Progression

### Alpha Phase (Feature Development)

```
0.1.0-alpha.1 → 0.1.0-alpha.2 → 0.1.0-alpha.3 → 0.1.0-alpha.N
```

- **Purpose**: Feature development, testing, documentation improvements
- **Frequency**: Multiple deployments per day/week
- **Audience**: Development team, internal testing

### Beta Phase (Stabilization)

```
0.1.0-beta.1 → 0.1.0-beta.2 → 0.1.0-beta.3 → 0.1.0-beta.N
```

- **Purpose**: Feature complete, bug fixes, performance optimization
- **Frequency**: Weekly deployments
- **Audience**: Beta testers, stakeholders

### Release Candidate (Pre-Production)

```
0.1.0-rc.1 → 0.1.0-rc.2 → 0.1.0-rc.3 → 0.1.0-rc.N
```

- **Purpose**: Final testing, critical bug fixes only
- **Frequency**: As needed
- **Audience**: Production-like testing environment

### Production Releases

```
0.1.0 → 0.1.1 → 0.2.0 → 1.0.0
```

- **Patch** (0.1.0 → 0.1.1): Bug fixes, security updates
- **Minor** (0.1.0 → 0.2.0): New features, enhancements
- **Major** (0.1.0 → 1.0.0): Breaking changes, major milestones

## 🚀 Deployment Commands

### Standard Deployments

```bash
# Alpha release (recommended for current phase)
npm run deploy:alpha

# Beta release
npm run deploy:beta

# Release candidate
npm run deploy:rc

# Production releases
npm run deploy:patch   # Bug fixes
npm run deploy:minor   # New features
npm run deploy:major   # Breaking changes

# Staging deployment (no version bump)
npm run deploy:staging
```

### Advanced Options

```bash
# Dry run (see what would happen)
npm run deploy:dry-run

# Skip build step (faster deployment)
./scripts/deploy.sh alpha --skip-build

# Get deployment information
npm run deployment:info
```

## 🔥 CRITICAL: Database Deployment Requirements

### Environment Understanding

**PosalPro MVP2 uses different database environments:**

- **Development**: `DATABASE_URL` (local PostgreSQL)
- **Production**: `CLOUD_DATABASE_URL` (Neon PostgreSQL cloud database)

### Mandatory Database Operations

**For ALL production deployments, you MUST:**

```bash
# 1. Set production database environment
export CLOUD_DATABASE_URL="postgresql://neondb_owner:npg_XufaK0v9TOgn@ep-ancient-sun-a9gve4ul-pooler.gwc.azure.neon.tech/neondb?sslmode=require"

# 2. Synchronize database schema
DATABASE_URL=$CLOUD_DATABASE_URL npx prisma db push

# 3. Seed production database (if needed)
CLOUD_DATABASE_URL=$CLOUD_DATABASE_URL NODE_ENV=production npx prisma db seed

# 4. Verify data exists
DATABASE_URL=$CLOUD_DATABASE_URL npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Proposal\";"

# 5. Test API endpoints with data
curl "https://posalpro-mvp2.windsurf.build/api/proposals?page=1&limit=5"
```

### Database Verification Commands

```bash
# Check database connection
DATABASE_URL=$CLOUD_DATABASE_URL npx prisma db execute --stdin <<< "SELECT current_database();"

# Verify key tables have data
DATABASE_URL=$CLOUD_DATABASE_URL npx prisma db execute --stdin <<< "SELECT
  (SELECT COUNT(*) FROM \"Proposal\") as proposals,
  (SELECT COUNT(*) FROM \"Customer\") as customers,
  (SELECT COUNT(*) FROM \"Product\") as products;"

# Test specific API endpoints
curl -s "https://posalpro-mvp2.windsurf.build/api/proposals" | jq '.data | length'
curl -s "https://posalpro-mvp2.windsurf.build/api/customers" | jq '.data | length'
```

## 📊 Deployment Process

Each deployment automatically performs these steps:

1. **Pre-flight Checks**
   - Verify project directory
   - Check git status (warn about uncommitted changes)
   - Validate environment

2. **Version Management**
   - Increment version number based on deployment type
   - Update package.json

3. **Build Process**
   - Clean previous build (.next directory)
   - Run TypeScript type checking
   - Execute production build

4. **Deployment**
   - Deploy to Netlify (production or staging)
   - Generate unique deployment URL

5. **🔥 CRITICAL: Database Operations**
   - Synchronize database schema to production
   - Seed production database with sample data (if needed)
   - Verify data exists in production database

6. **Post-deployment**
   - Record deployment in local history
   - Create git commit with version bump
   - Create git tag (v0.1.0-alpha.2, etc.)
   - Push changes to remote repository

7. **Notification**
   - Display deployment summary
   - Show live URLs
   - Provide next steps

## 📈 Deployment History Tracking

The system maintains a local deployment history file
(`.deployment-history.json`) that tracks:

- Version number
- Deployment type and environment
- Timestamp
- Git commit information
- Deployment URL

View history with:

```bash
npm run deployment:info
```

## 🌐 URLs and Environments

### Production

- **URL**: https://posalpro-mvp2.windsurf.build
- **Purpose**: Live application for users
- **Deployment**: All release types (alpha, beta, rc, production)

### Staging

- **URL**: Temporary Netlify URL (changes each deployment)
- **Purpose**: Testing before production
- **Deployment**: `npm run deploy:staging`

### Local Development

- **URL**: http://localhost:3000
- **Purpose**: Development and testing
- **Start**: `npm run dev:smart`

## 🔧 Manual Deployment Process

If you need to deploy manually without the automated system:

```bash
# Build the application
npm run build

# Deploy to production
npx netlify deploy --prod

# Deploy to staging
npx netlify deploy
```

## 📝 Best Practices

### Alpha Phase (Current)

- Deploy frequently (multiple times per day/week)
- Use `npm run deploy:alpha` for all deployments
- **CRITICAL**: Always verify database seeding after deployment
- Test each deployment thoroughly with real data verification
- Document any issues in deployment history

### Database Deployment Best Practices

- **Always check environment variables** before database operations
- **Verify schema synchronization** before seeding data
- **Test API endpoints** to ensure data is accessible
- **Document database changes** in deployment history
- **Never assume** development and production databases are in sync

### When to Move to Beta

- All major features implemented
- Basic functionality stable
- Ready for wider testing

### Version Bumping Strategy

- **Alpha**: All feature work, documentation, bug fixes
- **Beta**: Stabilization, performance improvements
- **RC**: Critical fixes only
- **Production**: Stable releases only

## 🚨 Troubleshooting

### Common Issues

1. **Uncommitted Changes Warning**

   ```
   You have uncommitted changes:
   Continue with deployment? (y/N):
   ```

   - Commit changes first, or type 'y' to continue

2. **Build Failures**
   - Check TypeScript errors: `npm run type-check`
   - Fix lint issues: `npm run lint:fix`
   - Review build logs for specific errors

3. **Deployment Failures**
   - Check Netlify CLI authentication
   - Verify build output exists (.next directory)
   - Check network connectivity

4. **Database Issues**

   ```
   Error: API returns empty data arrays
   ```

   - **Cause**: Production database not seeded
   - **Solution**: Run database seeding commands
   - **Prevention**: Always run database verification after deployment

5. **Environment Variable Issues**

   ```
   Error: Database connection failed
   ```

   - **Cause**: Wrong database URL for environment
   - **Check**: `echo $DATABASE_URL` vs `echo $CLOUD_DATABASE_URL`
   - **Solution**: Use correct environment variable for target environment

### Emergency Rollback

If a deployment fails or causes issues:

1. Check deployment history: `npm run deployment:info`
2. Identify last working version
3. Use git to revert: `git reset --hard v[VERSION]`
4. Redeploy previous version

## 📊 Current Status

- **Current Version**: 0.1.0-alpha.1
- **Next Deployment**: 0.1.0-alpha.2
- **Production URL**: https://posalpro-mvp2.windsurf.build
- **Phase**: Alpha Development

## 🎯 Next Steps

1. Continue alpha deployments for feature development
2. Monitor deployment history and performance
3. Plan transition to beta phase when features are complete
4. Establish testing procedures for each deployment type

---

## Quick Reference Card

```bash
# Most common commands
npm run deployment:info     # Check current status
npm run deploy:alpha       # Deploy alpha version
npm run deploy:dry-run     # Preview deployment

# Database verification (CRITICAL)
DATABASE_URL=$CLOUD_DATABASE_URL npx prisma db push      # Sync schema
CLOUD_DATABASE_URL=$CLOUD_DATABASE_URL NODE_ENV=production npx prisma db seed  # Seed data
curl "https://posalpro-mvp2.windsurf.build/api/proposals?page=1&limit=5"       # Test data

# Git operations
git status                 # Check for changes
git log --oneline -5       # Recent commits
```

**Remember**: Each deployment increments the version automatically and creates a
permanent record in git history. **CRITICAL**: Always verify database seeding
and test API endpoints with real data after deployment!

---

## 🚨 CRITICAL NETLIFY CONFIGURATION

### **❌ NEVER Do These:**

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

### **✅ REQUIRED netlify.toml Configuration**

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

### **✅ REQUIRED next.config.js Settings**

```javascript
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // CRITICAL: Never use 'standalone' output
  // output: 'standalone', // ❌ NEVER ENABLE THIS
};
```

**Live Application**: https://posalpro-mvp2.windsurf.build
