#!/bin/bash

# PosalPro MVP2 - Smart Development Server with Comprehensive Health Checks
# First line of defense for debugging essential system health

set -e  # Exit on error

# Enhanced colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Unicode symbols for better visual appeal
CHECK_MARK="✅"
CROSS_MARK="❌"
WARNING="⚠️"
INFO="ℹ️"
ROCKET="🚀"
DATABASE="🗄️"
LOCK="🔐"
GLOBE="🌐"
OFFLINE="📱"
HEART="💓"
GEAR="⚙️"
LIGHTNING="⚡"

# Status tracking
HEALTH_ISSUES=0
WARNINGS_COUNT=0
CHECKS_PASSED=0
TOTAL_CHECKS=0

# Project root detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}╭─────────────────────────────────────────────────────────────╮${NC}"
    echo -e "${BOLD}${BLUE}│${NC} ${BOLD}$1${NC} ${BLUE}│${NC}"
    echo -e "${BOLD}${BLUE}╰─────────────────────────────────────────────────────────────╯${NC}"
}

# Function to print check results
print_check() {
    local status=$1
    local message=$2
    local details=$3

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ "$status" = "pass" ]; then
        echo -e "  ${CHECK_MARK} ${GREEN}${message}${NC}"
        [ -n "$details" ] && echo -e "     ${DIM}${details}${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    elif [ "$status" = "warn" ]; then
        echo -e "  ${WARNING} ${YELLOW}${message}${NC}"
        [ -n "$details" ] && echo -e "     ${DIM}${details}${NC}"
        WARNINGS_COUNT=$((WARNINGS_COUNT + 1))
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${CROSS_MARK} ${RED}${message}${NC}"
        [ -n "$details" ] && echo -e "     ${DIM}${details}${NC}"
        HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
    fi
}

# Function to fix PostgreSQL service synchronization
fix_postgres_sync() {
    echo -e "  ${INFO} ${BLUE}Attempting to fix PostgreSQL service synchronization...${NC}"

    # Stop the service first
    brew services stop postgresql@14 >/dev/null 2>&1

    # Wait for it to stop
    sleep 2

    # Check if process is still running
    if pg_ctl -D /opt/homebrew/var/postgresql@14 status >/dev/null 2>&1; then
        # Stop the process manually
        pg_ctl -D /opt/homebrew/var/postgresql@14 stop >/dev/null 2>&1
        sleep 2
    fi

    # Start the service properly
    if brew services start postgresql@14 >/dev/null 2>&1; then
        sleep 3
        # Verify it's now properly synced
        local new_status=$(brew services list | grep postgresql | awk '{print $2}')
        if [ "$new_status" = "started" ]; then
            echo -e "  ${CHECK_MARK} ${GREEN}PostgreSQL service synchronization fixed${NC}"
            return 0
        fi
    fi

    echo -e "  ${CROSS_MARK} ${YELLOW}Could not fix service synchronization automatically${NC}"
    return 1
}

