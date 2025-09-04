#!/bin/bash

echo "🚀 Deploying PosalPro with environment variables fix..."
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

echo "🔐 Please login to Netlify (browser will open):"
netlify login

echo ""
echo "📦 Deploying to production..."
netlify deploy --prod --dir=. --message="Deploy environment variables fix - DIRECT_URL, SESSION_ENCRYPTION_KEY, API_KEY"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the deployment:"
echo "curl -s https://posalpro-mvp2.windsurf.build/api/test-env | jq '.envVars.DIRECT_URL'"
echo ""
echo "🎯 Expected result: postgresql://neondb_..."
