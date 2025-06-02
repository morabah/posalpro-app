import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import typescriptEslint from 'typescript-eslint';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FlatCompat for backward compatibility
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  // Core ESLint recommended rules
  js.configs.recommended,
  
  // TypeScript ESLint recommended rules with relaxed settings for initial setup
  ...typescriptEslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Disable rules that are too strict for initial setup
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
    },
  },
  
  // Next.js recommended rules
  {
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Next.js specific rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-sync-scripts': 'error',
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Custom rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.mjs',
      'public/**',
      'coverage/**',
    ],
  },
];

export default eslintConfig;
