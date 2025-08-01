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
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|@panva/hkdf|openid-client|dexie|uuid|msw))',
  ],
  testTimeout: 30000,
  verbose: true,
  maxWorkers: '50%',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

export default createJestConfig(customJestConfig);
