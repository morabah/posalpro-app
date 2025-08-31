import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // This is the key: it tells Jest to NOT ignore these modules for transformation.
  transformIgnorePatterns: ['/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  verbose: true,
  maxWorkers: '50%',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
    'src/test/**/*.(test|spec).(ts|tsx|js)',
  ],

  // Configure Puppeteer tests to use Node environment
  projects: [
      {
        displayName: 'unit',
        testMatch: [
          '**/__tests__/**/*.(ts|tsx|js)',
          '**/*.(test|spec).(ts|tsx|js)',
          'src/test/**/*.(test|spec).(ts|tsx|js)',
        ],
        testEnvironment: 'jsdom',
        setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
        moduleNameMapper: {
          '^@/(.*)$': '<rootDir>/src/$1',
        },
        transformIgnorePatterns: ['/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))'],
        transform: {
          '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
        },
      },
    {
      displayName: 'e2e',
      testMatch: ['**/test/proposal-wizard-puppeteer.test.ts'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.e2e.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))',
      ],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      testTimeout: 60000,
    },
  ],
  // Phase 3: Establish baseline coverage thresholds (to be raised over time)
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 10,
      lines: 15,
      statements: 15,
    },
  },
};

export default createJestConfig(customJestConfig);
