#!/bin/bash

# PosalPro MVP2 - Verify Test Migration
# This script verifies that all tests have been successfully migrated to the unified structure

set -e

echo "🔍 Verifying test migration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  local status="$1"
  local message="$2"

  case "$status" in
    "success")
      echo -e "${GREEN}✅ $message${NC}"
      ;;
    "warning")
      echo -e "${YELLOW}⚠️  $message${NC}"
      ;;
    "error")
      echo -e "${RED}❌ $message${NC}"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Check for remaining scattered test files
echo "📂 Checking for remaining scattered test files..."
remaining_test_files=$(find src -name "*.test.*" -o -name "*.spec.*" | grep -v node_modules | wc -l)

if [ "$remaining_test_files" -gt 0 ]; then
  print_status "warning" "Found $remaining_test_files remaining scattered test files:"
  find src -name "*.test.*" -o -name "*.spec.*" | grep -v node_modules | while read -r file; do
    echo "  - $file"
  done
  echo ""
else
  print_status "success" "No scattered test files found in src/ directory"
fi

# Check for empty __tests__ directories
echo "🧹 Checking for empty __tests__ directories..."
empty_test_dirs=$(find src -name "__tests__" -type d -empty | wc -l)

if [ "$empty_test_dirs" -gt 0 ]; then
  print_status "warning" "Found $empty_test_dirs empty __tests__ directories:"
  find src -name "__tests__" -type d -empty | while read -r dir; do
    echo "  - $dir"
  done
  echo ""
else
  print_status "success" "No empty __tests__ directories found"
fi

# Check unified test directory structure
echo "📁 Checking unified test directory structure..."
expected_dirs=(
  "tests/unit"
  "tests/unit/lib"
  "tests/unit/components"
  "tests/unit/hooks"
  "tests/unit/utils"
  "tests/unit/services"
  "tests/integration"
  "tests/e2e"
  "tests/accessibility"
  "tests/performance"
  "tests/security"
  "tests/api-routes"
  "tests/critical-gaps"
  "tests/mocks"
  "tests/utils"
  "tests/config"
)

missing_dirs=()
for dir in "${expected_dirs[@]}"; do
  if [ ! -d "$dir" ]; then
    missing_dirs+=("$dir")
  fi
done

if [ ${#missing_dirs[@]} -gt 0 ]; then
  print_status "error" "Missing unified test directories:"
  for dir in "${missing_dirs[@]}"; do
    echo "  - $dir"
  done
else
  print_status "success" "All unified test directories exist"
fi

# Check for test files in unified structure
echo "📄 Checking for test files in unified structure..."
unified_test_files=$(find tests -name "*.test.*" -o -name "*.spec.*" | wc -l)

if [ "$unified_test_files" -gt 0 ]; then
  print_status "success" "Found $unified_test_files test files in unified structure"
else
  print_status "warning" "No test files found in unified structure"
fi

# Test directory statistics
echo "📊 Test directory statistics:"
echo "Unified structure:"
find tests -name "*.test.*" -o -name "*.spec.*" | wc -l | xargs echo "  - Total test files:"

echo ""
echo "By category:"
for category in unit integration e2e accessibility performance security api-routes critical-gaps; do
  if [ -d "tests/$category" ]; then
    count=$(find "tests/$category" -name "*.test.*" -o -name "*.spec.*" | wc -l)
    echo "  - $category: $count files"
  fi
done

# Check Jest configuration
echo ""
echo "🔧 Checking Jest configuration..."
if [ -f "tests/config/jest.config.mjs" ]; then
  print_status "success" "Jest configuration exists in unified structure"
else
  print_status "warning" "Jest configuration not found in tests/config/"
fi

if [ -f "tests/config/jest.setup.js" ]; then
  print_status "success" "Jest setup file exists in unified structure"
else
  print_status "warning" "Jest setup file not found in tests/config/"
fi

# Summary
echo ""
echo "📋 Migration Verification Summary:"
echo "=================================="

if [ "$remaining_test_files" -eq 0 ] && [ "$empty_test_dirs" -eq 0 ] && [ ${#missing_dirs[@]} -eq 0 ]; then
  print_status "success" "Migration appears successful!"
  echo ""
  echo "🎯 Next steps:"
  echo "1. Update Jest configuration to use unified structure"
  echo "2. Update package.json test scripts"
  echo "3. Run tests to verify everything works"
  echo "4. Update CI/CD pipeline"
  echo "5. Clean up old test directories"
else
  print_status "warning" "Migration may need additional work"
  echo ""
  echo "🔧 Recommended actions:"
  if [ "$remaining_test_files" -gt 0 ]; then
    echo "1. Manually move remaining scattered test files"
  fi
  if [ "$empty_test_dirs" -gt 0 ]; then
    echo "2. Remove empty __tests__ directories"
  fi
  if [ ${#missing_dirs[@]} -gt 0 ]; then
    echo "3. Create missing unified test directories"
  fi
fi

echo ""
echo "📖 For detailed migration guide, see: docs/TEST_UNIFICATION_STRATEGY.md"
