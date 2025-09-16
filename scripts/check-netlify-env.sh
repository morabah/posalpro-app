#!/bin/bash

# Netlify Environment Variables Checker
# This script helps identify and fix the Prisma Data Proxy issue

set -e

echo "🔍 Netlify Environment Variables Diagnostic"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Current Production Environment Status:${NC}"
echo ""

# Test current production status
echo "Testing current production endpoints..."

# Test database health
echo -n "Database Health: "
db_status=$(curl -s -o /dev/null -w "%{http_code}" "https://posalpro.netlify.app/api/health/database")
if [ "$db_status" = "200" ]; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}❌ Failed ($db_status)${NC}"
fi

# Test Prisma configuration
echo -n "Prisma Configuration: "
prisma_config=$(curl -s "https://posalpro.netlify.app/api/health/prisma-config")
if echo "$prisma_config" | grep -q '"engineType": "binary"'; then
    echo -e "${GREEN}✅ Binary Engine${NC}"
elif echo "$prisma_config" | grep -q '"engineType": "unknown"'; then
    echo -e "${RED}❌ Unknown Engine${NC}"
else
    echo -e "${YELLOW}⚠️  Unknown Status${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Issue Analysis:${NC}"
echo ""

# Check for Data Proxy error
db_response=$(curl -s "https://posalpro.netlify.app/api/health/database")
if echo "$db_response" | grep -q "prisma://"; then
    echo -e "${RED}❌ CONFIRMED: Data Proxy URL Error${NC}"
    echo "   The error message contains 'prisma://' protocol reference"
    echo "   This indicates DATABASE_URL is set to a Data Proxy URL in Netlify"
else
    echo -e "${GREEN}✅ No Data Proxy URL error detected${NC}"
fi

echo ""
echo -e "${BLUE}🛠️  Required Actions:${NC}"
echo ""

echo "1. ${YELLOW}Access Netlify Dashboard:${NC}"
echo "   • Go to: https://app.netlify.com/"
echo "   • Navigate to your site (posalpro-mvp2 or posalpro)"
echo "   • Go to: Site settings → Environment variables"

echo ""
echo "2. ${YELLOW}Check DATABASE_URL:${NC}"
echo "   • Look for the DATABASE_URL environment variable"
echo "   • Current value should be: postgresql://username:password@host:port/database"
echo "   • If it shows: prisma://accelerate.prisma-data.net/... → THIS IS THE PROBLEM"

echo ""
echo "3. ${YELLOW}Update DATABASE_URL:${NC}"
echo "   • Change from: prisma://accelerate.prisma-data.net/..."
echo "   • Change to: postgresql://username:password@host:port/database?sslmode=require"
echo "   • Use your actual PostgreSQL connection string"

echo ""
echo "4. ${YELLOW}Verify Prisma Environment Variables:${NC}"
echo "   Ensure these are set correctly:"
echo "   • PRISMA_GENERATE_DATAPROXY=false"
echo "   • PRISMA_CLIENT_ENGINE_TYPE=binary"
echo "   • PRISMA_CLI_QUERY_ENGINE_TYPE=binary"
echo "   • PRISMA_ENGINE_TYPE=binary"
echo "   • PRISMA_SKIP_POSTINSTALL_GENERATE=true"

echo ""
echo "5. ${YELLOW}Trigger New Deployment:${NC}"
echo "   • Go to: Deploys tab in Netlify"
echo "   • Click: Trigger deploy → Deploy site"
echo "   • Wait for build to complete"

echo ""
echo -e "${BLUE}🔍 Verification Steps:${NC}"
echo ""

echo "After deployment, run these commands to verify the fix:"
echo ""
echo "1. Test database health:"
echo "   ${GREEN}curl https://posalpro.netlify.app/api/health/database${NC}"
echo "   Expected: {\"db\":\"up\",\"timestamp\":\"...\"}"
echo ""
echo "2. Test Prisma configuration:"
echo "   ${GREEN}curl https://posalpro.netlify.app/api/health/prisma-config${NC}"
echo "   Expected: \"engineType\": \"binary\""
echo ""
echo "3. Run monitoring script:"
echo "   ${GREEN}./scripts/monitor-deployment.sh${NC}"
echo "   Expected: All endpoints working"

echo ""
echo -e "${BLUE}📞 Need Help?${NC}"
echo ""
echo "If you need assistance:"
echo "• Check the detailed guide: docs/NETLIFY_ENVIRONMENT_FIX.md"
echo "• The issue is in Netlify environment variables, not the code"
echo "• The DATABASE_URL must be postgresql:// not prisma://"
echo "• All Prisma environment variables must be set correctly"

echo ""
echo -e "${GREEN}🎯 Expected Result:${NC}"
echo "After fixing the environment variables, you should see:"
echo "• ✅ Database health endpoint returns 200"
echo "• ✅ Prisma configuration shows binary engine"
echo "• ✅ No more 'prisma://' protocol errors"
echo "• ✅ Full application functionality restored"

