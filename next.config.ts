import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Development configuration to resolve chunk loading issues
  experimental: {
    // Enable webpack build worker for better development performance
    webpackBuildWorker: true,
  },

  // Configure allowed development origins to fix cross-origin warnings
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['192.168.1.49'],
  }),

  // Webpack configuration for better chunk handling
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Improve chunk loading in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }

    return config;
  },

  // Development server configuration
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right',
    },
  }),
};

export default nextConfig;
