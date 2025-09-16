import js from '@eslint/js';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'archive/**',
      'src/archived/**',
      'temp-migration/**',
      'backups/**',
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'scripts/**',
      'tests/**',
      'templates/**',
      'docs/**',
      '**/*.md',
      '**/*.backup.*',
      '**/*backup*',
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',
      '**/__mocks__/**',
      '**/__snapshots__/**',
      // Environment files
      '**/.env*',
      '**/production-env-vars.env',
      // Session files
      '**/.posalpro-cli-session*.json',
      '**/.posalpro-ui-session*.json',
      // System files
      '**/.DS_Store',
      // SQL files
      '**/*.sql',
      // Data files
      '**/test_output.json',
      '**/customers_*.json',
      '**/products_*.json',
      '**/database-integrity-report.json',
      // IDE files
      '**/.vscode/**',
      '**/.idea/**',
      // OS files
      '**/Thumbs.db',
      '**/*.log',
    ],
  },

  // Core rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Next.js rules (Core Web Vitals)
  // Uses the official flat config provided by @next/eslint-plugin-next
  nextPlugin.flatConfig.coreWebVitals,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for now to avoid memory issues
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // React Hooks
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: reactHooksPlugin.configs.recommended.rules,
  }
);
