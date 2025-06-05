const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Fixed: moduleNameMapper instead of moduleNameMapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },

  // Transform configuration for TypeScript and JSX
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  testMatch: ['<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  testTimeout: 30000, // Increased timeout for async operations
  clearMocks: true,
  restoreMocks: true, // Added for better mock cleanup
  passWithNoTests: true,

  // Transform ES modules that need compilation
  transformIgnorePatterns: ['node_modules/(?!(react-error-boundary)/)'],

  // Coverage configuration
  collectCoverage: false, // Only when explicitly requested
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/test/**',
    '!src/lib/testing/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Performance optimizations
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Test setup files
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',

  // Better error reporting
  verbose: false,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
      },
    ],
  ],
};

module.exports = createJestConfig(customJestConfig);
