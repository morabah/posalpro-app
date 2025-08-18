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
    optimizePackageImports: ['@prisma/client', 'next-auth', 'lucide-react', 'react', 'react-dom'],
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

  // ✅ CRITICAL: Phase 6 - Aggressive bundle splitting for memory optimization
  webpack: (config, { dev, isServer }) => {
    // ✅ CRITICAL: Aggressive bundle splitting for memory reduction
    if (!dev && !isServer) {
      // Exclude test files and testing libraries from production bundles
      try {
        const { IgnorePlugin } = require('webpack');
        config.plugins = config.plugins || [];
        config.plugins.push(new IgnorePlugin({ resourceRegExp: /(__tests__|\.test\.(t|j)sx?$)/ }));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('[next.config] webpack not available for IgnorePlugin; skipping');
      }
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@testing-library/react': false,
        '@testing-library/user-event': false,
        msw: false,
      };
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25, // Increased for better splitting
        maxAsyncRequests: 25, // Increased for better splitting
        cacheGroups: {
          // ✅ CRITICAL: Vendor chunk for better caching
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          // ✅ CRITICAL: React chunk for React-specific optimization
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          // ✅ CRITICAL: Next.js chunk for Next.js optimization
          next: {
            test: /[\\/]node_modules[\\/](next)[\\/]/,
            name: 'next',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          // ✅ CRITICAL: Prisma chunk for database optimization
          prisma: {
            test: /[\\/]node_modules[\\/](@prisma|prisma)[\\/]/,
            name: 'prisma',
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
          // ✅ CRITICAL: Auth chunk for authentication components
          auth: {
            test: /[\\/]components[\\/]auth[\\/]/,
            name: 'auth',
            chunks: 'all',
            priority: 8,
            enforce: true,
          },
          // ✅ CRITICAL: Dashboard chunk for dashboard components
          dashboard: {
            test: /[\\/]components[\\/]dashboard[\\/]/,
            name: 'dashboard',
            chunks: 'all',
            priority: 8,
            enforce: true,
          },
          // ✅ CRITICAL: Proposals chunk for proposal components
          proposals: {
            test: /[\\/]components[\\/]proposals[\\/]/,
            name: 'proposals',
            chunks: 'all',
            priority: 8,
            enforce: true,
          },
          // ✅ CRITICAL: Products chunk for product components
          products: {
            test: /[\\/]components[\\/]products[\\/]/,
            name: 'products',
            chunks: 'all',
            priority: 8,
            enforce: true,
          },
          // ✅ CRITICAL: Customers chunk for customer components
          customers: {
            test: /[\\/]components[\\/]customers[\\/]/,
            name: 'customers',
            chunks: 'all',
            priority: 8,
            enforce: true,
          },
          // ✅ CRITICAL: Common chunk for shared components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Smaller custom groups can be handled by default splitting
        },
      };

      // ✅ CRITICAL: Memory optimization settings
      config.optimization = {
        ...config.optimization,
        sideEffects: true,
        usedExports: true,
        concatenateModules: true,
        minimize: true,
        minimizer: [
          ...config.optimization.minimizer,
          // Add TerserPlugin for better minification when available
          ...(TerserPlugin
            ? [
                new TerserPlugin({
                  terserOptions: {
                    compress: {
                      drop_console: true, // Remove console.log in production
                      drop_debugger: true,
                      pure_funcs: ['console.log', 'console.info', 'console.debug'],
                    },
                    mangle: true,
                  },
                }),
              ]
            : []),
        ],
      };
    }

    return config;
  },

  // ✅ CRITICAL: Performance headers for LCP optimization
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(baseConfig);
