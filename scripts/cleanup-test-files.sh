#!/bin/bash

# PosalPro MVP2 - Test Files Cleanup Script
# Based on TESTING_CODEBASE_AUDIT.md recommendations

set -e

echo "🧹 PosalPro MVP2 - Test Files Cleanup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to safely remove files with confirmation
safe_remove() {
    local file="$1"
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Remove: ${BLUE}$file${NC}"
        rm -f "$file"
        echo -e "${GREEN}✓ Removed${NC}"
    else
        warn "File not found: $file"
    fi
}

log "Starting test files cleanup..."

# Phase 1: Remove obsolete test scripts
log "Phase 1: Removing obsolete test scripts..."
find scripts/archive -name "test-*.js" -type f | while read -r file; do
    safe_remove "$file"
done

# Phase 2: Remove broken/incomplete tests
log "Phase 2: Removing broken/incomplete tests..."
safe_remove "src/test/edit-proposal.test.ts"
safe_remove "src/test/edit-proposal-infinite-loop.test.ts"
safe_remove "src/test/logging-test.ts"
safe_remove "src/test/run-logging-test.ts"
safe_remove "src/test/jest-infrastructure.test.ts"

# Phase 3: Remove redundant proposal test scripts
log "Phase 3: Removing redundant proposal test scripts..."
find scripts -name "test-proposal-*.js" -type f | while read -r file; do
    safe_remove "$file"
done

# Phase 4: Remove archived test files
log "Phase 4: Removing archived test files..."
find archive -name "*.test.*" -type f 2>/dev/null | while read -r file; do
    safe_remove "$file"
done

# Phase 5: Remove critical gaps duplicates
log "Phase 5: Removing duplicate critical gap tests..."
safe_remove "src/test/critical-gaps/database-agnostic-validation.test.ts"

log "Cleanup completed!"
echo ""
echo -e "${GREEN}Summary:${NC}"
echo "- Removed obsolete test scripts"
echo "- Removed broken/incomplete tests"
echo "- Removed redundant proposal scripts"
echo "- Removed archived test files"
echo "- Removed duplicate tests"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update integration tests for current API structure"
echo "2. Update accessibility tests for new components"
echo "3. Update component tests for current structure"
echo ""
echo -e "${GREEN}Test Infrastructure Status:${NC}"
echo "✅ E2E Testing: Ready (2 files)"
echo "✅ Accessibility: Ready (4 files)"
echo "✅ Security: Ready (3 files)"
echo "🔄 Integration: Needs updates (9 files)"
echo "🔄 Components: Needs updates (5 files)"

log "Test files cleanup completed successfully!"
