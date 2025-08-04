/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,

  // Optimize images
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Bundle optimization - Enhanced for performance
  webpack: (config, { dev, isServer }) => {
    // Optimize for both dev and production
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        vendor: {
          test: /[\/]node_modules[\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
        // Separate large libraries
        react: {
          test: /[\/]node_modules[\/](react|react-dom)[\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        prisma: {
          test: /[\/]node_modules[\/]@?prisma[\/]/,
          name: 'prisma',
          chunks: 'all',
          priority: 15,
        },
      },
    };

    // Tree shaking optimization (only in production to avoid conflicts)
    if (!dev) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Reduce module resolution time
    config.resolve.symlinks = false;
    
    // Development-specific optimizations
    if (dev) {
      // Faster builds in development
      config.optimization.removeAvailableModules = false;
      config.optimization.removeEmptyChunks = false;
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Smaller chunks in development for faster HMR
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
            maxSize: 100000, // Smaller chunks for faster HMR
          },
        },
      };
    }

    return config;
  },

  // Performance optimizations
  poweredByHeader: false,
  trailingSlash: false,

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  eslint: {
    // Temporarily disable ESLint during builds for deployment testing
    ignoreDuringBuilds: true,
  },

  // ✅ FIXED: Moved from experimental to top-level as per Next.js 15.3.4
  serverExternalPackages: ['prisma'],
};

module.exports = nextConfig;
