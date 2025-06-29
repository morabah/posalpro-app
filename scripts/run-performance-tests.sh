#!/bin/bash

# PosalPro MVP2 - CLI Performance Test Runner
# Runs comprehensive performance tests integrating all web UI tests

set -e

echo "🧪 PosalPro MVP2 - CLI Performance Test Runner"
echo "=============================================="

# Check if server is running
echo "📡 Checking if development server is running..."
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "❌ Server not running on localhost:3000"
    echo "📋 Please start the server first:"
    echo "   npm run dev:smart"
    exit 1
fi

echo "✅ Server is running"

# Check if Puppeteer is available
echo "🔍 Checking Puppeteer availability..."
if ! node -e "require('puppeteer')" 2>/dev/null; then
    echo "📦 Installing Puppeteer for browser automation..."
    npm install puppeteer --save-dev
fi

echo "✅ Puppeteer available"

# Create docs directory if it doesn't exist
mkdir -p docs

# Run the comprehensive tests
echo "🚀 Running comprehensive CLI performance tests..."
echo "   This will execute all 17 tests from /performance/test page"
echo "   Categories: Performance (4), Sidebar (7), Component (6)"
echo ""

node scripts/comprehensive-real-world-test.js

# Check if reports were generated
if [ -f "real-world-performance-report.md" ]; then
    echo ""
    echo "📄 Reports Generated:"
    echo "   📊 HTML Report: docs/posalpro_test_report_*.html"
    echo "   📝 Markdown Report: real-world-performance-report.md"
    echo "   📋 Raw Data: real-world-test-data.json"
    echo ""
    echo "🎯 To view HTML report:"
    echo "   open docs/posalpro_test_report_*.html"
else
    echo "❌ Test execution may have failed"
    exit 1
fi

echo "✅ CLI Performance Testing Complete!"
