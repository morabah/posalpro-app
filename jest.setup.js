// Import testing utilities
import '@testing-library/jest-dom';

// Import any custom test utilities or global mocks here
import { mockRouter } from './src/test/mocks/router.mock';
import { mockSession } from './src/test/mocks/session.mock';
import { mockUseTranslation } from './src/test/mocks/i18n.mock';

// Add custom jest matchers
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received);
    return {
      pass,
      message: () => `expected ${received} to be a valid date`,
    };
  },
  // Add more custom matchers as needed
});

// Setup global mocks
jest.mock('next/router', () => mockRouter);
jest.mock('next-auth/react', () => mockSession);
jest.mock('react-i18next', () => mockUseTranslation);

// Mock browser APIs that aren't available in Jest environment
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    media: '',
    onchange: null,
  };
};

// Mock ResizeObserver which isn't available in Jest environment
global.ResizeObserver = global.ResizeObserver || jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock console errors/warnings during tests to keep output clean
global.console = {
  ...console,
  // Uncomment to silence specific console methods during tests
  // error: jest.fn(),
  // warn: jest.fn(),
  // log: jest.fn(),
};

// Mock IntersectionObserver for components using it
if (typeof window !== 'undefined') {
  window.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  // Add any cleanup code here
});
