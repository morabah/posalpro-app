#!/bin/bash

# Regenerate Prisma Client in Binary Mode
# This script ensures the Prisma client is generated with binary engine type

echo "🔧 Regenerating Prisma Client in Binary Mode"
echo "============================================="

# Load environment variables
if [ -f .env ]; then
    echo "📁 Loading environment variables from .env"
    export $(grep -v '^#' .env | xargs)
fi

# Set environment variables explicitly
export PRISMA_GENERATE_DATAPROXY=false
export PRISMA_CLIENT_ENGINE_TYPE=binary
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
export PRISMA_ENGINE_TYPE=binary
export PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

echo "📋 Environment Variables:"
echo "  PRISMA_GENERATE_DATAPROXY=$PRISMA_GENERATE_DATAPROXY"
echo "  PRISMA_CLIENT_ENGINE_TYPE=$PRISMA_CLIENT_ENGINE_TYPE"
echo "  PRISMA_CLI_QUERY_ENGINE_TYPE=$PRISMA_CLI_QUERY_ENGINE_TYPE"
echo "  PRISMA_ENGINE_TYPE=$PRISMA_ENGINE_TYPE"
echo "  PRISMA_CLI_BINARY_TARGETS=$PRISMA_CLI_BINARY_TARGETS"

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "🗄️  DATABASE_URL: ${DATABASE_URL:0:20}... (${#DATABASE_URL} characters)"

# Validate DATABASE_URL scheme
if [[ $DATABASE_URL == postgresql://* ]]; then
    echo "✅ DATABASE_URL uses postgresql:// scheme (direct connection)"
elif [[ $DATABASE_URL == prisma://* ]]; then
    echo "⚠️  DATABASE_URL uses prisma:// scheme (Data Proxy mode)"
    echo "   This script is designed for direct connections. Consider using Data Proxy setup instead."
else
    echo "❌ Error: Invalid DATABASE_URL scheme. Expected postgresql:// or prisma://"
    exit 1
fi

# Clean existing Prisma client
echo "🧹 Cleaning existing Prisma client..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Generate Prisma client with production schema
echo "🚀 Generating Prisma client with binary engine..."
npx prisma generate --schema=./prisma/schema.production.prisma

# Check if generation was successful
if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"

    # Verify the generated client
    if [ -d "node_modules/.prisma/client" ]; then
        echo "📁 Client location: node_modules/.prisma/client"

        # Check the generated schema
        if [ -f "node_modules/.prisma/client/schema.prisma" ]; then
            echo "📋 Generated schema engine type:"
            grep -E "engineType|provider" node_modules/.prisma/client/schema.prisma | head -5
        fi

        # Test the client
        echo "🧪 Testing Prisma client..."
        node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.\$queryRaw\`SELECT 1 as test\`.then(result => {
                console.log('✅ Database connectivity test successful:', result);
                prisma.\$disconnect();
            }).catch(err => {
                console.log('❌ Database connectivity test failed:', err.message);
                prisma.\$disconnect();
            });
        "
    else
        echo "❌ Error: Prisma client directory not found"
        exit 1
    fi
else
    echo "❌ Error: Prisma client generation failed"
    exit 1
fi

echo "🎯 Prisma client regeneration complete!"
echo "   Engine type: binary"
echo "   Connection: direct PostgreSQL"
echo "   Schema: production"
