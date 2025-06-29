#!/bin/bash

# Proactive Error Monitor - Real-time error detection and reporting
echo "🔍 PROACTIVE ERROR MONITOR - Real-time Detection"
echo "================================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
MONITOR_INTERVAL=5
LOG_FILE="server.log"
ERROR_THRESHOLD=3
CONSECUTIVE_ERRORS=0

echo -e "${BLUE}Starting real-time error monitoring...${NC}"
echo "Monitor interval: ${MONITOR_INTERVAL}s"
echo "Error threshold: ${ERROR_THRESHOLD} consecutive errors"
echo "Monitoring log file: ${LOG_FILE}"
echo ""

# Function to check for specific error patterns
check_errors() {
    local current_time=$(date '+%Y-%m-%d %H:%M:%S')
    local errors_found=0

    if [ -f "$LOG_FILE" ]; then
        # Get last 10 lines to check for recent errors
        local recent_logs=$(tail -10 "$LOG_FILE" 2>/dev/null)

        # Check for specific error patterns
        if echo "$recent_logs" | grep -q "logData.message.trim is not a function"; then
            echo -e "${RED}❌ [$current_time] ErrorInterceptor .trim() error detected${NC}"
            errors_found=$((errors_found + 1))
        fi

        if echo "$recent_logs" | grep -q "Unknown field.*deadline"; then
            echo -e "${RED}❌ [$current_time] Prisma schema error: 'deadline' field${NC}"
            errors_found=$((errors_found + 1))
        fi

        if echo "$recent_logs" | grep -q "Unknown field.*company"; then
            echo -e "${RED}❌ [$current_time] Prisma schema error: 'company' field${NC}"
            errors_found=$((errors_found + 1))
        fi

        if echo "$recent_logs" | grep -q "Unknown field.*role.*User"; then
            echo -e "${RED}❌ [$current_time] Prisma schema error: 'role' field in User${NC}"
            errors_found=$((errors_found + 1))
        fi

        if echo "$recent_logs" | grep -q "Unknown field.*activities"; then
            echo -e "${RED}❌ [$current_time] Prisma schema error: 'activities' field${NC}"
            errors_found=$((errors_found + 1))
        fi

        if echo "$recent_logs" | grep -q "items.map is not a function"; then
            echo -e "${RED}❌ [$current_time] React component error: items.map${NC}"
            errors_found=$((errors_found + 1))
        fi

        if echo "$recent_logs" | grep -q "PrismaClientValidationError"; then
            echo -e "${RED}❌ [$current_time] Prisma validation error detected${NC}"
            errors_found=$((errors_found + 1))
        fi

        if echo "$recent_logs" | grep -q "TypeError.*trim"; then
            echo -e "${RED}❌ [$current_time] TypeError with .trim() method${NC}"
            errors_found=$((errors_found + 1))
        fi

        # Check for successful operations
        if echo "$recent_logs" | grep -q "200 in.*ms"; then
            if [ $errors_found -eq 0 ]; then
                echo -e "${GREEN}✅ [$current_time] API responses healthy${NC}"
            fi
        fi

    else
        echo -e "${YELLOW}⚠️ [$current_time] Log file not found: $LOG_FILE${NC}"
    fi

    return $errors_found
}

# Function to test API endpoints
test_endpoints() {
    local current_time=$(date '+%Y-%m-%d %H:%M:%S')
    local endpoint_errors=0

    # Test critical endpoints
    local endpoints=("/api/health" "/api/proposals?limit=5" "/api/customers?limit=5")

    for endpoint in "${endpoints[@]}"; do
        if ! curl -s "http://localhost:3000$endpoint" > /dev/null 2>&1; then
            echo -e "${RED}❌ [$current_time] API endpoint failed: $endpoint${NC}"
            endpoint_errors=$((endpoint_errors + 1))
        fi
    done

    if [ $endpoint_errors -eq 0 ]; then
        echo -e "${GREEN}✅ [$current_time] All API endpoints responding${NC}"
    fi

    return $endpoint_errors
}

# Function to check browser console errors
check_browser_errors() {
    local current_time=$(date '+%Y-%m-%d %H:%M:%S')

    # This would integrate with browser automation tools in a real scenario
    # For now, we'll check for common patterns that indicate browser errors
    if [ -f "$LOG_FILE" ]; then
        local recent_logs=$(tail -20 "$LOG_FILE" 2>/dev/null)

        if echo "$recent_logs" | grep -q "Failed to load resource.*500"; then
            echo -e "${RED}❌ [$current_time] Browser: 500 Internal Server Error${NC}"
            return 1
        fi

        if echo "$recent_logs" | grep -q "TypeError.*Cannot read properties"; then
            echo -e "${RED}❌ [$current_time] Browser: TypeError in JavaScript${NC}"
            return 1
        fi
    fi

    return 0
}

# Main monitoring loop
echo -e "${BLUE}🚀 Starting continuous monitoring...${NC}"
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
    # Check for errors
    check_errors
    error_count=$?

    # Test API endpoints every 3rd check
    if [ $(($(date +%s) % 15)) -eq 0 ]; then
        test_endpoints
        endpoint_error_count=$?
        error_count=$((error_count + endpoint_error_count))
    fi

    # Check browser errors
    check_browser_errors
    browser_error_count=$?
    error_count=$((error_count + browser_error_count))

    # Track consecutive errors
    if [ $error_count -gt 0 ]; then
        CONSECUTIVE_ERRORS=$((CONSECUTIVE_ERRORS + 1))

        if [ $CONSECUTIVE_ERRORS -ge $ERROR_THRESHOLD ]; then
            echo -e "${RED}🚨 ALERT: $CONSECUTIVE_ERRORS consecutive error cycles detected!${NC}"
            echo -e "${YELLOW}🔧 Recommended actions:${NC}"
            echo "   1. Check server logs: tail -50 $LOG_FILE"
            echo "   2. Restart development server: npm run dev:smart"
            echo "   3. Clear browser cache and reload"
            echo "   4. Run diagnostic script: ./scripts/comprehensive-error-diagnosis.sh"
            echo ""
        fi
    else
        CONSECUTIVE_ERRORS=0
        echo -e "${GREEN}💚 System healthy - no errors detected${NC}"
    fi

    # Sleep before next check
    sleep $MONITOR_INTERVAL
done
