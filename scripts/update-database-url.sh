#!/bin/bash

# Database URL Update Script
# This script helps you update the DATABASE_URL in the build script with actual credentials

set -e

echo "🔧 Database URL Update Helper"
echo "============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Current Situation:${NC}"
echo "• The DATABASE_URL in Netlify is set to prisma:// (Data Proxy URL)"
echo "• We need to override it with the correct postgresql:// URL"
echo "• The build script has been prepared with a workaround"
echo ""

echo -e "${BLUE}🔍 Database Information:${NC}"
echo "• Host: ep-ancient-sun-a9gve4ul-pooler.gwc.azure.neon.tech"
echo "• Database: neondb"
echo "• SSL Mode: require"
echo ""

echo -e "${YELLOW}⚠️  You need to provide the actual credentials:${NC}"
echo ""

# Get the actual credentials from the user
read -p "Enter the database username (usually 'neondb_owner'): " DB_USER
read -s -p "Enter the database password: " DB_PASSWORD
echo ""

if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Both username and password are required!${NC}"
    exit 1
fi

# Construct the DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@ep-ancient-sun-a9gve4ul-pooler.gwc.azure.neon.tech/neondb?sslmode=require"

echo ""
echo -e "${BLUE}🔧 Updating build script...${NC}"

# Update the build script with the actual DATABASE_URL
sed -i.bak "s|postgresql://neondb_owner:YOUR_PASSWORD@ep-ancient-sun-a9gve4ul-pooler.gwc.azure.neon.tech/neondb?sslmode=require|${DATABASE_URL}|g" scripts/netlify-build.sh

echo "✅ Build script updated with actual DATABASE_URL"
echo ""

echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Commit and push the changes:"
echo "   ${GREEN}git add scripts/netlify-build.sh${NC}"
echo "   ${GREEN}git commit -m \"🔧 WORKAROUND: Update DATABASE_URL with actual credentials\"${NC}"
echo "   ${GREEN}git push${NC}"
echo ""
echo "2. Wait for Netlify deployment to complete"
echo ""
echo "3. Test the endpoints:"
echo "   ${GREEN}./scripts/monitor-deployment.sh${NC}"
echo ""

echo -e "${YELLOW}💡 Important Notes:${NC}"
echo "• This is a temporary workaround"
echo "• The proper fix is to update DATABASE_URL in Netlify environment variables"
echo "• The credentials are now in the build script (temporary)"
echo "• Consider updating Netlify environment variables for security"
echo ""

echo -e "${GREEN}✅ Ready to deploy!${NC}"
echo "The build script now contains the actual DATABASE_URL and will override the prisma:// URL during build."












