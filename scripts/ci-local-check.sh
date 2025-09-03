#!/bin/bash

# CI Local Check Script
# Run this before pushing to ensure your code passes CI checks

set -e

echo "🚀 Running PosalPro CI Local Checks..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" -eq 0 ]; then
        echo -e "${GREEN}✅ $message${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ $message${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Initialize counters
PASSED_CHECKS=0
FAILED_CHECKS=0
TOTAL_CHECKS=13

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Checking project setup...${NC}"

# 1. Node.js version check
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_NODE="20.0.0"
if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
    print_status 0 "Node.js version: $NODE_VERSION (✅ >= $REQUIRED_NODE)"
else
    print_status 1 "Node.js version: $NODE_VERSION (❌ < $REQUIRED_NODE)"
fi

# 2. npm version check
NPM_VERSION=$(npm --version)
REQUIRED_NPM="10.0.0"
if [ "$(printf '%s\n' "$REQUIRED_NPM" "$NPM_VERSION" | sort -V | head -n1)" = "$REQUIRED_NPM" ]; then
    print_status 0 "npm version: $NPM_VERSION (✅ >= $REQUIRED_NPM)"
else
    print_status 1 "npm version: $NPM_VERSION (❌ < $REQUIRED_NPM)"
fi

echo -e "\n${BLUE}🔧 Installing dependencies...${NC}"
npm ci
print_status $? "Dependencies installed"

echo -e "\n${BLUE}🔒 Security & Type Checks${NC}"
echo "------------------------------"

# 3. TypeScript type check
echo "🔍 Running TypeScript type check..."
npm run type-check
print_status $? "TypeScript type check"

# 4. Security audit
echo "🛡️ Running security audit..."
npm audit --audit-level high --json > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "Security audit (no high/critical vulnerabilities)"
else
    print_status 1 "Security audit (vulnerabilities found)"
fi

# 5. Schema validation
echo "📋 Running database schema validation..."
npm run db:validate
print_status $? "Database schema validation"

echo -e "\n${BLUE}✨ Code Quality Checks${NC}"
echo "---------------------------"

# 6. ESLint
echo "🔍 Running ESLint..."
npm run lint
print_status $? "ESLint code quality"

# 7. Prettier
echo "🎨 Running Prettier format check..."
npm run format:check
print_status $? "Prettier code formatting"

# 8. Duplicate detection
echo "🔍 Running duplicate detection..."
npm run audit:duplicates
print_status $? "Duplicate code detection"

echo -e "\n${BLUE}🧪 Test Suite${NC}"
echo "------------------"

# 9. Unit tests
echo "🧪 Running unit tests..."
npm run test:ci:unit
print_status $? "Unit tests"

# 10. Security tests
echo "🔒 Running security tests..."
npm run test:security
print_status $? "Security tests"

# 11. Accessibility tests
echo "♿ Running accessibility tests..."
npm run test:accessibility
print_status $? "Accessibility tests"

echo -e "\n${BLUE}🏗️ Build & Performance${NC}"
echo "---------------------------"

# 12. Build verification
echo "🏗️ Running production build..."
npm run build
print_status $? "Production build"

# 13. Bundle analysis
echo "📊 Running bundle analysis..."
npm run ci:bundle > /dev/null 2>&1
print_status $? "Bundle analysis"

echo -e "\n${BLUE}📊 CI Check Summary${NC}"
echo "====================="

echo -e "${GREEN}✅ Passed: $PASSED_CHECKS/${TOTAL_CHECKS} checks${NC}"
if [ "$FAILED_CHECKS" -gt 0 ]; then
    echo -e "${RED}❌ Failed: $FAILED_CHECKS/${TOTAL_CHECKS} checks${NC}"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="

if [ "$PASSED_CHECKS" -eq "$TOTAL_CHECKS" ]; then
    echo -e "${GREEN}🎉 All CI checks passed! Your code is ready for commit.${NC}"
    echo ""
    echo "🚀 You can now:"
    echo "   • Push your changes to trigger CI pipeline"
    echo "   • Create a pull request"
    echo "   • Deploy with confidence"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues before committing.${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "   • Run 'npm run type-check' to see TypeScript errors"
    echo "   • Run 'npm run lint' to fix code style issues"
    echo "   • Run 'npm run format:check' to check formatting"
    echo "   • Run 'npm run db:validate' to check database schema"
    echo ""
    echo "💡 Quick fix commands:"
    echo "   npm run lint:fix          # Fix linting issues"
    echo "   npm run format            # Fix formatting issues"
    echo "   npm run quality:check     # Run all quality checks"
    echo ""
    echo "📚 For help:"
    echo "   • Check docs/ci-security-setup.md"
    echo "   • Review docs/CI_IMPLEMENTATION_SUMMARY.md"
    echo "   • Run individual checks to debug specific failures"
    exit 1
fi
