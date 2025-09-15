#!/bin/bash

# Netlify Build Script for PosalPro MVP2
# This script handles the complete build process with Prisma client generation
# and comprehensive verification checks

set -e  # Exit on any error

echo "🚀 Starting Netlify build process..."
echo "=================================="

# Step 1: Clean previous build artifacts
echo "🧹 Cleaning previous build artifacts..."
rm -rf .next
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Step 2: Install dependencies
echo "📦 Installing dependencies with Prisma skip..."
npm ci

# Step 3: Generate Prisma client with binary engine
echo "🔧 Generating Prisma client with binary engine..."
PRISMA_GENERATE_DATAPROXY=false \
PRISMA_CLIENT_ENGINE_TYPE=binary \
PRISMA_CLI_QUERY_ENGINE_TYPE=binary \
PRISMA_ENGINE_TYPE=binary \
npx prisma generate

# Step 4: Prisma sanity checks
echo ""
echo "=== PRISMA SANITY CHECKS ==="

echo "1. Prisma version and engine type:"
npx prisma -v

echo ""
echo "2. Checking for Node-API library engine:"
ls -la node_modules/.prisma/client | grep -E 'libquery_engine|query_engine' || echo 'No library engine found'

echo ""
echo "3. Confirming no edge client imports:"
grep -R '@prisma/client/edge' -n || echo 'No edge client imports found'

echo ""
echo "4. Environment variables check:"
env | sort | grep -i prisma || echo 'No Prisma env vars found'

echo ""
echo "=== BUILD PROCEEDING ==="

# Step 5: Build the application
echo "🏗️  Building Next.js application..."
npm run build

echo ""
echo "✅ Build completed successfully!"
echo "🎉 Ready for deployment"
