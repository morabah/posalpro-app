# Netlify Support Request: Prisma Data Proxy Configuration Issue

## Issue Summary

**Problem**: Prisma client being generated with `engine=none` (Data Proxy mode)
in Netlify build environment despite explicit configuration for direct
PostgreSQL connection.

**Error**:
`Error validating datasource db: the URL must start with the protocol prisma://`

**Impact**: Complete database connectivity failure in production deployment

**Environment**: Netlify Production Build Environment **Prisma Version**: 5.22.0
**Node.js Version**: v22.19.0

## Error Details

### Production Error Logs

```
Sep 15, 08:23:18 PM: cf96ea0e INFO   prisma:error
Invalid `prisma.user.findFirst()` invocation:

Error validating datasource `db`: the URL must start with the protocol `prisma://`
```

### Database Health Check Response

```json
{
  "db": "down",
  "error": "\nInvalid `prisma.$queryRaw()` invocation:\n\n\nError validating datasource `db`: the URL must start with the protocol `prisma://`",
  "timestamp": "2025-09-15T18:25:30.390Z"
}
```

## Environment Configuration

### Current Environment Variables (Netlify Production)

```
PRISMA_GENERATE_DATAPROXY=false
PRISMA_CLIENT_ENGINE_TYPE=binary
PRISMA_CLI_QUERY_ENGINE_TYPE=binary
PRISMA_ENGINE_TYPE=binary
PRISMA_SCHEMA=prisma/schema.production.prisma
DATABASE_URL=postgresql://[REDACTED - Neon cloud database URL]
```

### Prisma Schema Configuration

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextIndex", "fullTextSearch"]
  binaryTargets   = ["debian-openssl-3.0.x", "darwin-arm64"]
  engineType      = "binary"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
}
```

## Netlify Build Environment Investigation

### Issue: Environment Variables Not Respected

**Problem**: Despite setting explicit Prisma environment variables in Netlify
build environment, Prisma CLI ignores them and generates client with
`engine=none` (Data Proxy mode).

**Environment Variables Set**:

- `PRISMA_GENERATE_DATAPROXY=false`
- `PRISMA_CLIENT_ENGINE_TYPE=binary`
- `PRISMA_CLI_QUERY_ENGINE_TYPE=binary`
- `PRISMA_ENGINE_TYPE=binary`

**Expected Result**: `✔ Generated Prisma Client (v5.22.0, engine=binary)`
**Actual Result**: `✔ Generated Prisma Client (v5.22.0, engine=none)`

### Issue: Schema Configuration Ignored

**Problem**: Prisma schema explicitly configured with `engineType = "binary"`
but client still generated with `engine=none`.

**Schema Configuration**:

```prisma
generator client {
  provider        = "prisma-client-js"
  engineType      = "binary"
  binaryTargets   = ["debian-openssl-3.0.x", "darwin-arm64"]
}
```

**Result**: Schema configuration ignored, client still generated with
`engine=none`

### Issue: Explicit Environment Variable Export Ignored

**Problem**: Even with explicit environment variable export in build command,
Prisma CLI ignores the variables.

**Build Command**:

```bash
export PRISMA_GENERATE_DATAPROXY=false
export PRISMA_CLIENT_ENGINE_TYPE=binary
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
export PRISMA_ENGINE_TYPE=binary
npx prisma generate --schema=./prisma/schema.production.prisma
```

**Debug Output Confirms Variables Set**:

```
PRISMA_GENERATE_DATAPROXY=false
PRISMA_CLIENT_ENGINE_TYPE=binary
PRISMA_CLI_QUERY_ENGINE_TYPE=binary
PRISMA_ENGINE_TYPE=binary
```

**Result**: Environment variables correctly set but Prisma CLI still generates
`engine=none`

### Issue: Platform-Specific Behavior

**Problem**: Identical Prisma configuration produces different results in local
vs Netlify build environment.

**Local Environment (macOS ARM64)**:

```bash
npx prisma generate
# Result: ✔ Generated Prisma Client (v5.22.0, engine=binary)
```

**Netlify Build Environment (Linux x64)**:

```bash
npx prisma generate
# Result: ✔ Generated Prisma Client (v5.22.0, engine=none)
```

