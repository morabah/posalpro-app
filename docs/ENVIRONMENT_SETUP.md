# PosalPro MVP2 - Environment Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the PosalPro MVP2
authentication system environment, including database configuration, security
settings, and development tools.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- Git

## Database Setup

### 1. PostgreSQL Installation

```bash
# macOS (with Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
createdb posalpro_mvp2
```

### 2. Environment Configuration

Create a `.env` file in your project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/posalpro_mvp2?schema=public"

# JWT Security
JWT_SECRET="your-super-secure-jwt-secret-key-at-least-32-characters-long"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key-at-least-32-characters-long"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Session Security
SESSION_SECRET="your-super-secure-session-secret-key-at-least-32-characters-long"
SESSION_MAX_AGE=86400000

# Password Security
BCRYPT_ROUNDS=12

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_HYPOTHESIS_TRACKING=true

# Security
API_RATE_LIMIT_WINDOW=900000
API_RATE_LIMIT_MAX=100
PERFORMANCE_MONITORING_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=365

# Accessibility
ACCESSIBILITY_COMPLIANCE_LEVEL="AA"
ACCESSIBILITY_TESTING_ENABLED=true

# Development
PRISMA_STUDIO_PORT=5555
DEBUG_AUTH=false
DEBUG_RBAC=false
DEBUG_ANALYTICS=false
```

## Installation Steps

### 1. Clone and Install Dependencies

```bash
git clone [repository-url]
cd posalpro-mvp2
npm install
```

### 2. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed

# (Optional) Open Prisma Studio to inspect data
npm run db:studio
```

### 3. Verify Setup

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run quality checks
npm run quality:check

# Start development server
npm run dev
```

## Default System Access

After running the seed script, you can access the system with:

**Email**: `admin@posalpro.com` **Password**: `PosalPro2024!`

## Database Schema

The authentication system includes:

### Core Entities

- **Users**: User accounts with enhanced RBAC
- **Roles**: Hierarchical role system with performance expectations
- **Permissions**: Granular permissions with scope controls
- **Sessions**: Secure session management with audit trails

### Security Features

- **Audit Logs**: Comprehensive activity tracking
- **Security Events**: Real-time security monitoring
- **Context Rules**: Dynamic permission rules
- **Temporary Access**: Time-limited permission grants

### Analytics

- **Hypothesis Validation**: User story and performance tracking
- **User Analytics**: Performance metrics and trend analysis
- **System Analytics**: Platform-wide insights

### Accessibility

- **Configuration**: User-specific accessibility settings
- **Test Results**: Automated accessibility compliance tracking
- **Standards Compliance**: WCAG 2.1 AA/AAA support

## Development Workflow

### 1. Database Changes

```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Reset database (development only)
npm run db:reset

# Complete setup from scratch
npm run db:setup
```

### 2. Code Quality

```bash
# Before committing
npm run pre-commit

# Comprehensive quality check
npm run quality:check

# Type checking
npm run type-check
```

### 3. Authentication Testing

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@posalpro.com","password":"PosalPro2024!"}'

# Test protected route
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment Configuration

### Netlify Deployment (CRITICAL)

**Essential Configuration Files:**

#### netlify.toml

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

# Essential catch-all for Next.js App Router - MUST be last
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### next.config.js

```javascript
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3001',
        'localhost:3000',
        'posalpro-mvp2.windsurf.build',
      ],
    },
  },
  // CRITICAL: Never use 'standalone' output with Netlify
  // output: 'standalone', // Disabled for Netlify compatibility
  trailingSlash: false,
};
```

**CRITICAL DEPLOYMENT RULES:**

1. ❌ **NEVER** use `output: 'standalone'` with Netlify
2. ✅ **ALWAYS** ensure catch-all redirect is the LAST rule in netlify.toml
3. ✅ **VERIFY** all NextAuth pages exist before deployment
4. ✅ **TEST** API endpoints return JSON (not HTML) after deployment

### Deployment Verification

```bash
# Verify deployment configuration
npm run build
npm run start

# Test API endpoints
curl -H "Accept: application/json" http://localhost:3000/api/auth/session
curl -H "Accept: application/json" http://localhost:3000/api/health

# Pre-deployment checklist
echo "✅ netlify.toml has catch-all redirect as last rule"
echo "✅ next.config.js does not use output: 'standalone'"
echo "✅ All NextAuth pages exist"
echo "✅ API endpoints tested and return JSON"
```

## Security Considerations

### Development Environment

- Use strong, unique secrets for JWT and sessions
- Never commit sensitive credentials to version control
- Regularly rotate secrets and passwords
- Enable debug logging only in development

### Production Deployment

- Use environment-specific secrets
- Enable HTTPS and security headers
- Configure rate limiting and monitoring
- Set up automated backup procedures
- Enable audit log retention and monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   ```bash
   # Check PostgreSQL is running
   brew services list | grep postgresql

   # Verify database exists
   psql -l | grep posalpro_mvp2
   ```

2. **Migration Errors**

   ```bash
   # Reset and retry
   npm run db:reset
   npm run db:setup
   ```

3. **Type Errors**

   ```bash
   # Regenerate Prisma client
   npm run db:generate
   npm run type-check
   ```

4. **Permission Denied**
   ```bash
   # Check database user permissions
   psql posalpro_mvp2 -c "SELECT current_user, session_user;"
   ```

### Getting Help

- Check project documentation in `/docs`
- Review implementation files in `/implementation`
- Examine wireframes in `/wireframes`
- Check LESSONS_LEARNED.md for known issues

## Next Steps

After successful setup:

1. **Phase 2.1.2**: Implement authentication middleware
2. **Phase 2.1.3**: Create login/registration components
3. **Phase 2.1.4**: Build user profile management
4. **Phase 2.1.5**: Implement RBAC authorization

See `PHASE_2_STRATEGY.md` for detailed implementation roadmap.

## Monitoring and Analytics

The system includes comprehensive tracking for:

- **Hypothesis H1**: Content discovery time reduction (target: 45%)
- **Hypothesis H3**: SME contribution time reduction (target: 50%)
- **Hypothesis H4**: Cross-department coordination improvement (target: 40%)
- **Hypothesis H6**: Requirement extraction completeness (target: 30%)
- **Hypothesis H7**: Deadline management improvement (target: 40%)
- **Hypothesis H8**: Technical validation error reduction (target: 50%)

All user interactions are instrumented for hypothesis validation and performance
measurement.
