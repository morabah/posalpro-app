#!/bin/bash
set -e

# Disable ESLint for the build
export DISABLE_ESLINT_PLUGIN=true
export NEXT_DISABLE_ESLINT=1
export NEXT_DISABLE_SOURCEMAPS=1
# Increase Node memory to avoid OOM during Next.js build
export NODE_OPTIONS="--max_old_space_size=4096"

# Generate Prisma client with explicit engines
PRISMA_SCHEMA_ENGINE_BINARY=./node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node \
PRISMA_QUERY_ENGINE_BINARY=./node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node \
npx prisma generate

# Build with ESLint checks disabled and increased memory
npm run build -- --no-lint

echo "Build completed successfully!"
