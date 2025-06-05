import { dirname } from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint'; // Renamed for clarity, this is the main export

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  // Core ESLint recommended rules
  js.configs.recommended,
  
  // TypeScript ESLint configurations
  ...tseslint.configs.recommendedTypeChecked, // Base type-checked rules
  {
    // Customizations for TypeScript rules and ensuring project path
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json', // Explicitly set project path for type-aware rules
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Your TypeScript rule overrides/relaxations
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  
  // Next.js plugin configuration (consolidated)
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // Apply Next.js rules to all relevant files
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // React-specific rules often used with Next.js
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },

  // React Hooks plugin configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // Ensure hooks rules apply broadly
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: reactHooksPlugin.configs.recommended.rules,
  },
  
  // Global ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.mjs', // Ignores this file itself
      'public/**',
      'coverage/**',
    ],
  }
);
