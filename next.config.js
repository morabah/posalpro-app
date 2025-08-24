/* eslint-disable @typescript-eslint/no-var-requires */
let withBundleAnalyzer = config => config;
let TerserPlugin;
try {
  // Make bundle analyzer optional in CI (e.g., Netlify) to avoid MODULE_NOT_FOUND
  const analyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  withBundleAnalyzer = analyzer;
} catch (err) {
  // eslint-disable-next-line no-console
  console.log('[next.config] @next/bundle-analyzer not installed; proceeding without it');
}

try {
  // Make terser optional in CI (e.g., Netlify) to avoid MODULE_NOT_FOUND
  // Next.js has its own minifier; this is only an enhancement when available
  TerserPlugin = require('terser-webpack-plugin');
} catch (err) {
  // eslint-disable-next-line no-console
  console.log('[next.config] terser-webpack-plugin not installed; proceeding without it');
}

/** @type {import('next').NextConfig} */
const baseConfig = {
  // ✅ CRITICAL: LCP optimization configuration
  // Following Lesson #30: Performance Optimization - Bundle Splitting
  experimental: {
    // Avoid optimizing React packages to prevent RSC/Fast Refresh edge cases in Chrome
    optimizePackageImports: ['@prisma/client', 'next-auth', 'lucide-react'],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },

  // ✅ CRITICAL: Optimize images for performance
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    // ✅ CRITICAL: Image optimization for LCP
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Keep strict checks; do not ignore errors during builds
  typescript: { ignoreBuildErrors: false },
  // Build without lint: explicitly ignore ESLint during builds per request
  eslint: { ignoreDuringBuilds: true },

  // Do not use standalone to preserve Netlify/edge compatibility per deployment guide
  poweredByHeader: false,
  compress: true,
  generateEtags: false,

  // ✅ CRITICAL: Simplified webpack configuration for stability
  webpack: (config, { dev, isServer }) => {
    // Harden dev rebuild behavior to avoid Chrome-only Fast Refresh module issues
    if (dev) {
      // Disable persistent file cache and snapshots that can go stale in Chrome HMR cycles
      config.cache = false;
      config.snapshot = {
        ...(config.snapshot || {}),
        managedPaths: [],
        immutablePaths: [],
      };
      // Reduce hashing volatility in dev
      config.optimization = {
        ...(config.optimization || {}),
        realContentHash: false,
      };
    }

    // Simplified bundle splitting for production only
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }

    return config;
  },

  // ✅ CRITICAL: Performance headers for LCP optimization
  async headers() {
    const headers = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=300' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];

    // In development, prevent Chrome from caching _next static chunks aggressively
    if (process.env.NODE_ENV !== 'production') {
      headers.push({
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      });
    }

    return headers;
  },
};

module.exports = withBundleAnalyzer(baseConfig);
