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

5. **Post-deployment**

   - Record deployment in local history
   - Create git commit with version bump
   - Create git tag (v0.1.0-alpha.2, etc.)
   - Push changes to remote repository

6. **Notification**
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
- Test each deployment thoroughly
- Document any issues in deployment history

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
git status                 # Check for changes
git log --oneline -5       # Recent commits
```

**Remember**: Each deployment increments the version automatically and creates a
permanent record in git history. Test thoroughly before deploying!
