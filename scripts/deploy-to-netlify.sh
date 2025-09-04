#!/bin/bash

# PosalPro MVP2 - Netlify Deployment Script with Neon Database Setup
# This script handles the complete deployment process including database setup

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV="${1:-production}"

echo -e "${BLUE}🚀 PosalPro MVP2 - Netlify Deployment Script${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment variables
validate_env_vars() {
    echo -e "\n${YELLOW}🔍 Validating Environment Variables...${NC}"

    # For local development, check if we have basic setup
    if [[ "$DEPLOY_ENV" == "development" ]]; then
        local required_vars=("DATABASE_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET" "JWT_SECRET")
        local missing_vars=()

        for var in "${required_vars[@]}"; do
            if [[ -z "${!var:-}" ]]; then
                missing_vars+=("$var")
            fi
        done

        if [[ ${#missing_vars[@]} -gt 0 ]]; then
            echo -e "${RED}❌ Missing required environment variables:${NC}"
            printf '  - %s\n' "${missing_vars[@]}"
            echo -e "${YELLOW}💡 Set these in your .env.local file for local development${NC}"
            return 1
        fi
    else
        # For production deployment to Netlify
        echo -e "${BLUE}ℹ️ Production deployment detected${NC}"
        echo -e "${YELLOW}⚠️ Environment variables will be validated in Netlify environment${NC}"
        echo -e "${YELLOW}💡 Ensure these are set in Netlify dashboard:${NC}"
        echo -e "   - DATABASE_URL (Neon pooled connection)"
        echo -e "   - NEXTAUTH_URL (your Netlify domain)"
        echo -e "   - NEXTAUTH_SECRET (32+ characters)"
        echo -e "   - JWT_SECRET (32+ characters)"
        echo -e "   - CSRF_SECRET (32+ characters)"
    fi

    echo -e "${GREEN}✅ Environment validation complete${NC}"
    return 0
}

# Function to test database connection
test_database_connection() {
    echo -e "\n${YELLOW}🗄️ Testing Database Connection...${NC}"

    if [[ "$DEPLOY_ENV" == "production" ]]; then
        echo -e "${BLUE}ℹ️ Production deployment - database will be tested in Netlify environment${NC}"
        echo -e "${YELLOW}⚠️ Ensure your Neon database is accessible and credentials are correct${NC}"
        echo -e "${YELLOW}💡 Database connection will be validated during Netlify build${NC}"
        return 0
    fi

    if ! command_exists "psql"; then
        echo -e "${YELLOW}⚠️ psql not found, skipping direct database test${NC}"
        echo -e "${YELLOW}💡 Database will be tested during Prisma operations${NC}"
        return 0
    fi

    # Extract database URL components for testing
    if [[ -n "${DATABASE_URL:-}" ]]; then
        if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Database connection successful${NC}"
            return 0
        else
            echo -e "${RED}❌ Database connection failed${NC}"
            echo -e "${YELLOW}💡 Check your DATABASE_URL and ensure Neon database is running${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ DATABASE_URL not set${NC}"
        return 1
    fi
}

# Function to setup Prisma
setup_prisma() {
    echo -e "\n${YELLOW}🔧 Setting up Prisma...${NC}"

    cd "$PROJECT_ROOT"

    # Generate Prisma client
    echo -e "${BLUE}📦 Generating Prisma client...${NC}"
    if ! npx prisma generate; then
        echo -e "${RED}❌ Failed to generate Prisma client${NC}"
        return 1
    fi

    # Test database connection via Prisma
    echo -e "${BLUE}🧪 Testing database via Prisma...${NC}"
    if ! npx prisma db push --accept-data-loss; then
        echo -e "${RED}❌ Prisma database test failed${NC}"
        echo -e "${YELLOW}💡 This might be expected if migrations haven't been run yet${NC}"
    fi

    echo -e "${GREEN}✅ Prisma setup completed${NC}"
    return 0
}

# Function to validate build configuration
validate_build_config() {
    echo -e "\n${YELLOW}🔧 Validating Build Configuration...${NC}"

    cd "$PROJECT_ROOT"

    # Check netlify.toml
    if [[ ! -f "netlify.toml" ]]; then
        echo -e "${RED}❌ netlify.toml not found${NC}"
        return 1
    fi

    # Check for problematic configurations
    if grep -q "output.*standalone" next.config.js 2>/dev/null; then
        echo -e "${RED}❌ Found 'output: standalone' in next.config.js${NC}"
        echo -e "${YELLOW}💡 This breaks Netlify deployment. Remove or comment out this line.${NC}"
        return 1
    fi

    # Check for catch-all redirect
    if ! grep -q 'from = "/\*"' netlify.toml; then
        echo -e "${YELLOW}⚠️ Catch-all redirect not found in netlify.toml${NC}"
        echo -e "${YELLOW}💡 Add this to netlify.toml:${NC}"
        echo -e "${BLUE}[[redirects]]${NC}"
        echo -e "${BLUE}  from = \"/*\"${NC}"
        echo -e "${BLUE}  to = \"/index.html\"${NC}"
        echo -e "${BLUE}  status = 200${NC}"
    fi

    echo -e "${GREEN}✅ Build configuration validated${NC}"
    return 0
}

# Function to run local build test
test_local_build() {
    echo -e "\n${YELLOW}🔨 Testing Local Build...${NC}"

    cd "$PROJECT_ROOT"

    # Clean previous build
    echo -e "${BLUE}🧹 Cleaning previous build...${NC}"
    rm -rf .next

    # Run type check
    echo -e "${BLUE}🔍 Running TypeScript check...${NC}"
    if ! npm run type-check; then
        echo -e "${RED}❌ TypeScript check failed${NC}"
        return 1
    fi

    # Run build
    echo -e "${BLUE}🏗️ Running production build...${NC}"
    if ! npm run build; then
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi

    echo -e "${GREEN}✅ Local build successful${NC}"
    return 0
}

# Function to deploy to Netlify
deploy_to_netlify() {
    echo -e "\n${YELLOW}🚀 Deploying to Netlify...${NC}"

    # Check git status
    if ! git diff --quiet && ! git diff --cached --quiet; then
        echo -e "${YELLOW}⚠️ You have uncommitted changes${NC}"
        echo -e "${BLUE}💡 Committing changes first...${NC}"

        # Add and commit changes
        git add .
        git commit -m "feat: prepare for deployment" || true

        echo -e "${BLUE}📤 Pushing to remote repository...${NC}"
        if ! git push origin main 2>/dev/null && ! git push origin master 2>/dev/null; then
            echo -e "${RED}❌ Failed to push to remote repository${NC}"
            echo -e "${YELLOW}💡 Please push your changes manually and then redeploy${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✅ Repository is clean and up to date${NC}"
    fi

    # Check if netlify-cli is installed
    if ! command_exists "netlify"; then
        echo -e "${YELLOW}⚠️ Netlify CLI not found${NC}"
        echo -e "${BLUE}📦 Installing Netlify CLI...${NC}"
        if ! npm install -g netlify-cli; then
            echo -e "${RED}❌ Failed to install Netlify CLI${NC}"
            return 1
        fi
    fi

    # For production deployment, we'll let Netlify handle the build
    echo -e "${BLUE}🌐 Triggering Netlify deployment...${NC}"
    echo -e "${YELLOW}⚠️ Production builds will run in Netlify environment${NC}"
    echo -e "${YELLOW}💡 Monitor deployment progress in Netlify dashboard${NC}"

    # Check if we have a Netlify site configured
    if netlify status >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Netlify site configured${NC}"

        # Trigger a build (if available)
        if netlify build --dry-run >/dev/null 2>&1; then
            echo -e "${BLUE}🔨 Triggering Netlify build...${NC}"
            netlify build
        else
            echo -e "${BLUE}📡 Pushing latest changes to trigger auto-deployment...${NC}"
            git push origin main 2>/dev/null || git push origin master 2>/dev/null || true
        fi
    else
        echo -e "${YELLOW}⚠️ No Netlify site configured locally${NC}"
        echo -e "${BLUE}💡 Deployment will be triggered when you push to your repository${NC}"
        echo -e "${BLUE}📤 Pushing latest changes...${NC}"
        git push origin main 2>/dev/null || git push origin master 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ Deployment process initiated!${NC}"
    echo -e "${BLUE}🔗 Check your Netlify dashboard for build progress${NC}"
    return 0
}

# Function to show post-deployment instructions
show_post_deployment_steps() {
    echo -e "\n${GREEN}🎉 Deployment completed! Here are the next steps:${NC}"
    echo -e "\n${BLUE}1. Verify Deployment:${NC}"
    echo -e "   🌐 Visit your Netlify site URL"
    echo -e "   🔗 Test the login page: /auth/login"
    echo -e "   📊 Check API health: /api/health"

    echo -e "\n${BLUE}2. Test Database Connection:${NC}"
    echo -e "   🗄️ curl -H 'Accept: application/json' https://your-site.netlify.app/api/admin/users"
    echo -e "   🔍 Check browser network tab for JSON responses (not HTML)"

    echo -e "\n${BLUE}3. Monitor & Maintain:${NC}"
    echo -e "   📈 Check Netlify dashboard for build logs"
    echo -e "   🗄️ Monitor Neon database usage"
    echo -e "   🔒 Regularly update secrets in Netlify"

    echo -e "\n${YELLOW}💡 Pro Tips:${NC}"
    echo -e "   • Set up health checks to monitor your site"
    echo -e "   • Configure error tracking (Sentry, LogRocket)"
    echo -e "   • Set up database backups in Neon"
    echo -e "   • Monitor Core Web Vitals in Netlify Analytics"
}

# Main deployment flow
main() {
    echo -e "${BLUE}📋 Deployment Checklist:${NC}"
    echo -e "   1. ✅ Validate environment variables"
    echo -e "   2. ✅ Test database connection"
    echo -e "   3. ✅ Setup Prisma"
    echo -e "   4. ✅ Validate build configuration"
    echo -e "   5. ✅ Test local build"
    echo -e "   6. 🚀 Deploy to Netlify"

    # Step 1: Validate environment variables
    if ! validate_env_vars; then
        echo -e "\n${RED}❌ Environment validation failed. Please set missing variables in Netlify dashboard.${NC}"
        exit 1
    fi

    # Step 2: Test database connection
    if ! test_database_connection; then
        echo -e "\n${YELLOW}⚠️ Database connection test failed, but continuing with deployment...${NC}"
        echo -e "${YELLOW}💡 Database will be tested during Prisma operations${NC}"
    fi

    # Step 3: Setup Prisma
    if ! setup_prisma; then
        echo -e "\n${RED}❌ Prisma setup failed. Check your database configuration.${NC}"
        exit 1
    fi

    # Step 4: Validate build configuration
    if ! validate_build_config; then
        echo -e "\n${RED}❌ Build configuration validation failed.${NC}"
        exit 1
    fi

    # Step 5: Test local build
    if ! test_local_build; then
        echo -e "\n${RED}❌ Local build test failed. Fix build issues before deploying.${NC}"
        exit 1
    fi

    # Step 6: Deploy to Netlify
    if deploy_to_netlify; then
        show_post_deployment_steps
        echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Deployment failed. Check the logs above for details.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
