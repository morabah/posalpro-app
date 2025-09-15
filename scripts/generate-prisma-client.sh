#!/bin/bash

# Generate Prisma client with explicit binary engine configuration
# This script ensures the Prisma client is generated with the correct engine type

echo "🔧 Generating Prisma client with library engine..."

# Set environment variables explicitly
export PRISMA_GENERATE_DATAPROXY=false
export PRISMA_CLIENT_ENGINE_TYPE=library
export PRISMA_CLI_QUERY_ENGINE_TYPE=library
export PRISMA_ENGINE_TYPE=library

# Display current environment variables
echo "Environment variables:"
echo "  PRISMA_GENERATE_DATAPROXY=$PRISMA_GENERATE_DATAPROXY"
echo "  PRISMA_CLIENT_ENGINE_TYPE=$PRISMA_CLIENT_ENGINE_TYPE"
echo "  PRISMA_CLI_QUERY_ENGINE_TYPE=$PRISMA_CLI_QUERY_ENGINE_TYPE"
echo "  PRISMA_ENGINE_TYPE=$PRISMA_ENGINE_TYPE"

# Clean any existing Prisma client
echo "🧹 Cleaning existing Prisma client..."
rm -rf node_modules/.prisma

# Generate Prisma client with production schema
echo "🚀 Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.production.prisma

# Verify the generated client
echo "✅ Verifying Prisma client generation..."
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma client generated successfully"
    echo "📁 Client location: node_modules/.prisma/client"
else
    echo "❌ Prisma client generation failed"
    exit 1
fi

echo "🎯 Prisma client generation complete!"
