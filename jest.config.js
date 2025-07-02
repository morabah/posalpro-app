const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  verbose: true,
  maxWorkers: '50%',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|openid-client|msw))',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
  ],
  // Enhanced coverage thresholds aligned with COMPREHENSIVE_TEST_STRATEGY_PLAN.md
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Critical gaps validation - highest standards
    'src/test/critical-gaps/**/*': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // API routes type safety
    'src/app/api/**/*': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Authentication flows - critical path
    'src/components/auth/**/*': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Mobile components - high standards
    'src/components/mobile/**/*': {
      branches: 95,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  // Test organization and reporting
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        suiteName: 'PosalPro MVP2 Test Suite',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: 'test-results/html',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
      },
    ],
  ],
  // Performance and resource management
  maxConcurrency: 5,
  clearMocks: true,
  restoreMocks: true,
};

module.exports = createJestConfig(customJestConfig);
