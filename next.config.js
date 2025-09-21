/* eslint-disable @typescript-eslint/no-require-imports, no-undef, @typescript-eslint/no-unused-vars */
// Ensure Next's compiled webpack module is initialized BEFORE any plugins run.
try {
  const compiledWebpack = require('next/dist/compiled/webpack/webpack');
  if (compiledWebpack && typeof compiledWebpack.init === 'function') {
    compiledWebpack.init(() => require('next/dist/compiled/webpack/webpack'));
    // Optional: tiny sanity check to help in CI logs
    const w = require('next/dist/compiled/webpack/webpack');
    if (!w || !w.WebpackError) {
      console.warn('[next.config] Compiled webpack initialized but WebpackError missing');
    }
  }
} catch (e) {
  console.warn('[next.config] Failed to initialize compiled webpack:', e?.message || e);
}

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
function buildCsp() {
  const isProd = process.env.NODE_ENV === 'production';
  const scriptSrc = [
    "'self'",
    // Allow CDN worker scripts (e.g., pdf.js) but avoid eval in production
    'https://cdnjs.cloudflare.com',
    'https://unpkg.com',
    'https://mozilla.github.io',
  ];
  // In development, Next may inject inline/eval for HMR
  if (!isProd) {
    scriptSrc.push("'unsafe-eval'", "'unsafe-inline'", "'report-sample'");
  } else {
    scriptSrc.push("'report-sample'");
  }

  // Use nonce-based CSP for styles in production, unsafe-inline only in development
  const styleSrc = ["'self'", 'https://fonts.googleapis.com'];
  if (!isProd) {
    styleSrc.push("'unsafe-inline'");
  }
  const fontSrc = ["'self'", 'https://fonts.gstatic.com', 'data:'];
  const imgSrc = ["'self'", 'data:', 'https:'];
  const connectSrc = [
    "'self'",
    'https://api.posalpro.com',
    'https://cdnjs.cloudflare.com',
    'https://unpkg.com',
    'https://mozilla.github.io',
  ];
  const workerSrc = [
    "'self'",
    'blob:',
    'https://cdnjs.cloudflare.com',
    'https://unpkg.com',
    'https://mozilla.github.io',
  ];
  const frameSrc = ["'self'", 'http://localhost:8080', 'https:', 'https://mozilla.github.io'];

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `script-src-elem ${scriptSrc.join(' ')}`,
    `script-src-attr 'none'`,
    `style-src ${styleSrc.join(' ')}`,
    `style-src-elem ${styleSrc.join(' ')}`,
    `style-src-attr 'none'`,
    `font-src ${fontSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    `worker-src ${workerSrc.join(' ')}`,
    `frame-src ${frameSrc.join(' ')}`,
    `frame-ancestors 'none'`,
    `report-uri /api/security/csp-report`,
  ].join('; ');
}

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Content-Security-Policy', value: buildCsp() },
  { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
];

const baseConfig = {
  // ✅ CRITICAL: LCP optimization configuration
  // Following Lesson #30: Performance Optimization - Bundle Splitting
  experimental: {
    // Keep minimal experimental features - webVitalsAttribution disabled for now
    // webVitalsAttribution: true,
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

  // ✅ CRITICAL: Enhanced image optimization for performance
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    // ✅ CRITICAL: Image optimization for LCP with enhanced device sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 768],
    minimumCacheTTL: 31536000, // 1 year for optimized images
    dangerouslyAllowSVG: true,
    // Enhanced security policy
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? "default-src 'self'; script-src 'self' https://unpkg.com; script-src-elem 'self' https://unpkg.com; script-src-attr 'none'; sandbox;"
        : "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; script-src-elem 'self' 'unsafe-inline' https://unpkg.com; script-src-attr 'none'; sandbox;",
    // Enable remote patterns for external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
    // Fast fallback: Disable minification only on CI to avoid the broken code path
    if (process.env.NETLIFY === 'true' || process.env.CI === 'true') {
      config.optimization.minimize = false;
      console.warn('[next.config] Minification disabled on CI as a workaround');
    }
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
