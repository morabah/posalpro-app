#!/bin/bash
set -euo pipefail

# Disable ESLint for the build
export DISABLE_ESLINT_PLUGIN=true
export NEXT_DISABLE_ESLINT=1
export NEXT_DISABLE_SOURCEMAPS=1
# Increase Node memory to avoid OOM during Next.js build
export NODE_OPTIONS="--max_old_space_size=4096"

echo "[Netlify] Running strict pre-build validation checks..."
# 1) TypeScript strict check
npm run type-check

# 2) Lint check (optional). Enable with NETLIFY_LINT=true to avoid CI OOM by default
if [ "${NETLIFY_LINT:-false}" = "true" ]; then
  echo "[Netlify] Running ESLint checks (reduced scope)..."
  npx eslint \
    "src/app/**/*.{ts,tsx,js,jsx}" \
    "src/components/**/*.{ts,tsx,js,jsx}" \
    "src/hooks/**/*.{ts,tsx,js,jsx}" \
    "src/lib/**/*.{ts,tsx,js,jsx}" \
    --config eslint.config.mjs --max-warnings=0
else
  echo "[Netlify] Skipping ESLint to prevent CI OOM. Set NETLIFY_LINT=true to enable."
fi

# Ensure tests run in test environment, not production
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=test

# 3) Fast unit test suite for CI (skip if Jest not installed in prod install)
if [ -x "./node_modules/.bin/jest" ]; then
  npm run test:ci:unit
  # 4) Security-focused tests (exclude API route tests in fast CI, no coverage in gate)
  npm run test:security -- --testPathIgnorePatterns=src/test/api-routes/ --coverage=false
else
  echo "[Netlify] Jest not installed in production dependency set; skipping CI unit/security tests."
fi

# Restore production env for the actual Next.js build
export NODE_ENV=production

# Generate Prisma client (let Prisma resolve correct platform binaries)
npx prisma generate

# Build with ESLint checks disabled and increased memory
npm run build -- --no-lint

echo "Build completed successfully!"
