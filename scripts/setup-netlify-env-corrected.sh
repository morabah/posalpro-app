#!/bin/bash

# Netlify Environment Variables Setup - Corrected for Neon Cloud Database
# Based on successful Neon cloud database connection experience

echo "🔧 Setting up Netlify Environment Variables for Neon Cloud Database"
echo "=================================================================="

# Load environment variables from .env.local
if [ -f .env.local ]; then
    echo "📋 Loading environment variables from .env.local..."
    source .env.local
else
    echo "❌ .env.local file not found!"
    exit 1
fi

echo ""
echo "🌐 Setting up Netlify environment variables..."

# Critical Database Variables (use CLOUD_DATABASE_URL for production)
echo "🗄️  Setting database connection variables..."
npx netlify env:set DATABASE_URL "$CLOUD_DATABASE_URL" --context production
npx netlify env:set DIRECT_URL "$CLOUD_DATABASE_URL" --context production

# Authentication Variables
echo "🔐 Setting authentication variables..."
npx netlify env:set NEXTAUTH_URL "https://posalpro.netlify.app" --context production
npx netlify env:set NEXTAUTH_SECRET "$NEXTAUTH_SECRET" --context production
npx netlify env:set JWT_SECRET "$JWT_SECRET" --context production
npx netlify env:set CSRF_SECRET "$CSRF_SECRET" --context production

# API and Application Variables
echo "🔑 Setting API and application variables..."
npx netlify env:set API_KEY "$API_KEY" --context production
npx netlify env:set NEXT_PUBLIC_APP_URL "https://posalpro.netlify.app" --context production

# Redis (if available)
if [ ! -z "$REDIS_URL" ]; then
    echo "📡 Setting Redis URL..."
    npx netlify env:set REDIS_URL "$REDIS_URL" --context production
fi

# Session Encryption (if available)
if [ ! -z "$SESSION_ENCRYPTION_KEY" ]; then
    echo "🔒 Setting session encryption key..."
    npx netlify env:set SESSION_ENCRYPTION_KEY "$SESSION_ENCRYPTION_KEY" --context production
fi

# Analytics (if available)
if [ ! -z "$ANALYTICS_API_KEY" ]; then
    echo "📊 Setting analytics API key..."
    npx netlify env:set ANALYTICS_API_KEY "$ANALYTICS_API_KEY" --context production
fi

echo ""
echo "✅ Netlify environment variables setup complete!"
echo ""
echo "🔍 Verifying environment variables..."
npx netlify env:list --context production

echo ""
echo "📋 Summary of critical variables set:"
echo "   DATABASE_URL: Set to Neon cloud database"
echo "   DIRECT_URL: Set to Neon cloud database"
echo "   NEXTAUTH_URL: https://posalpro.netlify.app"
echo "   NEXTAUTH_SECRET: [Set]"
echo "   JWT_SECRET: [Set]"
echo "   CSRF_SECRET: [Set]"
echo "   API_KEY: [Set]"
echo ""
echo "🚀 Your Netlify deployment is now configured for Neon cloud database!"
echo "   Next deployment will use the cloud database with all synced data."
