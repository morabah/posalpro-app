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

# Function to test database connectivity
check_database() {
    print_header "${DATABASE} Database Health Check"

    # Check if PostgreSQL is running
    if brew services list | grep -q "postgresql.*started"; then
        print_check "pass" "PostgreSQL service is running"
    else
        print_check "fail" "PostgreSQL service is not running" "Run: brew services start postgresql"
        return
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

    # Check Node version
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

# Function to offer database seeding
offer_database_seeding() {
    if [ $WARNINGS_COUNT -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Would you like to seed the database now? This will add sample users and data. (y/N)${NC}"
        read -r seed_response
        if [[ "$seed_response" =~ ^[Yy]$ ]]; then
            echo -e "${INFO} ${BLUE}Seeding database...${NC}"
            if npm run db:seed >/dev/null 2>&1; then
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
        fi
    fi
}

# Main execution function
main() {
    clear
    echo -e "${BOLD}${PURPLE}${ROCKET} PosalPro MVP2 - Smart Development Health Check${NC}"
    echo -e "${DIM}Comprehensive system validation and startup${NC}"
    echo ""

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

    # Display preliminary summary
    display_health_summary

    # Offer database seeding if there are warnings
    offer_database_seeding

    # If critical issues found, ask user to continue
    if [ $HEALTH_ISSUES -gt 0 ]; then
        echo -e "${YELLOW}Critical issues detected. Continue anyway? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo -e "${RED}Startup cancelled. Please fix the issues above.${NC}"
            exit 1
        fi
    fi

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

    if [ $WARNINGS_COUNT -gt 0 ]; then
        echo -e "  ${YELLOW}Note: $WARNINGS_COUNT warnings - monitor console for issues${NC}"
    fi

    echo ""
    echo -e "${BOLD}${GREEN}${CHECK_MARK} System ready for development!${NC}"
    echo ""

    # Start the server in background to run post-startup checks
    npm run dev &
    SERVER_PID=$!

    # Wait a moment then run API health checks
    sleep 3
    check_api_health $available_port

    # Keep the server running
    wait $SERVER_PID
}

# Handle script interruption
trap 'echo -e "\n${WARNING} ${YELLOW}Development server stopped${NC}"; exit 0' INT TERM

# Run main function
main "$@"
