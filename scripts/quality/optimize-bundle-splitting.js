const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');
const SEARCH_PATTERNS = ['**/*.tsx', '**/*.ts'];

// Large components and heavy imports that should be dynamically loaded
const OPTIMIZATION_TARGETS = [
  // Heavy dashboard components
  {
    pattern:
      /import.*(?:Dashboard|Performance|Analytics).*from.*(?:dashboard|performance|analytics)/gi,
    type: 'dashboard_component',
    threshold: 50000, // 50KB+ files
  },
  // Large form components
  {
    pattern: /import.*(?:Wizard|Form|Creation).*from.*(?:forms|proposals|products)/gi,
    type: 'form_component',
    threshold: 30000, // 30KB+ files
  },
  // Heavy libraries
  {
    pattern: /import.*from ['"`](?:chart\.js|recharts|d3|lodash|moment)['"`]/gi,
    type: 'heavy_library',
    threshold: 0, // Any usage
  },
  // Large admin/management pages
  {
    pattern: /import.*(?:Admin|Management|Settings).*from.*(?:admin|management|settings)/gi,
    type: 'admin_component',
    threshold: 20000, // 20KB+ files
  },
];

// Route-level components that should be lazy loaded
const ROUTE_COMPONENTS = [
  'src/app/(dashboard)/admin',
  'src/app/(dashboard)/performance',
  'src/app/(dashboard)/validation',
  'src/app/(dashboard)/sme',
  'src/app/(dashboard)/workflows',
  'src/app/performance',
  'src/app/rfp',
  'src/components/performance',
  'src/components/admin',
  'src/components/analytics',
];

function analyzeFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function createDynamicImport(componentPath, componentName, isDefault = true) {
  if (isDefault) {
    return `const ${componentName} = lazy(() => import('${componentPath}'));`;
  } else {
    return `const ${componentName} = lazy(() => import('${componentPath}').then(module => ({ default: module.${componentName} })));`;
  }
}

function wrapWithSuspense(componentUsage, fallbackComponent = 'div') {
  return `<Suspense fallback={<${fallbackComponent}>Loading...</${fallbackComponent}>}>
  ${componentUsage}
</Suspense>`;
}

function optimizeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileSize = analyzeFileSize(filePath);
  let newContent = content;
  let modifications = [];

  // Check if React and Suspense imports exist
  const hasReactImport = /import.*React.*from ['"`]react['"`]/.test(content);
  const hasSuspenseImport = /import.*Suspense.*from ['"`]react['"`]/.test(content);
  const hasLazyImport = /import.*lazy.*from ['"`]react['"`]/.test(content);

  // Add necessary imports if missing
  let importsToAdd = [];
  if (!hasReactImport) {
    importsToAdd.push("import React from 'react';");
  }
  if (!hasSuspenseImport && !content.includes('Suspense')) {
    importsToAdd.push("import { Suspense } from 'react';");
  }
  if (!hasLazyImport && !content.includes('lazy')) {
    importsToAdd.push("import { lazy } from 'react';");
  }

  // Process each optimization target
  for (const target of OPTIMIZATION_TARGETS) {
    if (fileSize < target.threshold && target.threshold > 0) {
      continue;
    }

    const matches = content.match(target.pattern);
    if (matches) {
      matches.forEach(match => {
        // Extract component info from import statement
        const importMatch = match.match(
          /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"`]([^'"`]+)['"`]/
        );

        if (importMatch) {
          const [fullMatch, namedImports, namespaceImport, defaultImport, modulePath] = importMatch;

          // Convert to dynamic import
          if (defaultImport) {
            const dynamicImport = createDynamicImport(modulePath, defaultImport, true);
            newContent = newContent.replace(fullMatch, dynamicImport);
            modifications.push(`Converted default import ${defaultImport} to dynamic import`);
          } else if (namedImports) {
            const imports = namedImports.split(',').map(imp => imp.trim());
            imports.forEach(imp => {
              const dynamicImport = createDynamicImport(modulePath, imp, false);
              newContent = newContent.replace(fullMatch, dynamicImport);
              modifications.push(`Converted named import ${imp} to dynamic import`);
            });
          }
        }
      });
    }
  }

  // Add imports if any modifications were made
  if (modifications.length > 0 && importsToAdd.length > 0) {
    const existingImports = content.match(/^import.*$/gm) || [];
    const lastImport = existingImports[existingImports.length - 1];
    if (lastImport) {
      newContent = newContent.replace(lastImport, lastImport + '\n' + importsToAdd.join('\n'));
    } else {
      newContent = importsToAdd.join('\n') + '\n' + newContent;
    }
  }

  // Optimize route-level components in page files
  if (filePath.includes('/page.tsx') || filePath.includes('/layout.tsx')) {
    // Look for large component imports and make them lazy
    const componentImports = content.match(
      /import\s+\w+\s+from\s+['"`][^'"`]*(?:components|dashboard)[^'"`]*['"`]/g
    );

    if (componentImports) {
      componentImports.forEach(imp => {
        if (fileSize > 15000) {
          // Files larger than 15KB
          const match = imp.match(/import\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`]/);
          if (match) {
            const [fullMatch, componentName, importPath] = match;
            const dynamicImport = createDynamicImport(importPath, componentName, true);
            newContent = newContent.replace(fullMatch, dynamicImport);
            modifications.push(`Made page-level component ${componentName} lazy-loaded`);
          }
        }
      });
    }
  }

  return {
    content: newContent,
    modified: newContent !== content,
    modifications,
    fileSize,
    optimizationType: determineOptimizationType(filePath, fileSize),
  };
}

function determineOptimizationType(filePath, fileSize) {
  if (filePath.includes('/page.tsx')) return 'route';
  if (fileSize > 50000) return 'large_component';
  if (fileSize > 30000) return 'medium_component';
  if (filePath.includes('dashboard') || filePath.includes('performance')) return 'dashboard';
  if (filePath.includes('admin') || filePath.includes('management')) return 'admin';
  return 'general';
}

function createNextConfigOptimizations() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');

  if (!fs.existsSync(nextConfigPath)) {
    console.log('Creating next.config.js with bundle optimization...');

    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@hookform/resolvers',
      'zod',
      'date-fns'
    ],
  },

  // Code splitting optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
          // Separate heavy components
          dashboard: {
            test: /[\\/]src[\\/]components[\\/](dashboard|performance|analytics)[\\/]/,
            name: 'dashboard',
            priority: 20,
            chunks: 'all',
          },
          forms: {
            test: /[\\/]src[\\/]components[\\/](forms|proposals)[\\/]/,
            name: 'forms',
            priority: 20,
            chunks: 'all',
          },
          admin: {
            test: /[\\/]src[\\/](components|app)[\\/](admin|management)[\\/]/,
            name: 'admin',
            priority: 20,
            chunks: 'all',
          }
        }
      }
    };

    return config;
  },

  // Production optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    minimumCacheTTL: 60,
  }
};

module.exports = nextConfig;`;

    fs.writeFileSync(nextConfigPath, nextConfig);
    return true;
  }

  return false;
}

async function optimizeBundleSplitting() {
  console.log('🚀 Optimizing bundle splitting and dynamic imports...');

  const files = await fg(SEARCH_PATTERNS, {
    cwd: SRC_DIR,
    ignore: ['**/*.test.*', '**/node_modules/**', '**/*.d.ts'],
  });

  let totalFilesModified = 0;
  let totalOptimizations = 0;
  const optimizationsByType = {};
  const modifiedFiles = [];

  // Create Next.js config optimizations
  const nextConfigCreated = createNextConfigOptimizations();
  if (nextConfigCreated) {
    console.log('✅ Created optimized next.config.js');
  }

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);
    const result = optimizeFile(filePath);

    if (result.modified) {
      fs.writeFileSync(filePath, result.content);
      totalFilesModified++;
      totalOptimizations += result.modifications.length;

      modifiedFiles.push({
        file: `src/${file}`,
        modifications: result.modifications,
        fileSize: result.fileSize,
        type: result.optimizationType,
      });

      // Track optimization types
      if (!optimizationsByType[result.optimizationType]) {
        optimizationsByType[result.optimizationType] = 0;
      }
      optimizationsByType[result.optimizationType]++;
    }
  }

  return {
    totalFilesModified,
    totalOptimizations,
    optimizationsByType,
    modifiedFiles,
    nextConfigCreated,
  };
}

async function run() {
  try {
    const results = await optimizeBundleSplitting();

    console.log('✅ Bundle optimization completed:');
    console.log('');
    console.log(`📊 Summary:`);
    console.log(`  • Files modified: ${results.totalFilesModified}`);
    console.log(`  • Total optimizations: ${results.totalOptimizations}`);
    console.log(
      `  • Next.js config optimized: ${results.nextConfigCreated ? 'Yes' : 'Already exists'}`
    );
    console.log('');

    if (Object.keys(results.optimizationsByType).length > 0) {
      console.log('📈 Optimizations by type:');
      Object.entries(results.optimizationsByType).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count} files`);
      });
      console.log('');
    }

    if (results.modifiedFiles.length > 0 && results.modifiedFiles.length <= 20) {
      console.log('📁 Modified files:');
      results.modifiedFiles.forEach(file => {
        console.log(
          `  • ${file.file} (${(file.fileSize / 1024).toFixed(1)}KB): ${file.modifications.length} optimizations`
        );
      });
    } else if (results.modifiedFiles.length > 20) {
      console.log(`📁 Modified ${results.modifiedFiles.length} files (showing first 10):`);
      results.modifiedFiles.slice(0, 10).forEach(file => {
        console.log(
          `  • ${file.file} (${(file.fileSize / 1024).toFixed(1)}KB): ${file.modifications.length} optimizations`
        );
      });
      console.log(`  ... and ${results.modifiedFiles.length - 10} more files`);
    }

    console.log('');
    console.log('ℹ️  Benefits:');
    console.log('  • Reduced initial bundle size');
    console.log('  • Faster page load times');
    console.log('  • Better code splitting');
    console.log('  • Improved compilation performance');

    if (results.totalFilesModified === 0) {
      console.log('✅ No bundle optimizations needed or all are already optimized.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error optimizing bundle splitting:', error);
    process.exit(1);
  }
}

run();
