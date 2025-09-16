#!/bin/bash

# Prisma Fix Verification Script
# This script verifies that the prisma:// validation error is resolved

set -e

echo "🔍 Prisma Fix Verification"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Testing Production Endpoints:${NC}"
echo ""

# Test database health
echo -n "Database Health: "
db_response=$(curl -s "https://posalpro.netlify.app/api/health/database")
db_status=$(curl -s -o /dev/null -w "%{http_code}" "https://posalpro.netlify.app/api/health/database")

if [ "$db_status" = "200" ]; then
    echo -e "${GREEN}✅ Working (200)${NC}"
    echo "   Response: $db_response"
else
    echo -e "${RED}❌ Failed ($db_status)${NC}"
    echo "   Response: $db_response"
fi

echo ""

# Test Prisma configuration
echo -n "Prisma Configuration: "
prisma_response=$(curl -s "https://posalpro.netlify.app/api/health/prisma-config")
prisma_status=$(curl -s -o /dev/null -w "%{http_code}" "https://posalpro.netlify.app/api/health/prisma-config")

if [ "$prisma_status" = "200" ]; then
    if echo "$prisma_response" | grep -q '"engineType": "library"'; then
        echo -e "${GREEN}✅ Library Engine (200)${NC}"
    elif echo "$prisma_response" | grep -q '"engineType": "binary"'; then
        echo -e "${GREEN}✅ Binary Engine (200)${NC}"
    else
        echo -e "${YELLOW}⚠️  Unknown Engine Type (200)${NC}"
    fi
    echo "   Response: $prisma_response"
else
    echo -e "${RED}❌ Failed ($prisma_status)${NC}"
    echo "   Response: $prisma_response"
fi

echo ""

# Test authentication endpoint
echo -n "Authentication Test: "
auth_response=$(curl -s -X POST "https://posalpro.netlify.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@posalpro.com","password":"test"}' 2>/dev/null || echo "Connection failed")
auth_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://posalpro.netlify.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@posalpro.com","password":"test"}' 2>/dev/null || echo "000")

if [ "$auth_status" = "401" ] || [ "$auth_status" = "400" ]; then
    echo -e "${GREEN}✅ Working (Expected auth failure: $auth_status)${NC}"
    echo "   This is expected - endpoint is working, just wrong credentials"
elif [ "$auth_status" = "500" ]; then
    echo -e "${RED}❌ Server Error (500)${NC}"
    echo "   Response: $auth_response"
    if echo "$auth_response" | grep -q "prisma://"; then
        echo -e "${RED}   🚨 CONFIRMED: Still has prisma:// error!${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Unexpected Status ($auth_status)${NC}"
    echo "   Response: $auth_response"
fi

echo ""

# Check for prisma:// errors in any response
echo -e "${BLUE}🔍 Checking for prisma:// Errors:${NC}"
if echo "$db_response $prisma_response $auth_response" | grep -q "prisma://"; then
    echo -e "${RED}❌ CONFIRMED: prisma:// error still present!${NC}"
    echo "   The environment variable fix didn't work"
    echo "   Check Netlify environment variables again"
else
    echo -e "${GREEN}✅ No prisma:// errors detected${NC}"
    echo "   The fix appears to be working!"
fi

echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "• Database Health: $db_status"
echo "• Prisma Config: $prisma_status"
echo "• Auth Test: $auth_status"
echo "• prisma:// Errors: $(if echo "$db_response $prisma_response $auth_response" | grep -q "prisma://"; then echo "❌ Present"; else echo "✅ None"; fi)"

echo ""
if [ "$db_status" = "200" ] && [ "$prisma_status" = "200" ] && ! echo "$db_response $prisma_response $auth_response" | grep -q "prisma://"; then
    echo -e "${GREEN}🎉 SUCCESS: Prisma fix is working!${NC}"
    echo "   All endpoints are responding correctly"
    echo "   No more prisma:// validation errors"
else
    echo -e "${RED}❌ ISSUE: Fix not complete${NC}"
    echo "   Check the specific errors above"
    echo "   Verify Netlify environment variables are correct"
fi
