/**
 * Next.js Router Mock
 *
 * This mock implements the Next.js router functionality for testing purposes.
 * It provides all common router methods and properties with sensible defaults.
 */

export const mockRouter = {
  basePath: '',
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  push: jest.fn().mockResolvedValue(true),
  replace: jest.fn().mockResolvedValue(true),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
};

/**
 * Resets all mock functions in the router mock
 */
export const resetRouterMock = (): void => {
  Object.values(mockRouter).forEach(value => {
    if (typeof value === 'function' && 'mockReset' in value) {
      value.mockReset();
    }
  });

  Object.values(mockRouter.events).forEach(value => {
    if (typeof value === 'function' && 'mockReset' in value) {
      value.mockReset();
    }
  });
};

/**
 * Sets up a specific route for testing
 */
export const setupRouterMock = (overrides: Partial<typeof mockRouter>) => {
  Object.assign(mockRouter, overrides);
  return mockRouter;
};
