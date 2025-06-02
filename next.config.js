/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      // Add other image domains as needed
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001', 'localhost:3000'],
    },
  },
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  typescript: {
    ignoreBuildErrors: false, // Enforce TypeScript checking
  },
  eslint: {
    ignoreDuringBuilds: false, // Enforce ESLint checking
  },
};

module.exports = nextConfig;