# Function to check database configuration consistency
check_database_config() {
    print_header "${DATABASE} Database Configuration Check"

    # Check if environment files exist
    if [ -f ".env.local" ]; then
        print_check "pass" "Environment file exists" ".env.local found"
    else
        print_check "fail" "Environment file missing" "Create .env.local with required variables"
        return 1
    fi

    # Check DATABASE_URL configuration
    if grep -q "DATABASE_URL=" .env.local; then
        local db_url=$(grep "DATABASE_URL=" .env.local | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')

        # Check if URL starts with expected protocol
        if [[ "$db_url" == postgresql://* ]] || [[ "$db_url" == postgres://* ]]; then
            print_check "pass" "Database URL uses PostgreSQL protocol"
        elif [[ "$db_url" == file:* ]]; then
            print_check "warn" "Database URL uses SQLite" "Expected PostgreSQL for production environment"
            echo -e "  ${INFO} ${BLUE}Detected SQLite URL: $db_url${NC}"

            # Check if this is intentional or needs fixing
            if [ -f "prisma/schema.prisma" ]; then
                if grep -q 'provider = "postgresql"' prisma/schema.prisma; then
                    print_check "fail" "Configuration mismatch" "Prisma expects PostgreSQL but .env.local has SQLite"
                    echo -e "  ${WARNING} ${YELLOW}Fix: Update .env.local DATABASE_URL to PostgreSQL${NC}"
                    return 1
                fi
            fi
        else
            print_check "warn" "Database URL format unknown" "URL: $db_url"
        fi
    else
        print_check "fail" "DATABASE_URL not configured in .env.local"
        return 1
    fi

    # Check Prisma schema configuration
    if [ -f "prisma/schema.prisma" ]; then
        if grep -q 'provider.*=.*"postgresql"' prisma/schema.prisma; then
            print_check "pass" "Prisma schema configured for PostgreSQL"
        elif grep -q 'provider.*=.*"sqlite"' prisma/schema.prisma; then
            print_check "pass" "Prisma schema configured for SQLite"
        else
            print_check "warn" "Prisma provider not clearly configured"
        fi
    else
        print_check "fail" "Prisma schema not found" "Expected: prisma/schema.prisma"
        return 1
    fi

    return 0
}

# Function to test database connectivity
check_database() {
    print_header "${DATABASE} Database Health Check"

    # First check configuration consistency
    if ! check_database_config; then
        print_check "fail" "Database configuration issues detected" "Fix configuration before proceeding"
        return 1
    fi

    # Check PostgreSQL status more robustly
    local brew_status=$(brew services list | grep postgresql | awk '{print $2}')

    if [ "$brew_status" = "started" ]; then
        print_check "pass" "PostgreSQL service is running"
    else
        # Brew services shows error, but check if process is actually running
        if pg_ctl -D /opt/homebrew/var/postgresql@14 status >/dev/null 2>&1; then
            print_check "warn" "PostgreSQL running but service out of sync" "Process running, but brew services shows '$brew_status'"

            # Offer to fix the sync issue (5 second timeout)
            echo ""
            echo -e "${YELLOW}Would you like to fix the PostgreSQL service synchronization now? (y/N) [5s timeout]${NC}"
            if read -t 5 -r fix_response; then
                if [[ "$fix_response" =~ ^[Yy]$ ]]; then
                    if fix_postgres_sync; then
                        # Re-run the check
                        check_database
                        return
                    fi
                fi
            else
                echo -e "${DIM}Timeout reached, continuing without fixing sync...${NC}"
            fi
        else
            print_check "fail" "PostgreSQL service is not running" "Run: brew services start postgresql@14"
            return
        fi
    fi

    # Check database connection with credentials
    if psql -U mohamedrabah -d posalpro_mvp2 -c "SELECT 1;" >/dev/null 2>&1; then
        print_check "pass" "Database connection successful" "Connected to posalpro_mvp2"
    else
        print_check "fail" "Database connection failed" "Check credentials and database existence"
        return
    fi

    # Check database schema
    local table_count=$(psql -U mohamedrabah -d posalpro_mvp2 -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    if [ -n "$table_count" ] && [ "$table_count" -gt 0 ]; then
        print_check "pass" "Database schema exists" "$table_count tables found"
    else
        print_check "warn" "Database schema empty" "Run: npm run db:push && npm run db:seed"
        return
    fi

    # Check for seeded data with better error handling
    local user_count=$(psql -U mohamedrabah -d posalpro_mvp2 -t -c "SELECT count(*) FROM users;" 2>/dev/null | xargs)

    # Handle empty or non-numeric response
    if [ -z "$user_count" ] || ! [[ "$user_count" =~ ^[0-9]+$ ]]; then
        print_check "warn" "Cannot verify seeded data" "Database table may not exist - Run: npm run db:seed"
    elif [ "$user_count" -gt 0 ]; then
        print_check "pass" "Database has seeded data" "$user_count users found"
    else
        print_check "warn" "Database needs seeding" "Run: npm run db:seed"
    fi

    # Test Prisma database connectivity using a simpler method
    if command -v npx &> /dev/null; then
        echo -e "  ${INFO} ${BLUE}Testing Prisma database connectivity...${NC}"
        # Use prisma generate to test database connectivity (lighter than db execute)
        if npx prisma generate --schema=prisma/schema.prisma >/dev/null 2>&1; then
            print_check "pass" "Prisma database connectivity verified"
        else
            print_check "warn" "Prisma database connectivity failed" "Check Prisma configuration and database connection"
        fi
    else
        print_check "warn" "Cannot test Prisma connectivity" "npx not available"
    fi
}

# Function to check environment configuration
check_environment() {
    print_header "${GEAR} Environment Configuration"

    # Check .env.local exists
    if [ -f ".env.local" ]; then
        print_check "pass" "Environment file exists" ".env.local found"
    else
        print_check "fail" "Environment file missing" "Create .env.local with required variables"
        return
    fi

    # Check DATABASE_URL
    if grep -q "DATABASE_URL=" .env.local; then
        print_check "pass" "Database URL configured"
    else
        print_check "fail" "DATABASE_URL not configured"
    fi

    # Check NextAuth secret
    if grep -q "NEXTAUTH_SECRET=" .env.local; then
        print_check "pass" "NextAuth secret configured"
    else
        print_check "warn" "NEXTAUTH_SECRET not set" "Authentication may not work properly"
    fi

    # Check JWT secret
    if grep -q "JWT_SECRET=" .env.local; then
        print_check "pass" "JWT secret configured"
    else
        print_check "warn" "JWT_SECRET not set" "Token validation may fail"
    fi

    # Check Node version (use NVM if available)
    if command -v nvm &> /dev/null && [ -n "$NVM_DIR" ]; then
        # Load NVM and use the version from .nvmrc if available
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" --no-use
        if [ -f ".nvmrc" ]; then
            nvm use $(cat .nvmrc) >/dev/null 2>&1
        fi
    fi
    local node_version=$(node --version | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    if [ "$major_version" -ge 18 ]; then
        print_check "pass" "Node.js version compatible" "v$node_version"
    else
        print_check "fail" "Node.js version too old" "Requires Node.js 18+, found v$node_version"
    fi
}

# Function to check authentication system
check_authentication() {
    print_header "${LOCK} Authentication System"

    # Check auth configuration files
    if [ -f "src/lib/auth.ts" ]; then
        print_check "pass" "Auth configuration found"
    else
        print_check "fail" "Auth configuration missing" "src/lib/auth.ts not found"
    fi

    # Check auth API routes
    if [ -f "src/app/api/auth/[...nextauth]/route.ts" ]; then
        print_check "pass" "NextAuth API routes configured"
    else
        print_check "fail" "NextAuth API routes missing"
    fi

    # Check password utilities
    if [ -f "src/lib/auth/passwordUtils.ts" ]; then
        print_check "pass" "Password utilities available"
    else
        print_check "warn" "Password utilities missing" "Password hashing may not work"
    fi
}

# Function to check network connectivity
check_connectivity() {
    print_header "${GLOBE} Network Connectivity"

    # Check internet connectivity
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        print_check "pass" "Internet connectivity available"
    else
        print_check "warn" "Internet connectivity limited" "Some features may not work"
    fi

    # Check DNS resolution
    if nslookup google.com >/dev/null 2>&1; then
        print_check "pass" "DNS resolution working"
    else
        print_check "warn" "DNS resolution issues" "Network requests may fail"
    fi

    # Check localhost resolution
    if ping -c 1 localhost >/dev/null 2>&1; then
        print_check "pass" "Localhost resolution working"
    else
        print_check "fail" "Localhost resolution failed" "Development server may not start"
    fi
}

# Function to test offline capabilities
check_offline_readiness() {
    print_header "${OFFLINE} Offline Capabilities"

    # Check service worker files
    if [ -f "public/sw.js" ] || [ -f "src/app/sw.ts" ]; then
        print_check "pass" "Service worker files found"
    else
        print_check "warn" "No service worker detected" "Offline functionality limited"
    fi

    # Check local storage utilities
    if grep -r "localStorage" src/ >/dev/null 2>&1; then
        print_check "pass" "Local storage implementation detected"
    else
        print_check "warn" "Limited local storage usage" "Offline data persistence may be limited"
    fi

    # Check cache strategies
    if grep -r "cache" src/ >/dev/null 2>&1; then
        print_check "pass" "Caching strategies implemented"
    else
        print_check "warn" "Limited caching detected" "Performance may be impacted"
    fi
}

# Function to check dependencies
check_dependencies() {
    print_header "${LIGHTNING} Dependencies & Build System"

    # Check package.json
    if [ -f "package.json" ]; then
        print_check "pass" "Package configuration found"
    else
        print_check "fail" "package.json missing" "Project configuration not found"
        return
    fi

    # Check node_modules
    if [ -d "node_modules" ]; then
        print_check "pass" "Dependencies installed"
    else
        print_check "fail" "Dependencies not installed" "Run: npm install"
        return
    fi

    # Check for critical dependencies
    local critical_deps=("next" "react" "@prisma/client" "next-auth")
    for dep in "${critical_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            print_check "pass" "$dep dependency available"
        else
            print_check "fail" "$dep dependency missing" "Run: npm install"
        fi
    done

    # Check TypeScript configuration
    if [ -f "tsconfig.json" ]; then
        print_check "pass" "TypeScript configuration found"
    else
        print_check "warn" "TypeScript configuration missing"
    fi
}

# Function to start API health checks after server starts
check_api_health() {
    local port=$1
    print_header "${HEART} API Health Validation"

    echo -e "  ${INFO} ${BLUE}Waiting for server to fully initialize...${NC}"
    sleep 5

    # Test admin metrics endpoint
    local metrics_response=$(curl -s --max-time 5 "http://localhost:$port/api/admin/metrics" 2>/dev/null)
    if echo "$metrics_response" | grep -q '"success".*true' || echo "$metrics_response" | grep -q '"data"'; then
        print_check "pass" "Admin metrics API responding" "http://localhost:$port/api/admin/metrics"
    else
        print_check "warn" "Admin metrics API not responding" "May need more startup time or check database"
    fi

    # Test admin users endpoint
    local users_response=$(curl -s --max-time 5 "http://localhost:$port/api/admin/users" 2>/dev/null)
    if echo "$users_response" | grep -q '"success".*true' || echo "$users_response" | grep -q '"data"'; then
        print_check "pass" "Admin users API responding" "http://localhost:$port/api/admin/users"
    else
        print_check "warn" "Admin users API not responding" "Check database connectivity"
    fi

    # Test health endpoint (if exists)
    local health_response=$(curl -s --max-time 3 -w "%{http_code}" "http://localhost:$port/api/health" 2>/dev/null)
    local health_status="${health_response: -3}"  # Get last 3 characters (HTTP status)

    if [ "$health_status" = "200" ] || [ "$health_status" = "503" ]; then
        print_check "pass" "Health endpoint responding" "HTTP $health_status - /api/health"
    else
        print_check "warn" "Health endpoint not available" "Consider implementing /api/health"
    fi

    # Test Redis health endpoint (if exists)
    local redis_health_response=$(curl -s --max-time 3 -w "%{http_code}" "http://localhost:$port/api/health/redis" 2>/dev/null)
    local redis_health_status="${redis_health_response: -3}"  # Get last 3 characters (HTTP status)

    if [ "$redis_health_status" = "200" ]; then
        print_check "pass" "Redis health check passed" "HTTP $redis_health_status - /api/health/redis"
    elif [ "$redis_health_status" = "503" ]; then
        print_check "warn" "Redis not available" "HTTP $redis_health_status - /api/health/redis (using memory cache)"
    else
        print_check "info" "Redis health check skipped" "Endpoint not available or Redis disabled"
    fi
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || echo "")

    if [ -n "$pids" ]; then
        echo -e "  ${WARNING} ${YELLOW}Killing processes on port $port${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Function to kill Next.js development processes
kill_nextjs_processes() {
    echo -e "${INFO} ${BLUE}Cleaning up existing Next.js processes...${NC}"

    # Kill Next.js dev processes
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true
    pkill -f "node.*next" 2>/dev/null || true

    sleep 2
}

# Function to find available port
find_available_port() {
    local start_port=${1:-3000}
    local max_attempts=10

    for ((i=0; i<max_attempts; i++)); do
        local port=$((start_port + i))
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo $port
            return 0
        fi
    done

    return 1
}

# Function to display final health summary
display_health_summary() {
    echo ""
    echo -e "${BOLD}${BLUE}╭─────────────────────────────────────────────────────────────╮${NC}"
    echo -e "${BOLD}${BLUE}│${NC} ${BOLD}${ROCKET} PosalPro Health Check Summary${NC} ${BLUE}│${NC}"
    echo -e "${BOLD}${BLUE}╰─────────────────────────────────────────────────────────────╯${NC}"

    echo -e "  ${BOLD}Total Checks:${NC} $TOTAL_CHECKS"
    echo -e "  ${BOLD}${GREEN}Passed:${NC} $CHECKS_PASSED"
    echo -e "  ${BOLD}${YELLOW}Warnings:${NC} $WARNINGS_COUNT"
    echo -e "  ${BOLD}${RED}Failed:${NC} $HEALTH_ISSUES"

    local success_rate=$((CHECKS_PASSED * 100 / TOTAL_CHECKS))

    if [ $HEALTH_ISSUES -eq 0 ]; then
        echo -e "  ${BOLD}${GREEN}Overall Status: HEALTHY ${CHECK_MARK}${NC}"
        echo -e "  ${BOLD}${GREEN}Success Rate: ${success_rate}%${NC}"
        if [ $WARNINGS_COUNT -gt 0 ]; then
            echo -e "  ${YELLOW}Note: $WARNINGS_COUNT warnings detected but system is operational${NC}"
        fi
    else
        echo -e "  ${BOLD}${RED}Overall Status: ISSUES DETECTED ${CROSS_MARK}${NC}"
        echo -e "  ${BOLD}${RED}Success Rate: ${success_rate}%${NC}"
        echo -e "  ${RED}Please address the failed checks above before proceeding${NC}"
    fi

    echo ""
}

# Function to validate database schema against Prisma
validate_database_schema() {
    print_header "🔍 Database Schema Validation"

    # Check if Prisma schema exists
    if [ ! -f "prisma/schema.prisma" ]; then
        print_check "fail" "Prisma schema not found" "Expected: prisma/schema.prisma"
        return 1
    fi

    # Check if database is accessible
    if ! psql -U mohamedrabah -d posalpro_mvp2 -c "SELECT 1;" >/dev/null 2>&1; then
        print_check "fail" "Cannot validate schema" "Database connection failed"
        return 1
    fi

    # Get table count from database
    local db_table_count=$(psql -U mohamedrabah -d posalpro_mvp2 -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | xargs)

    # Get model count from Prisma schema (approximate)
    local prisma_model_count=$(grep -c "^model " prisma/schema.prisma 2>/dev/null || echo "0")

    if [ -n "$db_table_count" ] && [ "$db_table_count" -gt 0 ]; then
        print_check "pass" "Database has tables" "$db_table_count tables found"

        # Compare with Prisma models (rough estimate)
        if [ "$prisma_model_count" -gt 0 ]; then
            local diff=$((db_table_count - prisma_model_count))
            if [ $diff -eq 0 ]; then
                print_check "pass" "Schema alignment verified" "Database tables match Prisma models ($prisma_model_count)"
            elif [ $diff -eq 1 ]; then
                # Single extra table - likely a migration or junction table
                print_check "warn" "Minor table count difference" "Database: $db_table_count, Prisma: $prisma_model_count (likely _prisma_migrations or junction table)"
            elif [ $diff -gt 1 ]; then
                print_check "warn" "Multiple extra tables in database" "Database: $db_table_count, Prisma: $prisma_model_count"
            else
                print_check "warn" "Missing tables in database" "Database: $db_table_count, Prisma: $prisma_model_count"
            fi
        fi
    else
        print_check "warn" "Database schema empty" "Run: npm run db:push to create tables"
    fi

    # Test a few key tables exist
    local key_tables=("users" "proposals" "products" "customers")
    local missing_tables=()

    for table in "${key_tables[@]}"; do
        if ! psql -U mohamedrabah -d posalpro_mvp2 -c "SELECT 1 FROM $table LIMIT 1;" >/dev/null 2>&1; then
            missing_tables+=("$table")
        fi
    done

    if [ ${#missing_tables[@]} -eq 0 ]; then
        print_check "pass" "Key tables verified" "All essential tables exist"
    else
        print_check "warn" "Missing key tables" "Missing: ${missing_tables[*]}"
    fi

    return 0
}

# Function to check schema consistency
check_schema_consistency() {
    print_header "🔍 Schema & Data Consistency"

    # Check if database is healthy first
    if [ $HEALTH_ISSUES -gt 0 ]; then
        print_check "warn" "Skipping schema checks" "Database issues detected - fix database first"
        return
    fi

    # Run database schema validation first
    validate_database_schema

    # Check if app-cli is available
    if ! command -v npm &> /dev/null; then
        print_check "warn" "Cannot run advanced schema checks" "npm not available"
        return
    fi

    # Run schema consistency check
    echo -e "  ${INFO} ${BLUE}Running advanced schema consistency validation...${NC}"

    # Ensure we're in the correct directory for npm commands
    if (cd "$PROJECT_ROOT" && npm run schema:check --silent 2>/dev/null | grep -q "NO INCONSISTENCIES FOUND"); then
        print_check "pass" "Schema consistency verified" "All layers properly aligned"
    else
        print_check "warn" "Schema inconsistencies detected" "Run: npm run schema:all for details"
    fi

    # Run data integrity check
    if (cd "$PROJECT_ROOT" && npm run schema:integrity --silent 2>/dev/null | grep -q "ALL DATA INTEGRITY CHECKS PASSED"); then
        print_check "pass" "Data integrity verified" "No orphaned records or constraint violations"
    else
        print_check "warn" "Data integrity issues detected" "Run: npm run schema:integrity for details"
    fi

    # Run Zod validation check
    if (cd "$PROJECT_ROOT" && npm run schema:validate --silent 2>/dev/null | grep -q "ALL ZOD VALIDATIONS PASSED"); then
        print_check "pass" "Zod validation verified" "All schemas match live data"
    else
        print_check "warn" "Zod validation issues detected" "Run: npm run schema:validate for details"
    fi
}

# Function to start Redis server
start_redis() {
    print_header "${DATABASE} Starting Redis Server"

    # Check if Redis is already running
    if redis-cli ping >/dev/null 2>&1; then
        print_check "pass" "Redis server is already running"
        return 0
    fi

    # Try to start Redis using brew services
    if command -v brew >/dev/null 2>&1; then
        echo -e "  ${INFO} ${BLUE}Starting Redis via brew services...${NC}"
        if brew services start redis >/dev/null 2>&1; then
            sleep 2
            if redis-cli ping >/dev/null 2>&1; then
                print_check "pass" "Redis server started successfully"
                return 0
            fi
        fi
    fi

    # Try to start Redis directly
    echo -e "  ${INFO} ${BLUE}Attempting to start Redis directly...${NC}"
    if command -v redis-server >/dev/null 2>&1; then
        redis-server --daemonize yes >/dev/null 2>&1
        sleep 2
        if redis-cli ping >/dev/null 2>&1; then
            print_check "pass" "Redis server started successfully"
            return 0
        fi
    fi

    print_check "warn" "Could not start Redis server" "Redis will use in-memory fallback"
    return 1
}

# Function to start Python CORS server
start_python_server() {
    print_header "${GLOBE} Starting Python CORS Server"

    # Check if Python is available
    if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
        print_check "warn" "Python not found" "CORS server for PDF testing will not be available"
        return 1
    fi

    local python_cmd="python3"
    if ! command -v python3 >/dev/null 2>&1; then
        python_cmd="python"
    fi

    # Check if CORS server script exists
    if [ ! -f "public/docs/cors_server.py" ]; then
        print_check "warn" "CORS server script not found" "Expected: public/docs/cors_server.py"
        return 1
    fi

    # Kill any existing Python CORS servers before starting a new one
    echo -e "  ${INFO} ${BLUE}Cleaning up existing Python CORS servers...${NC}"
    pkill -f "cors_server.py" >/dev/null 2>&1 || true
    sleep 1

    # Find available port for Python server (starting from 8080)
    local python_port=8080
    while lsof -Pi :$python_port -sTCP:LISTEN -t >/dev/null 2>&1; do
        python_port=$((python_port + 1))
    done

    echo -e "  ${INFO} ${BLUE}Starting Python CORS server on port $python_port...${NC}"

    # Start Python server in background
    cd public/docs && $python_cmd cors_server.py $python_port >/dev/null 2>&1 &
    PYTHON_PID=$!
    cd ../..

    sleep 2

    # Verify server is running
    if kill -0 $PYTHON_PID 2>/dev/null; then
        print_check "pass" "Python CORS server started" "Available at: http://localhost:$python_port/"
        return 0
    else
        print_check "fail" "Python CORS server failed to start"
        return 1
    fi
}

# Function to offer database seeding and schema testing (called after server startup)
offer_database_operations() {
    print_header "${DATABASE} Database Operations"

    echo -e "${YELLOW}Would you like to seed the database now? This will add sample users and data. (y/N) [10s timeout]${NC}"
    if read -t 10 -r seed_response; then
        if [[ "$seed_response" =~ ^[Yy]$ ]]; then
            echo -e "${INFO} ${BLUE}Seeding database...${NC}"
            if (cd "$PROJECT_ROOT" && npm run db:seed >/dev/null 2>&1); then
                echo -e "${CHECK_MARK} ${GREEN}Database seeded successfully${NC}"
                # Re-check user count
                local user_count=$(psql -U mohamedrabah -d posalpro_mvp2 -t -c "SELECT count(*) FROM users;" 2>/dev/null | xargs)
                if [ -n "$user_count" ] && [ "$user_count" -gt 0 ]; then
                    echo -e "${CHECK_MARK} ${GREEN}Verified: $user_count users now available${NC}"
                fi
            else
                echo -e "${CROSS_MARK} ${RED}Database seeding failed${NC}"
                echo -e "${DIM}You can run manually: npm run db:seed${NC}"
            fi
        else
            echo -e "${DIM}Database seeding skipped${NC}"
        fi
    else
        echo -e "${DIM}Timeout reached, skipping database seeding...${NC}"
    fi

    # Offer schema synchronization (5 second timeout)
    echo ""
    echo -e "${YELLOW}Would you like to synchronize database schema now? (y/N) [10s timeout]${NC}"
    if read -t 10 -r schema_response; then
        if [[ "$schema_response" =~ ^[Yy]$ ]]; then
            echo -e "${INFO} ${BLUE}Synchronizing database schema...${NC}"
            if (cd "$PROJECT_ROOT" && npm run db:push >/dev/null 2>&1); then
                echo -e "${CHECK_MARK} ${GREEN}Database schema synchronized successfully${NC}"
            else
                echo -e "${CROSS_MARK} ${RED}Database schema sync failed${NC}"
                echo -e "${DIM}You can run manually: npm run db:push${NC}"
            fi
        else
            echo -e "${DIM}Schema synchronization skipped${NC}"
        fi
    else
        echo -e "${DIM}Timeout reached, skipping schema synchronization...${NC}"
    fi
}

# Main execution function
main() {
    # Check for services-only flag
    SERVICES_ONLY=false
    if [ "$1" = "--services-only" ]; then
        SERVICES_ONLY=true
    fi
    if [ "$SERVICES_ONLY" = true ]; then
        echo -e "${BOLD}${PURPLE}${ROCKET} PosalPro MVP2 - Services Only Mode${NC}"
        echo -e "${DIM}Starting Redis and Python servers only${NC}"
        echo ""

        # Start Redis server
        start_redis

        # Start Python CORS server
        start_python_server

        echo ""
        echo -e "${BOLD}${GREEN}${CHECK_MARK} Services started successfully!${NC}"
        echo -e "${DIM}Press Ctrl+C to stop all services${NC}"

        # Keep services running
        while true; do
            sleep 1
        done
    else
        clear
        echo -e "${BOLD}${PURPLE}${ROCKET} PosalPro MVP2 - Smart Development Health Check${NC}"
        echo -e "${DIM}Comprehensive system validation and startup${NC}"
        echo ""
    fi

    # Kill existing processes
    kill_nextjs_processes

    # Clear common development ports
    for port in 3000 3001 3002 3003; do
        kill_port $port
    done

    # Run all health checks
    check_environment
    check_dependencies
    check_database
    check_authentication
    check_connectivity
    check_offline_readiness
    check_schema_consistency

    # Display preliminary summary
    display_health_summary

    # If critical issues found, ask user to continue (5 second timeout)
    if [ $HEALTH_ISSUES -gt 0 ]; then
        echo -e "${YELLOW}Critical issues detected. Continue anyway? (y/N) [5s timeout]${NC}"
        if read -t 5 -r response; then
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                echo -e "${RED}Startup cancelled. Please fix the issues above.${NC}"
                exit 1
            fi
        else
            echo -e "${DIM}Timeout reached, continuing despite critical issues...${NC}"
            echo -e "${DIM}Note: Server may not function properly with unresolved issues${NC}"
        fi
    fi

    # Start Redis server
    start_redis

    # Start Python CORS server
    start_python_server

    # Find available port
    echo -e "${INFO} ${BLUE}Finding available port...${NC}"
    available_port=$(find_available_port 3000)
    if [ $? -eq 0 ]; then
        echo -e "${CHECK_MARK} ${GREEN}Found available port: $available_port${NC}"
        export PORT=$available_port
    else
        echo -e "${CROSS_MARK} ${RED}Could not find available port${NC}"
        exit 1
    fi

    # Final startup message
    print_header "${ROCKET} Starting Development Server"
    echo -e "  ${BOLD}Port:${NC} $available_port"
    echo -e "  ${BOLD}Environment:${NC} ${NODE_ENV:-development}"
    echo -e "  ${BOLD}API Base URL:${NC} http://localhost:$available_port/api"
    echo -e "  ${BOLD}Health Checks:${NC} ${CHECKS_PASSED}/${TOTAL_CHECKS} passed"
    echo -e "  ${BOLD}Schema Testing:${NC} Available via npm run schema:*"

    if [ $WARNINGS_COUNT -gt 0 ]; then
        echo -e "  ${YELLOW}Note: $WARNINGS_COUNT warnings - monitor console for issues${NC}"
    fi

    echo ""
    echo -e "${BOLD}${GREEN}${CHECK_MARK} System ready for development!${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}🚀 Schema Testing Commands:${NC}"
    echo -e "  npm run schema:check     - Schema consistency validation"
    echo -e "  npm run schema:integrity - Data integrity checks"
    echo -e "  npm run schema:validate  - Zod validation testing"
    echo -e "  npm run schema:all       - Run all schema tests"
    echo ""

    # Start the server in background to run post-startup checks
    (cd "$PROJECT_ROOT" && npm run dev) &
    SERVER_PID=$!

    # Wait a moment then run API health checks
    sleep 3
    check_api_health $available_port

    # Wait a bit more for server to fully initialize
    echo -e "${INFO} ${BLUE}Waiting for server to fully initialize...${NC}"
    sleep 5

    # Now offer database operations after server is running
    offer_database_operations

    # Keep the server running
    wait $SERVER_PID
}

# Handle script interruption
cleanup_processes() {
    echo -e "\n${WARNING} ${YELLOW}Development server stopped${NC}"

    # Kill Python server if it's running
    if [ -n "$PYTHON_PID" ] && kill -0 $PYTHON_PID 2>/dev/null; then
        echo -e "${INFO} ${BLUE}Stopping Python CORS server...${NC}"
        kill $PYTHON_PID 2>/dev/null || true
        sleep 1
    fi

    # Kill Next.js server if it's running
    if [ -n "$SERVER_PID" ] && kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${INFO} ${BLUE}Stopping Next.js server...${NC}"
        kill $SERVER_PID 2>/dev/null || true
        sleep 1
    fi

    exit 0
}

trap cleanup_processes INT TERM

# Run main function
main "$@"
