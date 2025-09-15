#!/bin/bash

# Generate Prisma client with explicit binary engine configuration
# This script ensures the Prisma client is generated with the correct engine type

echo "🔧 Generating Prisma client with binary engine..."

# Set environment variables explicitly - aligned with netlify.toml
export PRISMA_GENERATE_DATAPROXY=false
export PRISMA_CLIENT_ENGINE_TYPE=binary
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
export PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x
export PRISMA_ENGINE_TYPE=binary

# Display current environment variables
echo "Environment variables:"
echo "  PRISMA_GENERATE_DATAPROXY=$PRISMA_GENERATE_DATAPROXY"
echo "  PRISMA_CLIENT_ENGINE_TYPE=$PRISMA_CLIENT_ENGINE_TYPE"
echo "  PRISMA_CLI_QUERY_ENGINE_TYPE=$PRISMA_CLI_QUERY_ENGINE_TYPE"
echo "  PRISMA_CLI_BINARY_TARGETS=$PRISMA_CLI_BINARY_TARGETS"
echo "  PRISMA_ENGINE_TYPE=$PRISMA_ENGINE_TYPE"

# Clean any existing Prisma client
echo "🧹 Cleaning existing Prisma client..."
rm -rf node_modules/.prisma

# Generate Prisma client with production schema
echo "🚀 Generating Prisma client..."
# Force binary engine type by explicitly setting it in the command
PRISMA_GENERATE_DATAPROXY=false PRISMA_CLIENT_ENGINE_TYPE=binary PRISMA_CLI_QUERY_ENGINE_TYPE=binary npx prisma generate

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
