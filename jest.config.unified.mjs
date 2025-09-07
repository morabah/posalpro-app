import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Simplified test discovery - single unified test directory
  testMatch: [
    '<rootDir>/tests/**/*.test.(ts|tsx|js)',
    '<rootDir>/tests/**/*.spec.(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '<rootDir>/tests/e2e/', // E2E tests run separately
  ],
  // Clear project separation for better organization
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.(ts|tsx|js)'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: ['/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.*',
        '!src/**/*.spec.*',
        '!src/test/**', // Exclude old test structure
      ],
      coverageDirectory: '<rootDir>/tests/coverage/unit',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.(ts|tsx|js)'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: ['/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      testTimeout: 10000,
      collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.*',
        '!src/**/*.spec.*',
        '!src/test/**', // Exclude old test structure
      ],
      coverageDirectory: '<rootDir>/tests/coverage/integration',
    },
    {
      displayName: 'accessibility',
      testMatch: ['<rootDir>/tests/accessibility/**/*.test.(ts|tsx|js)'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: ['/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.*',
        '!src/**/*.spec.*',
        '!src/test/**', // Exclude old test structure
      ],
      coverageDirectory: '<rootDir>/tests/coverage/accessibility',
    },
    {
      displayName: 'api-routes',
      testMatch: ['<rootDir>/tests/api-routes/**/*.test.(ts|tsx|js)'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: ['/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      testTimeout: 15000,
      collectCoverageFrom: [
        'src/app/api/**/*.{ts,tsx,js,jsx}',
        '!src/app/api/**/*.test.*',
        '!src/app/api/**/*.spec.*',
        '!src/test/**', // Exclude old test structure
      ],
      coverageDirectory: '<rootDir>/tests/coverage/api-routes',
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/tests/security/**/*.test.(ts|tsx|js)'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: ['/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.*',
        '!src/**/*.spec.*',
        '!src/test/**', // Exclude old test structure
      ],
      coverageDirectory: '<rootDir>/tests/coverage/security',
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.(ts|tsx|js)'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.e2e.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))',
      ],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.*',
        '!src/**/*.spec.*',
        '!src/test/**', // Exclude old test structure
      ],
      coverageDirectory: '<rootDir>/tests/coverage/e2e',
    },
  ],

  // Unified coverage configuration
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
    '!src/test/**', // Exclude old test structure
    '!src/types/**',
    '!src/env.*',
    '!src/**/index.ts',
  ],

  // Performance optimizations
  maxWorkers: '50%',
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,

  // Global test configuration
  clearMocks: true,
  restoreMocks: true,
};

export default createJestConfig(customJestConfig);
