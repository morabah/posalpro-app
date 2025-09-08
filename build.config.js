/**
 * Build Configuration for Optimized Compilation
 * Controls TypeScript and Next.js build optimizations
 */

module.exports = {
  // TypeScript optimization settings
  typescript: {
    skipLibCheck: true,
    incremental: true,
    tsBuildInfoFile: './config/tsconfig.build.tsbuildinfo',
    compilerOptions: {
      assumeChangesOnlyAffectDirectDependencies: true,
      disableReferencedProjectLoad: true,
      maxNodeModuleJsDepth: 0,
      traceResolution: false,
    },
  },

  // Memory optimization
  nodeOptions: '--max-old-space-size=8192',

  // Next.js specific optimizations
  nextConfig: {
    typescript: {
      ignoreBuildErrors: false,
      tsconfigPath: './tsconfig.build.json',
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    experimental: {
      optimizePackageImports: ['@prisma/client', 'next-auth', 'lucide-react'],
      serverComponentsExternalPackages: ['async_hooks'],
    },
  },

  // Build performance settings
  performance: {
    // Enable parallel processing
    parallel: true,
    // Memory limits
    maxMemory: '8192MB',
    // Timeout settings
    timeout: 300000, // 5 minutes
    // Incremental build settings
    incremental: true,
  },

  // Development vs Production settings
  environment: {
    development: {
      skipLibCheck: true,
      sourceMaps: false,
      minify: false,
    },
    production: {
      skipLibCheck: true,
      sourceMaps: false,
      minify: true,
    },
  },
};
