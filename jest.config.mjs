import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test environment for React components
  testEnvironment: 'jest-environment-jsdom',
  
  // The directories that Jest should look for tests in
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Files/directories to ignore for coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/jest.config.js',
    '/jest.setup.js'
  ],
  
  // Minimum coverage threshold to enforce
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Custom test reporters
  reporters: ['default'],
  
  // Test paths to exclude
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/cypress/'
  ],
  
  // Module name mapper to handle assets like stylesheets, images
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.(svg|css|less|scss|png|jpg|jpeg|ttf|woff|woff2)$': 'jest-transform-stub'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // Files that should be ignored
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/.next/'
  ]
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