**Key Difference**: Same configuration, same Prisma version (5.22.0), different
platforms, different results.

## Technical Analysis for Netlify Support

### Prisma Version Information

```
prisma                  : 5.22.0
@prisma/client          : ^5.22.0
Computed binaryTarget   : darwin-arm64 (local) / debian-openssl-3.0.x (production)
Operating System        : darwin (local) / linux (production)
Architecture            : arm64 (local) / x64 (production)
Node.js                 : v22.19.0
Query Engine (Node-API) : libquery-engine (local)
```

### Key Observations

1. **Environment Variable Ignorance**: Prisma CLI is not respecting environment
   variables in Netlify build environment
2. **Schema Configuration Ignorance**: Prisma CLI is not respecting
   `engineType = "binary"` in schema
3. **Platform-Specific Behavior**: Same configuration works locally but fails in
   production
4. **Version Consistency**: Both local and production use Prisma 5.22.0

### Questions for Netlify Support

1. **Global Prisma Configuration**: Does Netlify's build environment have any
   global Prisma configuration that might override user settings?
2. **Environment Variable Handling**: Are there any known issues with Prisma
   environment variable handling in Netlify's Linux build environment?
3. **Binary Target Issues**: Could the binary target configuration be causing
   issues in the Linux build environment?
4. **Prisma CLI Behavior**: Is there any Netlify-specific behavior that might
   force Prisma into Data Proxy mode?

## Current Status

**Status**: ❌ UNRESOLVED - Seeking Netlify Support Investigation

**Issue**: Prisma client generation behavior differs between local and Netlify
build environments despite identical configuration.

**Impact**: Production deployment fails with database connectivity issues due to
incorrect Prisma client generation.

## Request for Netlify Support Investigation

### **Summary of Issue**

We are experiencing a critical issue where Prisma client generation behaves
differently in Netlify's build environment compared to local development,
despite identical configuration.

### **Key Problem**

- **Local Environment**: Prisma generates client with `engine=binary` (correct)
- **Netlify Build Environment**: Prisma generates client with `engine=none`
  (Data Proxy mode, incorrect)
- **Result**: Production deployment fails with database connectivity errors

### **Evidence**

1. **Environment Variables Set**: All required Prisma environment variables are
   correctly set in Netlify
2. **Schema Configuration**: Prisma schema explicitly configured with
   `engineType = "binary"`
3. **Build Command**: Explicit environment variable export in build command
4. **Debug Output**: Confirms environment variables are set correctly
5. **Platform Difference**: Same configuration works locally (macOS ARM64) but
   fails in Netlify (Linux x64)

### **Request for Investigation**

Could Netlify support investigate:

1. **Global Prisma Configuration**: Are there any global Prisma settings in
   Netlify's build environment that might override user configuration?
2. **Environment Variable Handling**: Are there known issues with Prisma
   environment variable handling in Netlify's Linux build environment?
3. **Binary Target Issues**: Could the binary target configuration be causing
   issues in the Linux build environment?
4. **Prisma CLI Behavior**: Is there any Netlify-specific behavior that might
   force Prisma into Data Proxy mode?

### **Reproduction Steps**

1. Set Prisma environment variables in Netlify build environment
2. Configure Prisma schema with `engineType = "binary"`
3. Run `npx prisma generate` in build command
4. Observe that client is generated with `engine=none` instead of
   `engine=binary`

## Contact Information

**Project**: PosalPro MVP2 **Environment**: Netlify Production **Prisma
Version**: 5.22.0 **Node.js Version**: v22.19.0

## Additional Context

This issue is blocking our production deployment. The application works
perfectly in local development but fails in Netlify's build environment due to
Prisma client generation differences.

We have tried multiple approaches including:

- Setting explicit environment variables
- Configuring Prisma schema with binary engine type
- Using explicit build commands with environment variable exports
- Comparing local vs production behavior

All attempts result in the same issue: Prisma generates client with
`engine=none` (Data Proxy mode) instead of `engine=binary` (direct connection
mode) in Netlify's build environment.

## Request

We would appreciate Netlify support's assistance in investigating this
platform-specific Prisma behavior issue. This appears to be related to how
Prisma CLI handles environment variables and configuration in Netlify's Linux
build environment compared to local development environments.
