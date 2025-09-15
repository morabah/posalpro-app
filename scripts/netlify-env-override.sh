#!/bin/bash

# Netlify Environment Override Script
# This script provides a workaround if you can't modify Netlify environment variables

set -e

echo "🔧 Netlify Environment Override Solution"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  This is a workaround solution.${NC}"
echo "The proper fix is to update the DATABASE_URL in Netlify environment variables."
echo ""

echo -e "${BLUE}📋 What this script does:${NC}"
echo "• Modifies the Netlify build script to override DATABASE_URL"
echo "• Forces the use of postgresql:// URL instead of prisma://"
echo "• Provides a temporary fix until environment variables can be updated"
echo ""

echo -e "${BLUE}🔍 Current Issue:${NC}"
echo "• DATABASE_URL in Netlify is set to prisma:// (Data Proxy URL)"
echo "• Prisma client expects prisma:// but we want postgresql://"
echo "• This causes 'engine=none' and Data Proxy errors"
echo ""

echo -e "${BLUE}🛠️  Solution Options:${NC}"
echo ""
echo "1. ${GREEN}RECOMMENDED: Fix in Netlify Dashboard${NC}"
echo "   • Go to Netlify → Site settings → Environment variables"
echo "   • Change DATABASE_URL from prisma:// to postgresql://"
echo "   • Trigger new deployment"
echo ""
echo "2. ${YELLOW}WORKAROUND: Override in Build Script${NC}"
echo "   • This script will modify the build script to override the URL"
echo "   • Temporary solution until environment variables are fixed"
echo ""

read -p "Do you want to apply the workaround? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}💡 To fix properly:${NC}"
    echo "1. Go to https://app.netlify.com/"
    echo "2. Navigate to your site"
    echo "3. Go to Site settings → Environment variables"
    echo "4. Change DATABASE_URL from prisma:// to postgresql://"
    echo "5. Trigger new deployment"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔧 Applying workaround...${NC}"

# Backup the original build script
cp scripts/netlify-build.sh scripts/netlify-build.sh.backup
echo "✅ Backed up original build script"

# Add DATABASE_URL override to the build script
cat >> scripts/netlify-build.sh << 'EOF'

# WORKAROUND: Override DATABASE_URL if it's set to prisma://
if [[ "$DATABASE_URL" == prisma://* ]]; then
  echo "⚠️  WORKAROUND: Overriding prisma:// URL with postgresql:// URL"
  echo "   Original DATABASE_URL: ${DATABASE_URL:0:30}..."

  # Replace with your actual PostgreSQL connection string
  # TODO: Replace this with your actual PostgreSQL URL
  export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

  echo "   Override DATABASE_URL: ${DATABASE_URL:0:30}..."
  echo "   ⚠️  This is a temporary workaround!"
  echo "   💡 Fix properly by updating Netlify environment variables"
fi
EOF

echo "✅ Added DATABASE_URL override to build script"
echo ""

echo -e "${RED}⚠️  IMPORTANT: You need to update the DATABASE_URL in the script!${NC}"
echo ""
echo "Edit scripts/netlify-build.sh and replace this line:"
echo "export DATABASE_URL=\"postgresql://username:password@host:port/database?sslmode=require\""
echo ""
echo "With your actual PostgreSQL connection string."
echo ""

echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Edit scripts/netlify-build.sh"
echo "2. Replace the DATABASE_URL with your actual PostgreSQL URL"
echo "3. Commit and push the changes"
echo "4. Wait for Netlify deployment to complete"
echo "5. Test the endpoints"
echo ""

echo -e "${YELLOW}💡 To revert this workaround:${NC}"
echo "cp scripts/netlify-build.sh.backup scripts/netlify-build.sh"
echo ""

echo -e "${GREEN}✅ Workaround applied!${NC}"
echo "Remember to update the DATABASE_URL in the script with your actual PostgreSQL URL."
