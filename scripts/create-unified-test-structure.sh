#!/bin/bash

# PosalPro MVP2 - Create Unified Test Structure
# This script creates the unified test directory structure as defined in TEST_UNIFICATION_STRATEGY.md

set -e

echo "🏗️  Creating unified test directory structure..."

# Create main test directories
mkdir -p tests/{unit,integration,e2e,accessibility,performance,security,api-routes,critical-gaps,mocks,utils,config}

# Create unit test subdirectories
mkdir -p tests/unit/{lib,components,hooks,utils,services}
mkdir -p tests/unit/lib/{auth,store,testing}
mkdir -p tests/unit/components/{ui,auth,dashboard,proposals}

# Create integration test subdirectories
mkdir -p tests/integration/{api,auth,database,ui}

# Create e2e test subdirectories
mkdir -p tests/e2e/{puppeteer,playwright}

# Create accessibility test subdirectories
mkdir -p tests/accessibility/{components,pages,journeys}

# Create performance test subdirectories
mkdir -p tests/performance/{load,bundle,runtime}

# Create security test subdirectories
mkdir -p tests/security/{auth,api,headers}

# Create API routes test subdirectories
mkdir -p tests/api-routes/{proposals,auth,dashboard}

# Create critical gaps test subdirectories
mkdir -p tests/critical-gaps/{mobile,offline,error-handling}

# Create mocks subdirectories
mkdir -p tests/mocks/{api,data,handlers}

# Create utils subdirectories
mkdir -p tests/utils/{setup,helpers,factories,matchers}

echo "✅ Unified test directory structure created!"
echo ""
echo "📁 Created directories:"
find tests -type d | sort
echo ""
echo "📝 Next steps:"
echo "1. Run migration script: ./scripts/migrate-scattered-tests.sh"
echo "2. Update Jest config: cp jest.config.mjs tests/config/jest.config.mjs"
echo "3. Update package.json scripts"
echo "4. Run verification: ./scripts/verify-test-migration.sh"
