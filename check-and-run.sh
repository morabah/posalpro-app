#!/bin/bash

# check-and-run.sh - Utility script to safely run npm commands
# Usage: ./check-and-run.sh [npm-script-name]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

print_info() {
    echo -e "ℹ️  INFO: $1"
}

# Check if command argument provided
if [ $# -eq 0 ]; then
    print_error "No npm script specified"
    echo "Usage: ./check-and-run.sh [npm-script-name]"
    echo "Examples:"
    echo "  ./check-and-run.sh dev:enhanced"
    echo "  ./check-and-run.sh quality:check"
    echo "  ./check-and-run.sh pre-commit"
    exit 1
fi

SCRIPT_NAME=$1

print_info "Phase 1.5 Command Safety Check"
echo "================================"

# Check 1: Verify we're in the posalpro-app directory
print_info "Checking directory location..."
CURRENT_DIR=$(basename "$(pwd)")
if [ "$CURRENT_DIR" != "posalpro-app" ]; then
    print_error "You're not in the posalpro-app directory!"
    echo "Current directory: $(pwd)"
    echo "Expected to be in: .../MVP2/posalpro-app"
    echo ""
    print_info "To fix this, run:"
    echo "cd posalpro-app"
    exit 1
fi
print_success "Directory check passed (in posalpro-app)"

# Check 2: Verify package.json exists
print_info "Checking for package.json..."
if [ ! -f "package.json" ]; then
    print_error "package.json not found in current directory"
    echo "This suggests you're not in the correct project directory"
    exit 1
fi
print_success "package.json found"

# Check 3: Verify the script exists in package.json
print_info "Checking if script '$SCRIPT_NAME' exists..."
if ! npm run | grep -q "^  $SCRIPT_NAME$"; then
    print_error "npm script '$SCRIPT_NAME' not found"
    echo "Available scripts:"
    npm run 2>/dev/null | grep "^  " | head -10
    exit 1
fi
print_success "Script '$SCRIPT_NAME' found"

# Check 4: Verify node_modules exists
print_info "Checking for node_modules..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found"
    print_info "Running npm install..."
    npm install
    print_success "Dependencies installed"
else
    print_success "node_modules directory found"
fi

# Check 5: For dev commands, check if port 3000 is available
if [[ "$SCRIPT_NAME" == *"dev"* ]]; then
    print_info "Checking port 3000 availability..."
    if lsof -ti:3000 > /dev/null 2>&1; then
        print_warning "Port 3000 is already in use"
        echo "You may need to stop other processes or use a different port"
        echo "To kill existing process: kill \$(lsof -ti:3000)"
    else
        print_success "Port 3000 is available"
    fi
fi

# Check 6: For enhanced dev command, check .env.local
if [ "$SCRIPT_NAME" = "dev:enhanced" ]; then
    print_info "Checking for .env.local..."
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local not found"
        print_info "Creating basic .env.local file..."
        cat > .env.local << EOF
# Basic environment variables for development
DATABASE_URL=postgresql://user:password@localhost:5432/posalpro
JWT_SECRET=dev-secret-key-change-in-production
API_KEY=dev-api-key
API_BASE_URL=http://localhost:3000/api
EOF
        print_success ".env.local created with default values"
    else
        print_success ".env.local found"
    fi
fi

echo ""
print_info "All checks passed! Running: npm run $SCRIPT_NAME"
echo "================================"

# Run the npm command
npm run "$SCRIPT_NAME"

# Success message
echo ""
print_success "Command completed successfully!"

# Additional info for specific commands
case "$SCRIPT_NAME" in
    "dev:enhanced")
        echo ""
        print_info "Development server is running!"
        echo "🌐 Application: http://localhost:3000"
        echo "📊 Dashboard: http://localhost:3000/dev-dashboard" 
        echo "🧪 Test API: http://localhost:3000/test-env-api"
        ;;
    "quality:check")
        echo ""
        print_info "Quality check completed!"
        echo "If issues were found, run: ./check-and-run.sh quality:fix"
        ;;
    "pre-commit")
        echo ""
        print_success "Pre-commit validation passed!"
        echo "You can now safely commit your changes:"
        echo "git add . && git commit -m 'your commit message'"
        ;;
esac 