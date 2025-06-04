#!/bin/bash

# PosalPro MVP2 - Dynamic Port Management Demo
# Demonstrates how the system handles multiple ports automatically

echo "🚀 PosalPro Dynamic Port Management Demo"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📊 Current Development Environment:${NC}"
echo "• Node Environment: ${NODE_ENV:-development}"
echo "• Current Directory: $(pwd)"
echo ""

echo -e "${BLUE}🔍 Checking Current Ports:${NC}"
for port in 3000 3001 3002 3003; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "• Port $port: ${GREEN}IN USE${NC}"
    else
        echo "• Port $port: Available"
    fi
done
echo ""

echo -e "${BLUE}🔗 Testing API Endpoints:${NC}"
for port in 3000 3001 3002; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -n "• Testing port $port... "
        if curl -s --max-time 3 "http://localhost:$port/api/admin/metrics" | grep -q "success"; then
            echo -e "${GREEN}✅ Working${NC}"
        else
            echo "❌ No response"
        fi
    fi
done
echo ""

echo -e "${BLUE}🛠️  Available Commands:${NC}"
echo "• npm run dev           - Standard development server"
echo "• npm run dev:clean     - Kill processes + start server"
echo "• npm run dev:smart     - Smart cleanup + port detection"
echo "• npm run kill:dev      - Kill existing Next.js processes"
echo ""

echo -e "${BLUE}📁 Configuration Files:${NC}"
echo "• Environment: .env.local (no hardcoded ports)"
echo "• API Config: src/lib/utils/apiUrl.ts (dynamic detection)"
echo "• Dev Scripts: scripts/dev-clean.sh (port management)"
echo ""

echo -e "${YELLOW}💡 How It Works:${NC}"
echo "1. Scripts automatically find available ports"
echo "2. Environment uses relative URLs (/api) in development"
echo "3. Client-side code detects window.location.origin"
echo "4. No more hardcoded port dependencies!"
echo ""

echo -e "${GREEN}✅ Solution Benefits:${NC}"
echo "• No manual port configuration needed"
echo "• Works with any available port (3000, 3001, 3002...)"
echo "• Automatic process cleanup prevents conflicts"
echo "• Production/staging environments unaffected"
echo ""

echo "🎯 Ready for development! Use 'npm run dev:smart' for best experience."
