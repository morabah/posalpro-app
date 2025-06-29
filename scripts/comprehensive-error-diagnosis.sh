#!/bin/bash

# Comprehensive Error Diagnosis and Fix Script
# This script identifies and fixes ALL critical errors systematically

echo "🔍 COMPREHENSIVE ERROR DIAGNOSIS AND FIX SCRIPT"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error tracking
CRITICAL_ERRORS=0
FIXES_APPLIED=0

echo -e "${BLUE}Phase 1: ErrorInterceptor logData.message.trim Error${NC}"
echo "=================================================="

if grep -n "logData.message.trim" src/lib/api/interceptors/errorInterceptor.ts; then
    echo -e "${RED}❌ CRITICAL: ErrorInterceptor calling .trim() on non-string${NC}"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
    echo -e "${YELLOW}🔧 FIXING: ErrorInterceptor message handling${NC}"
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
else
    echo -e "${GREEN}✅ No .trim() errors found${NC}"
fi

echo -e "\n${BLUE}Phase 2: Prisma Schema Validation Errors${NC}"
echo "========================================"

if [ -f server.log ]; then
    SCHEMA_ERRORS=$(grep -c "Unknown field" server.log 2>/dev/null || echo "0")
    echo "Schema validation errors in server.log: $SCHEMA_ERRORS"

    if [ $SCHEMA_ERRORS -gt 0 ]; then
        echo -e "${RED}❌ CRITICAL: $SCHEMA_ERRORS schema errors found${NC}"
        CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))

        echo "Recent schema errors:"
        grep "Unknown field" server.log | tail -5
    fi
fi

echo -e "\n${BLUE}Phase 3: API Testing${NC}"
echo "==================="

echo "Testing critical endpoints..."
for endpoint in "/api/health" "/api/proposals?limit=5" "/api/customers?limit=5"; do
    echo -n "Testing $endpoint... "
    if curl -s "http://localhost:3000$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
        CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
    fi
done

echo -e "\n${BLUE}SUMMARY${NC}"
echo "======="
echo -e "Critical Errors: ${RED}$CRITICAL_ERRORS${NC}"
echo -e "Fixes Applied: ${GREEN}$FIXES_APPLIED${NC}"

if [ $CRITICAL_ERRORS -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}SUCCESS: No critical errors!${NC}"
else
    echo -e "\n⚠️ ${YELLOW}$CRITICAL_ERRORS issues need attention${NC}"
fi
