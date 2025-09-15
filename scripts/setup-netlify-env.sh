#!/bin/bash

# Netlify Environment Variables Setup Script
# This script helps set up all required environment variables for PosalPro MVP2

echo "🚀 PosalPro MVP2 - Netlify Environment Variables Setup"
echo "======================================================"
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Please install it first:"
    echo "   npm install -g netlify-cli"
    exit 1
fi

echo "📋 Required Environment Variables:"
echo "1. DATABASE_URL - Your PostgreSQL connection string"
echo "2. DIRECT_URL - Same as DATABASE_URL (for direct connections)"
echo "3. NEXTAUTH_URL - https://posalpro-mvp2.windsurf.build"
echo "4. NEXTAUTH_SECRET - A secure random string"
echo "5. JWT_SECRET - A secure random string"
echo "6. CSRF_SECRET - A secure random string"
echo "7. API_KEY - Your API key"
echo ""

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64
}

# Function to set environment variable
set_env_var() {
    local var_name=$1
    local var_value=$2
    local context=${3:-production}

    echo "Setting $var_name in $context context..."
    if netlify env:set "$var_name" "$var_value" --context "$context"; then
        echo "✅ $var_name set successfully"
    else
        echo "❌ Failed to set $var_name"
        return 1
    fi
}

echo "🔧 Setting up environment variables..."
echo ""

# Set NEXTAUTH_URL
set_env_var "NEXTAUTH_URL" "https://posalpro-mvp2.windsurf.build" "production"

# Generate and set secrets
echo "🔐 Generating secure secrets..."
NEXTAUTH_SECRET=$(generate_secret)
JWT_SECRET=$(generate_secret)
CSRF_SECRET=$(generate_secret)

set_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "production"
set_env_var "JWT_SECRET" "$JWT_SECRET" "production"
set_env_var "CSRF_SECRET" "$CSRF_SECRET" "production"

echo ""
echo "📝 Manual Setup Required:"
echo "========================="
echo ""
echo "You need to manually set these variables in Netlify:"
echo ""
echo "1. DATABASE_URL:"
echo "   - Go to Netlify Dashboard > Site Settings > Environment Variables"
echo "   - Add: DATABASE_URL = your_postgresql_connection_string"
echo "   - Example: postgresql://user:password@host:port/database"
echo ""
echo "2. DIRECT_URL:"
echo "   - Same as DATABASE_URL"
echo "   - Add: DIRECT_URL = your_postgresql_connection_string"
echo ""
echo "3. API_KEY:"
echo "   - Add: API_KEY = your_api_key"
echo ""
echo "🔗 Netlify Dashboard:"
echo "   https://app.netlify.com/sites/posalpro/settings/deploys#environment-variables"
echo ""
echo "📋 Or use CLI commands:"
echo "   netlify env:set DATABASE_URL 'your_postgresql_connection_string' --context production"
echo "   netlify env:set DIRECT_URL 'your_postgresql_connection_string' --context production"
echo "   netlify env:set API_KEY 'your_api_key' --context production"
echo ""
echo "✅ After setting all variables, trigger a new deployment:"
echo "   netlify api createSiteBuild --data='{\"site_id\":\"47c9a3e7-4153-4961-9de9-d806669ce954\"}'"
echo ""
echo "🎉 Setup complete! Remember to set the database URLs and API key manually."
