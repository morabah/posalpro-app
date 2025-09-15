# PosalPro MVP2 Deployment Guide

## Overview

This guide covers the deployment process for PosalPro MVP2, including automated checks to prevent common configuration issues.

## Prerequisites

- Node.js >= 20.17.0
- npm >= 10.0.0
- PostgreSQL database (local or cloud)
- Environment variables configured

## Environment Setup

### Required Environment Variables

Set the following environment variables in your deployment environment:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"  # Optional

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"
JWT_SECRET="your-jwt-secret-here"
SESSION_ENCRYPTION_KEY="your-session-key-here"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
API_BASE_URL="https://your-domain.com/api"
CORS_ORIGINS="https://your-domain.com"

# Security
CSRF_SECRET="your-csrf-secret-here"
RATE_LIMIT="100"

# Prisma Configuration (Critical for Data Proxy Prevention)
PRISMA_GENERATE_DATAPROXY="false"
PRISMA_CLIENT_ENGINE_TYPE="binary"
PRISMA_CLI_QUERY_ENGINE_TYPE="binary"
PRISMA_ENGINE_TYPE="binary"
```

## Automated Build Checks

### Issue 3 Resolution: Automated Prisma Client Verification

The deployment process now includes automated checks to prevent Data Proxy misconfigurations:

#### 1. Prisma Client Verification

**Script**: `npm run prisma:verify`

**When it runs**:
- During `npm install` (postinstall hook)
- Before every build (prebuild hook)
- Can be run manually for verification

**What it checks**:
- DATABASE_URL protocol consistency (postgresql:// vs prisma://)
- Prisma client generation mode (Data Proxy vs direct connection)
- Environment variable consistency
- Database connectivity with the generated client

**Failure behavior**:
- Exits with error code 1 for critical misconfigurations
- Prevents build from proceeding
- Provides clear error messages and fix instructions

#### 2. Environment Verification

**Script**: `npm run env:verify`

**What it checks**:
- Required environment variables presence
- DATABASE_URL protocol validation
- Prisma configuration consistency
- Security key formats

## Deployment Process

### 1. Pre-Deployment Verification

```bash
# Verify environment configuration
npm run env:verify

# Verify Prisma client configuration
npm run prisma:verify
```

### 2. Build Process

```bash
# Install dependencies (includes Prisma client generation and verification)
npm install

# Build the application (includes pre-build verification)
npm run build
```

### 3. Common Issues and Solutions

#### Data Proxy Configuration Error

**Error**: `Error validating datasource 'db': the URL must start with the protocol 'prisma://'`

**Cause**: Prisma client was generated for Data Proxy mode but DATABASE_URL uses postgresql://

**Solution**:
1. Ensure `PRISMA_GENERATE_DATAPROXY=false`
2. Set `PRISMA_CLIENT_ENGINE_TYPE=binary` or `library`
3. Regenerate Prisma client: `npx prisma generate`
4. Use `postgresql://` URL, not `prisma://`

#### Environment Variable Mismatch

**Error**: `Configuration mismatch: DATABASE_URL uses prisma:// but PRISMA_CLIENT_ENGINE_TYPE is set to 'binary'`

**Solution**: Either:
- Use `postgresql://` URL with `PRISMA_CLIENT_ENGINE_TYPE=binary`
- Or use `prisma://` URL with `PRISMA_CLIENT_ENGINE_TYPE=dataproxy`

## Platform-Specific Deployment

### Netlify

1. Set environment variables in Netlify UI
2. Ensure `PRISMA_GENERATE_DATAPROXY=false` is set
3. Deploy will automatically run verification checks
4. Build will fail if Data Proxy misconfiguration is detected

### Vercel

1. Set environment variables in Vercel dashboard
2. Ensure Prisma configuration variables are set correctly
3. Build process includes automated verification

### Docker

```dockerfile
# Ensure environment variables are set
ENV PRISMA_GENERATE_DATAPROXY=false
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Build process will run verification automatically
RUN npm install
RUN npm run build
```

## Monitoring and Debugging

### Health Check Endpoints

- `/api/health` - Basic application health
- `/api/health/database` - Database connectivity
- `/api/health/prisma-config` - Prisma configuration validation

### Logs to Monitor

- Prisma client generation logs
- Environment verification results
- Database connectivity test results

## Troubleshooting

### Build Failures

1. Check environment variables are set correctly
2. Run `npm run env:verify` to validate configuration
3. Run `npm run prisma:verify` to check Prisma client
4. Review error messages for specific fix instructions

### Runtime Errors

1. Check database connectivity
2. Verify Prisma client configuration
3. Review application logs for specific error details

## Security Considerations

- Never commit environment variables to version control
- Use strong, unique secrets for production
- Regularly rotate authentication secrets
- Monitor for unauthorized access attempts

## Performance Optimization

- Use connection pooling for database connections
- Enable Prisma query logging in development only
- Monitor database query performance
- Use appropriate Prisma engine type for your deployment environment

## Support

For deployment issues:
1. Check this guide first
2. Review error messages from verification scripts
3. Check application logs
4. Verify environment variable configuration
