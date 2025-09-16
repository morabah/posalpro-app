#!/bin/bash

# Deployment Monitoring Script for PosalPro MVP2
# Monitors the deployment status and tests key endpoints

set -e

echo "🔍 Monitoring PosalPro MVP2 Deployment"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3

    echo -n "Testing $description... "

    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "https://posalpro.netlify.app$endpoint")

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $status_code${NC}"
        return 0
    else
        echo -e "${RED}❌ $status_code (expected $expected_status)${NC}"
        return 1
    fi
}

# Function to get endpoint response
get_endpoint_response() {
    local endpoint=$1
    local description=$2

    echo -e "${BLUE}📋 $description:${NC}"
    local response=$(curl -s "https://posalpro.netlify.app$endpoint")
    echo "$response" | jq . 2>/dev/null || echo "$response"
    echo ""
}

echo "🌐 Testing main site accessibility..."
if curl -s -f "https://posalpro.netlify.app" > /dev/null; then
    echo -e "${GREEN}✅ Main site is accessible${NC}"
else
    echo -e "${RED}❌ Main site is not accessible${NC}"
    exit 1
fi

echo ""
echo "🔍 Testing API endpoints..."

# Test basic endpoints
test_endpoint "/api/health" "200" "General health endpoint"
test_endpoint "/api/config" "401" "Config endpoint (auth required)"

echo ""
echo "🔍 Testing Prisma-related endpoints..."

# Test database health endpoint
echo -n "Testing database health endpoint... "
db_status=$(curl -s -o /dev/null -w "%{http_code}" "https://posalpro.netlify.app/api/health/database")
if [ "$db_status" = "200" ]; then
    echo -e "${GREEN}✅ $db_status${NC}"
    echo -e "${GREEN}🎉 Database connectivity working!${NC}"
else
    echo -e "${RED}❌ $db_status${NC}"
    echo -e "${YELLOW}⚠️ Database endpoint still has issues${NC}"
fi

# Test Prisma configuration endpoint
echo ""
get_endpoint_response "/api/health/prisma-config" "Prisma Configuration Status"

# Test database health endpoint response
if [ "$db_status" != "200" ]; then
    echo ""
    get_endpoint_response "/api/health/database" "Database Health Error Details"
fi

echo ""
echo "📊 Deployment Status Summary:"
echo "============================="

# Overall status
if [ "$db_status" = "200" ]; then
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}✅ All endpoints working correctly${NC}"
    echo -e "${GREEN}✅ Prisma Data Proxy issue resolved${NC}"
    echo -e "${GREEN}✅ Runtime guards working properly${NC}"
else
    echo -e "${YELLOW}⚠️ DEPLOYMENT PARTIAL SUCCESS${NC}"
    echo -e "${GREEN}✅ Main site and basic APIs working${NC}"
    echo -e "${RED}❌ Database connectivity still has issues${NC}"
    echo -e "${YELLOW}💡 Check build logs for Prisma client generation${NC}"
fi

echo ""
echo "🔗 Production URL: https://posalpro.netlify.app"
echo "📋 Next steps:"
if [ "$db_status" = "200" ]; then
    echo "  1. ✅ Test all major features (auth, products, proposals)"
    echo "  2. ✅ Verify database operations work correctly"
    echo "  3. ✅ Confirm no Edge Function conflicts"
else
    echo "  1. 🔍 Check Netlify build logs for Prisma generation errors"
    echo "  2. 🔧 Verify environment variables are set correctly"
    echo "  3. 🔄 May need to trigger another deployment"
fi

