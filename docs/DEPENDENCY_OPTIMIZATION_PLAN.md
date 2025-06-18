# Dependency Optimization Plan

## 📦 Current Dependency Analysis

**Bundle Impact Assessment**:

- **Total Dependencies**: 44 production dependencies
- **Dev Dependencies**: 33 development dependencies
- **Potential Bundle Size**: ~2.5MB (estimated)
- **Security Vulnerabilities**: Need audit

## Phase 1: Bundle Size Optimization (Week 1)

### 1.1 Heavy Dependencies Review

**Large Dependencies Identified**:

```javascript
// High impact replacements
"@tanstack/react-query": "^5.80.5"           // 450KB - Consider lite version
"framer-motion": "^12.15.0"                  // 200KB - Use only for critical animations
"react-virtualized": "^9.22.6"               // 180KB - Consider react-window (lighter)
"@heroicons/react": "^2.0.18"                // 150KB - Consider selective imports
"workbox-precaching": "^7.3.0"               // 120KB - Only if PWA features needed
```

**Optimization Strategy**:

```javascript
// BEFORE (Heavy imports)
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import * as HeroIcons from '@heroicons/react/24/outline';

// AFTER (Selective imports)
import { motion } from 'framer-motion/dist/framer-motion';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
```

### 1.2 Bundle Analyzer Integration

```javascript
// next.config.js addition
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // existing config
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000, // 244KB
            },
            analytics: {
              test: /[\\/]src[\\/](analytics|hooks[\\/]analytics)[\\/]/,
              name: 'analytics',
              chunks: 'all',
            },
          },
        },
      };
    }
    return config;
  },
});
```

## Phase 2: Security & Version Updates (Week 2)

### 2.1 Dependency Security Audit

```bash
# Security audit commands
npm audit --audit-level=moderate
npm audit fix --force
npx audit-ci --moderate

# Check for outdated packages
npm outdated
npx npm-check-updates -u
```

### 2.2 Critical Updates Needed

**Priority Updates**:

```json
{
  "next": "^15.3.3", // ✅ Current
  "react": "^19.1.0", // ✅ Latest
  "typescript": "^5.3.2", // ⚠️ Consider 5.6+
  "@prisma/client": "^5.7.0", // ⚠️ Check for 5.8+
  "eslint": "^9.28.0", // ✅ Current
  "next-auth": "^4.24.11" // ⚠️ Consider Auth.js v5
}
```

### 2.3 Remove Redundant Dependencies

**Potential Removals**:

```diff
- "react-error-boundary": "^6.0.0"      // Next.js has built-in error boundaries
- "express-rate-limit": "^7.5.0"        // Using custom rate limiter
- "workbox-*": "^7.3.0"                 // Remove if not using PWA features
+ "sonner": "^2.0.5"                    // Duplicate with react-hot-toast
```

## Phase 3: Performance Dependencies (Week 3)

### 3.1 Lazy Loading Optimization

```typescript
// Implement proper code splitting
const AnalyticsDashboard = lazy(
  () => import('@/components/analytics/AnalyticsDashboard')
);

const ProposalCreationForm = lazy(
  () => import('@/components/proposals/ProposalCreationForm')
);

// Bundle optimization with dynamic imports
const importAnalytics = () =>
  import('@/lib/analytics').then(mod => mod.default);
```

### 3.2 Tree Shaking Optimization

```javascript
// package.json optimizations
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/styles/**/*",
    "./src/lib/polyfills.ts"
  ],
  "type": "module"  // Enable ES modules for better tree shaking
}
```

### 3.3 Alternative Lightweight Dependencies

**Replacements for Bundle Size**:

```javascript
// BEFORE (Heavy)
import { format, parseISO, differenceInDays } from 'date-fns'; // 67KB

// AFTER (Lighter alternatives)
import dayjs from 'dayjs'; // 12KB
// OR use native Intl.DateTimeFormat for simple cases

// BEFORE (Heavy virtualization)
import { List as VirtualizedList } from 'react-virtualized'; // 180KB

// AFTER (Lighter)
import { FixedSizeList as List } from 'react-window'; // 45KB
```

## Phase 4: Development Experience (Week 4)

### 4.1 Development Dependencies Optimization

```json
{
  "devDependencies": {
    "@next/bundle-analyzer": "^15.3.3", // Add for bundle analysis
    "webpack-bundle-analyzer": "^4.10.1", // Add for detailed analysis
    "depcheck": "^1.4.7", // Add for unused dependency detection
    "npm-check-updates": "^16.14.12", // Add for update management

    // Remove if unused
    "babel-jest": "^30.0.0-beta.3", // May not be needed with SWC
    "identity-obj-proxy": "^3.0.0" // Check if actually used in tests
  }
}
```

### 4.2 Monorepo Package Management (Future)

```javascript
// Consider workspace structure for large apps
{
  "workspaces": [
    "packages/ui",
    "packages/analytics",
    "packages/auth",
    "apps/web"
  ]
}
```

## Implementation Scripts

### 4.3 Automated Dependency Management

```bash
#!/bin/bash
# dependency-optimize.sh

echo "🔍 Analyzing dependencies..."

# Check for unused dependencies
npx depcheck

# Security audit
npm audit --audit-level=moderate

# Bundle size analysis
ANALYZE=true npm run build

# Check for updates
npx npm-check-updates --interactive

# Clean install to verify
rm -rf node_modules package-lock.json
npm install

echo "✅ Dependency optimization complete!"
```

### 4.4 Bundle Size Monitoring

```typescript
// Bundle size monitoring in CI/CD
const bundleSizeLimit = {
  'pages/_app.js': '200KB',
  'pages/dashboard.js': '150KB',
  'pages/proposals.js': '120KB',
  'chunks/vendor.js': '400KB',
  'chunks/analytics.js': '100KB'
};

// GitHub Actions integration
name: Bundle Size Check
on: [pull_request]
jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Performance Targets

### Bundle Size Goals:

- **Main Bundle**: <200KB (currently ~300KB estimated)
- **Vendor Bundle**: <400KB (from ~600KB estimated)
- **Analytics Bundle**: <100KB (isolated)
- **Total Initial Load**: <800KB (from ~1.2MB estimated)

### Performance Metrics:

- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Bundle Parse Time**: <500ms
- **Lighthouse Score**: >90

## Expected Improvements:

### Bundle Optimization:

- **30-40%** reduction in initial bundle size
- **50%** faster parse times for analytics code
- **20%** improvement in Core Web Vitals
- **Better** code splitting and lazy loading

### Security Benefits:

- **Zero** known security vulnerabilities
- **Up-to-date** dependencies with latest security patches
- **Reduced** attack surface through dependency minimization
- **Automated** security monitoring

### Developer Experience:

- **Faster** `npm install` times
- **Reduced** dependency conflicts
- **Better** IDE performance
- **Cleaner** dependency tree

This optimization plan will significantly improve application performance,
security, and maintainability while reducing bundle size and improving user
experience.
