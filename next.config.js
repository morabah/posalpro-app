/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,

  // Optimize images
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
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

  experimental: {
    serverComponentsExternalPackages: ['prisma'],
  },
};

module.exports = nextConfig;
