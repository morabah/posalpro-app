/**
 * @type {import('next').NextConfig}
 *
 * PosalPro Next.js Configuration
 * Optimized for production deployment on Netlify with serverless functions
 */

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      // Add other image domains as needed
    ],
    // Optimize images for production
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  experimental: {
    serverActions: {
      // Allow server actions for local development and production domain
      allowedOrigins: ['localhost:3001', 'localhost:3000', 'posalpro-mvp2.windsurf.build'],
    },
    // Optimize bundling for serverless environments
    optimizePackageImports: ['react', 'react-dom', '@headlessui/react', '@heroicons/react'],
  },
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  typescript: {
    ignoreBuildErrors: false, // Enforce TypeScript checking per quality-first approach
  },
  eslint: {
    ignoreDuringBuilds: false, // Enforce ESLint checking per quality-first approach
  },
  // Important optimization for Netlify serverless functions
  output: 'standalone',
  // Optimize modules to single dependency tree
  modularizeImports: {
    '@heroicons/react': {
      transform: '@heroicons/react/{{member}}',
    },
  },
  // Note: swcMinify and optimizeFonts are enabled by default in Next.js 15+
};

// Support for different bundle analysis in development
if (process.env.ANALYZE === 'true') {
  // Only import when needed to avoid adding to production bundle
  const withBundleAnalyzer = require('@next/bundle-analyzer')();
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  module.exports = nextConfig;
}
