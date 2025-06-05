import type { NextConfig } from 'next';

// Set default environment variables for development if missing
if (process.env.NODE_ENV === 'development') {
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET =
      'posalpro-mvp2-development-secret-key-minimum-32-characters-required';
    console.log('✅ NextAuth: Set default NEXTAUTH_SECRET for development');
  }

  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    console.log('✅ NextAuth: Set default NEXTAUTH_URL for development');
  }
}

const nextConfig: NextConfig = {
  // ESLint configuration for build process
  eslint: {
    dirs: ['src'], // Only lint src directory
    ignoreDuringBuilds: false,
  },

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
