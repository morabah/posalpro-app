/* eslint-disable @typescript-eslint/no-require-imports, no-undef, @typescript-eslint/no-unused-vars */
let withBundleAnalyzer = config => config;
// Removed TerserPlugin variable - Next.js 15 handles minification internally
try {
  // Make bundle analyzer optional in CI (e.g., Netlify) to avoid MODULE_NOT_FOUND
  const analyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  withBundleAnalyzer = analyzer;
} catch (err) {
  console.log('[next.config] @next/bundle-analyzer not installed; proceeding without it');
}

// Removed TerserPlugin import - Next.js 15 handles minification internally
// This prevents webpack constructor conflicts with Next.js's compiled webpack

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://mozilla.github.io 'report-sample'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://api.posalpro.com https://cdnjs.cloudflare.com https://unpkg.com https://mozilla.github.io; worker-src 'self' blob: https://cdnjs.cloudflare.com https://unpkg.com https://mozilla.github.io; frame-src 'self' http://localhost:8080 https: https://mozilla.github.io; frame-ancestors 'none'; report-uri /api/security/csp-report",
  },
  { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
];

const baseConfig = {
  // ✅ CRITICAL: LCP optimization configuration
  // Following Lesson #30: Performance Optimization - Bundle Splitting
  experimental: {
    // Avoid optimizing React packages to prevent RSC/Fast Refresh edge cases in Chrome
    optimizePackageImports: ['next-auth', 'lucide-react'],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },

  // 🚨 CRITICAL: Prevent database connections during build
  serverExternalPackages: [
    'async_hooks',
    '@prisma/client',
    'prisma',
    'puppeteer-core',
    '@sparticuz/chromium',
    'pdf-lib',
  ],

  // ✅ CRITICAL: Optimize images for performance
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    // ✅ CRITICAL: Image optimization for LCP
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; sandbox;",
  },

  // Keep strict checks; do not ignore errors during builds
  typescript: {
    ignoreBuildErrors: false,
    // Optimize TypeScript compilation
    tsconfigPath: './tsconfig.build.json',
  },
  // Build without lint: explicitly ignore ESLint during builds per request
  eslint: { ignoreDuringBuilds: true },

  // Do not use standalone to preserve Netlify/edge compatibility per deployment guide
  poweredByHeader: false,
  compress: true,
  generateEtags: false,

  // ✅ CRITICAL: Enhanced webpack configuration for bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Handle Node.js built-in modules for client-side compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'node:async_hooks': false,
        async_hooks: false,
        'node:crypto': false,
        crypto: false,
        'node:fs': false,
        fs: false,
        'node:path': false,
        path: false,
        'node:os': false,
        os: false,
      };
    }

    // Optimize server bundle size for Netlify
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        prisma: 'commonjs prisma',
        'puppeteer-core': 'commonjs puppeteer-core',
        '@sparticuz/chromium': 'commonjs @sparticuz/chromium',
        'pdf-lib': 'commonjs pdf-lib',
        // Prevent server from bundling client-only PDF viewers
        'react-pdf': 'commonjs react-pdf',
        'pdfjs-dist': 'commonjs pdfjs-dist',
      });

      // Stub client-only libraries on the server to avoid DOM usage like DOMMatrix
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'react-pdf': require('path').resolve(__dirname, 'src/server/stubs/react-pdf-stub.js'),
        'pdfjs-dist': false,
      };
    }

    // Exclude archived files from build
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: [
        /archive\//,
        /src\/archived\//,
        /temp-migration\//,
        /backups\//,
        /\.backup\./,
        /backup/,
      ],
    });

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

    // Enhanced bundle splitting for production only
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Separate React and React DOM for better caching
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          // Separate Next.js core
          next: {
            test: /[\\/]node_modules[\\/](next|@next)[\\/]/,
            name: 'next',
            chunks: 'all',
            priority: 20,
          },
          // Separate UI libraries
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|lucide-react|framer-motion)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 15,
          },
          // Separate charting libraries
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|recharts)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 15,
          },
          // Other vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      };

      // Enable tree shaking
      config.optimization.usedExports = true;

      // Next.js 15 handles minification internally - no custom TerserPlugin needed
      // This prevents webpack constructor conflicts with Next.js's compiled webpack
    }

    return config;
  },

  // ✅ CRITICAL: Performance headers for LCP optimization
  async headers() {
    const headers = [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/(.*)',
        headers: [
          // Note: CORS is now handled dynamically in middleware to avoid wildcard '*' and
          // properly support credentials with an allowlist. Keep caching headers only here.
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=300' },
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
