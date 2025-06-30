#!/bin/bash
set -e

# Disable ESLint for the build
export DISABLE_ESLINT_PLUGIN=true
export NEXT_DISABLE_ESLINT=1

# Generate Prisma client with explicit engines
PRISMA_SCHEMA_ENGINE_BINARY=./node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node \
PRISMA_QUERY_ENGINE_BINARY=./node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node \
npx prisma generate

# Build with ESLint checks disabled
npm run build -- --no-lint

echo "Build completed successfully!"
