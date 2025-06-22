#!/bin/bash

# PosalPro MVP2 Enhanced Deployment Script
# Handles version bumping, building, deploying, and tracking

set -e  # Exit on any error

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

# Function to show usage
show_usage() {
    echo "PosalPro MVP2 Deployment Script"
    echo ""
    echo "Usage: $0 <deployment_type> [options]"
    echo ""
    echo "Deployment Types:"
    echo "  alpha     - Alpha release (0.1.0-alpha.1 → 0.1.0-alpha.2)"
    echo "  beta      - Beta release (0.1.0-beta.1 → 0.1.0-beta.2)"
    echo "  rc        - Release candidate (0.1.0-rc.1 → 0.1.0-rc.2)"
    echo "  patch     - Production patch (0.1.0 → 0.1.1)"
    echo "  minor     - Minor release (0.1.0 → 0.2.0)"
    echo "  major     - Major release (0.1.0 → 1.0.0)"
    echo "  staging   - Staging deployment (no version bump)"
    echo ""
    echo "Options:"
    echo "  --skip-build    Skip the build step"
    echo "  --dry-run       Show what would be done without executing"
    echo "  --info          Show deployment information"
    echo ""
    echo "Examples:"
    echo "  $0 alpha                    # Deploy alpha version"
    echo "  $0 patch --dry-run          # Show what patch deployment would do"
    echo "  $0 staging --skip-build     # Deploy to staging without rebuilding"
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -f "next.config.js" ]; then
        print_error "This doesn't appear to be the PosalPro MVP2 project root"
        exit 1
    fi
}

# Function to check git status
check_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes:"
        git status --short
        echo ""
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled"
            exit 1
        fi
    fi
}

# Function to get current version
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to bump version
bump_version() {
    local type=$1
    local current_version=$(get_current_version)

    print_status "Current version: $current_version"

    case $type in
        alpha)
            npm version prerelease --preid=alpha --no-git-tag-version
            ;;
        beta)
            npm version prerelease --preid=beta --no-git-tag-version
            ;;
        rc)
            npm version prerelease --preid=rc --no-git-tag-version
            ;;
        patch)
            npm version patch --no-git-tag-version
            ;;
        minor)
            npm version minor --no-git-tag-version
            ;;
        major)
            npm version major --no-git-tag-version
            ;;
        staging)
            print_status "Staging deployment - no version bump"
            return 0
            ;;
        *)
            print_error "Invalid version type: $type"
            exit 1
            ;;
    esac

    local new_version=$(get_current_version)
    print_success "Version bumped to: $new_version"
}

# Function to build the application
build_app() {
    print_status "Building application..."

    # Clean previous build
    rm -rf .next

    # Run quality checks
    print_status "Running quality checks..."
    npm run type-check

    # Build the application
    npm run build

    print_success "Build completed successfully"
}

# Function to deploy to Netlify
deploy_to_netlify() {
    local is_production=$1
    local version=$(get_current_version)

    print_status "Deploying version $version to Netlify..."

    if [ "$is_production" = "true" ]; then
        npx netlify deploy --prod
        print_success "Deployed to production: https://posalpro-mvp2.windsurf.build"
    else
        npx netlify deploy
        print_success "Deployed to staging"
    fi
}

# Function to record deployment
record_deployment() {
    local type=$1
    local environment=$2

    node scripts/deployment-info.js --add-deployment --type "$type" --env "$environment"
}

# Function to commit version changes
commit_version() {
    local type=$1
    local version=$(get_current_version)

    if [ "$type" != "staging" ]; then
        git add package.json
        git commit -m "🚀 Bump version to $version for $type deployment

- Version: $version
- Type: $type deployment
- Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- Branch: $(git rev-parse --abbrev-ref HEAD)

[skip ci]"

        # Create git tag
        git tag "v$version"

        print_success "Created commit and tag for version $version"
    fi
}

# Function to push changes
push_changes() {
    local type=$1

    if [ "$type" != "staging" ]; then
        print_status "Pushing changes to remote repository..."
        git push origin main
        git push origin --tags
        print_success "Changes pushed to remote repository"
    fi
}

# Main deployment function
deploy() {
    local type=$1
    local skip_build=$2
    local dry_run=$3

    local environment="production"
    if [ "$type" = "staging" ]; then
        environment="staging"
    fi

    print_status "Starting $type deployment..."

    if [ "$dry_run" = "true" ]; then
        print_warning "DRY RUN MODE - No changes will be made"
        echo ""
        echo "Would perform the following actions:"
        echo "1. Check git status and directory"
        echo "2. Bump version from $(get_current_version) ($type)"
        echo "3. Build application (unless --skip-build)"
        echo "4. Deploy to $environment"
        echo "5. Record deployment in history"
        echo "6. Commit and tag version (unless staging)"
        echo "7. Push changes to remote (unless staging)"
        return 0
    fi

    # Pre-deployment checks
    check_directory
    check_git_status

    # Version management
    bump_version "$type"

    # Build application
    if [ "$skip_build" != "true" ]; then
        build_app
    else
        print_warning "Skipping build step"
    fi

    # Deploy
    local is_production="false"
    if [ "$environment" = "production" ]; then
        is_production="true"
    fi

    deploy_to_netlify "$is_production"

    # Post-deployment tasks
    record_deployment "$type" "$environment"
    commit_version "$type"
    push_changes "$type"

    # Show final status
    local final_version=$(get_current_version)
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "   Version: $final_version"
    echo "   Type: $type"
    echo "   Environment: $environment"
    echo "   Timestamp: $(date)"
    if [ "$environment" = "production" ]; then
        echo "   URL: https://posalpro-mvp2.windsurf.build"
    fi
    echo ""
    echo "📝 Next steps:"
    echo "   - Test the deployment"
    echo "   - Check deployment info: npm run deployment:info"
    echo "   - Monitor application health"
}

# Parse command line arguments
DEPLOYMENT_TYPE=""
SKIP_BUILD=false
DRY_RUN=false
SHOW_INFO=false

while [[ $# -gt 0 ]]; do
    case $1 in
        alpha|beta|rc|patch|minor|major|staging)
            DEPLOYMENT_TYPE="$1"
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --info)
            SHOW_INFO=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Show info if requested
if [ "$SHOW_INFO" = "true" ]; then
    node scripts/deployment-info.js
    exit 0
fi

# Validate deployment type
if [ -z "$DEPLOYMENT_TYPE" ]; then
    print_error "Deployment type is required"
    show_usage
    exit 1
fi

# Execute deployment
deploy "$DEPLOYMENT_TYPE" "$SKIP_BUILD" "$DRY_RUN"
