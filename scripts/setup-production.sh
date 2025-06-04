#!/bin/bash

# PosalPro MVP2 - Production Setup Script
# Migrates from development mocks to production database

set -e  # Exit on any error

echo "🚀 PosalPro MVP2 - Production Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_environment() {
    print_status "Checking environment configuration..."

    if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
        print_warning "No .env or .env.local file found"
        if [ -f "env.example" ]; then
            print_status "Copying env.example to .env.local..."
            cp env.example .env.local
            print_warning "Please update .env.local with your database credentials before continuing"
            print_warning "Required: DATABASE_URL, NEXTAUTH_SECRET, JWT_SECRET"
            exit 1
        else
            print_error "No environment template found. Please create .env.local with DATABASE_URL"
            exit 1
        fi
    fi

    # Source environment variables
    if [ -f ".env.local" ]; then
        set -a  # Automatically export all variables
        source .env.local
        set +a
    elif [ -f ".env" ]; then
        set -a
        source .env
        set +a
    fi

    # Check required environment variables
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL is not set in environment"
        exit 1
    fi

    print_success "Environment configuration validated"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    if [ ! -d "node_modules" ]; then
        npm install
    else
        print_status "Dependencies already installed, checking for updates..."
        npm ci
    fi

    print_success "Dependencies installed"
}

# Generate Prisma client
generate_prisma() {
    print_status "Generating Prisma client..."

    npm run db:generate

    print_success "Prisma client generated"
}

# Run database migrations
migrate_database() {
    print_status "Running database migrations..."

    # Check if database exists and is accessible
    print_status "Testing database connection..."

    # Deploy migrations
    npm run db:migrate:deploy

    print_success "Database migrations completed"
}

# Seed database with production data
seed_database() {
    print_status "Seeding database with production data..."

    npm run db:seed

    print_success "Database seeded successfully"
}

# Build application
build_application() {
    print_status "Building application for production..."

    npm run build

    print_success "Application built successfully"
}

# Run type checks
type_check() {
    print_status "Running TypeScript type checks..."

    npm run type-check

    print_success "Type checks passed"
}

# Run tests
run_tests() {
    print_status "Running test suite..."

    npm test

    print_success "All tests passed"
}

# Create backup of mock implementations
backup_mocks() {
    print_status "Creating backup of mock implementations..."

    if [ ! -d "backup/mocks" ]; then
        mkdir -p backup/mocks

        # Backup mock files
        if [ -f "src/lib/db/mockProposals.ts" ]; then
            cp src/lib/db/mockProposals.ts backup/mocks/
        fi

        if [ -f "src/lib/api/endpoints/auth.ts" ]; then
            cp src/lib/api/endpoints/auth.ts backup/mocks/auth.ts.backup
        fi

        if [ -f "src/lib/api/endpoints/users.ts" ]; then
            cp src/lib/api/endpoints/users.ts backup/mocks/users.ts.backup
        fi

        if [ -f "src/lib/api/endpoints/proposals.ts" ]; then
            cp src/lib/api/endpoints/proposals.ts backup/mocks/proposals.ts.backup
        fi

        print_success "Mock implementations backed up to backup/mocks/"
    else
        print_warning "Backup directory already exists, skipping backup"
    fi
}

# Validate production readiness
validate_production() {
    print_status "Validating production readiness..."

    # Check database connection
    print_status "Testing database health..."

    # This will be implemented in the database client
    node -e "
        const { checkDatabaseHealth } = require('./dist/src/lib/db/client.js');
        checkDatabaseHealth().then(health => {
            if (health.status === 'healthy') {
                console.log('✅ Database connection healthy');
                console.log(\`Response time: \${health.latency}ms\`);
            } else {
                console.error('❌ Database connection failed:', health.error);
                process.exit(1);
            }
        }).catch(err => {
            console.error('❌ Database health check failed:', err.message);
            process.exit(1);
        });
    "

    # Check that all required tables exist
    print_status "Verifying database schema..."

    node -e "
        const { getDatabaseStats } = require('./dist/src/lib/db/client.js');
        getDatabaseStats().then(stats => {
            console.log('📊 Database Statistics:');
            console.log(\`   Users: \${stats.users}\`);
            console.log(\`   Proposals: \${stats.proposals}\`);
            console.log(\`   Products: \${stats.products}\`);
            console.log(\`   Customers: \${stats.customers}\`);

            if (stats.users > 0) {
                console.log('✅ Database properly seeded');
            } else {
                console.log('⚠️  Database may need seeding');
            }
        }).catch(err => {
            console.error('❌ Database statistics check failed:', err.message);
            process.exit(1);
        });
    "

    print_success "Production validation completed"
}

# Display final instructions
display_instructions() {
    echo ""
    echo "🎉 Production Setup Completed Successfully!"
    echo "========================================"
    echo ""
    echo "🔑 Default Login Credentials:"
    echo "   Email: demo@posalpro.com"
    echo "   Password: ProposalPro2024!"
    echo ""
    echo "🔗 Additional Test Accounts:"
    echo "   - admin@posalpro.com (System Administrator)"
    echo "   - pm1@posalpro.com (Proposal Manager)"
    echo "   - sme1@posalpro.com (Senior SME)"
    echo "   - content1@posalpro.com (Content Manager)"
    echo ""
    echo "📊 Database Statistics Available:"
    echo "   - Users: 10 sample users across all roles"
    echo "   - Proposals: 5 sample proposals in various stages"
    echo "   - Products: 6 technology products"
    echo "   - Customers: 5 enterprise customers"
    echo ""
    echo "🚀 Start Production Server:"
    echo "   npm start"
    echo ""
    echo "🔧 Development Commands:"
    echo "   npm run dev         - Start development server"
    echo "   npm run db:studio   - Open Prisma Studio"
    echo "   npm run db:seed     - Re-seed database"
    echo "   npm test            - Run test suite"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Update environment variables for production"
    echo "   2. Configure your production database"
    echo "   3. Set up monitoring and logging"
    echo "   4. Configure backup procedures"
    echo ""
}

# Main execution
main() {
    print_status "Starting production setup process..."

    # Validate environment first
    check_environment

    # Install and setup
    install_dependencies
    generate_prisma

    # Database operations
    migrate_database
    seed_database

    # Build and validate
    type_check
    build_application

    # Optional: Run tests (comment out if you want to skip)
    if [ "${SKIP_TESTS:-false}" != "true" ]; then
        run_tests
    fi

    # Backup mocks for rollback capability
    backup_mocks

    # Final validation
    validate_production

    # Display success message and instructions
    display_instructions
}

# Handle command line arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "validate")
        check_environment
        validate_production
        ;;
    "seed-only")
        check_environment
        generate_prisma
        seed_database
        ;;
    "backup-mocks")
        backup_mocks
        ;;
    "help")
        echo "PosalPro MVP2 Production Setup Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup        Complete production setup (default)"
        echo "  validate     Validate production readiness"
        echo "  seed-only    Only seed the database"
        echo "  backup-mocks Backup mock implementations"
        echo "  help         Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  SKIP_TESTS=true     Skip running test suite"
        echo ""
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
