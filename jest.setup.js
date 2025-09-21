/**
 * PosalPro MVP2 - Jest Setup
 * Global test environment setup
 */

// Mock Prisma Client to prevent browser bundling issues in tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $use: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    // Mock all Prisma models as needed
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    proposal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    proposalVersion: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

// Import React for JSX transformations (prefixed with mock to satisfy Jest)
const mockReact = require('react');

// MSW Global polyfills - MUST be at the top before any imports
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

// MSW requires these globals in Node environment
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Map();
    }

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }

    text() {
      return Promise.resolve(this.body);
    }
  };
}

// Jest DOM setup (only when DOM is available)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@testing-library/jest-dom');
}

// MSW Server Setup - Temporarily disabled for integration testing
// import { server } from './src/test/mocks/server';

// MSW Server Setup
// beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// Mock next-auth to prevent ES module transformation errors
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      },
    })
  ),
}));

jest.mock('next-auth/providers/credentials', () =>
  jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
    credentials: {},
    authorize: jest.fn(() =>
      Promise.resolve({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      })
    ),
  }))
);

// Mock Next.js modules
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    reload: jest.fn(),
    route: '/test',
    pathname: '/test',
    query: {},
    asPath: '/test',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return mockReact.createElement('img', { src, alt, ...props });
  },
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'Administrator',
      },
      expires: '2025-12-31',
    },
    status: 'authenticated',
    update: jest.fn(),
  }),
  getSession: () =>
    Promise.resolve({
      user: {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'Administrator',
      },
      expires: '2025-12-31',
    }),
  SessionProvider: ({ children }) => children,
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock React Query with more realistic implementations
jest.mock('@tanstack/react-query', () => {
  // ✅ FIXED: Create a proper QueryClient constructor function that can be called with 'new'
  function QueryClient(options = {}) {
    this.options = options;
    this.invalidateQueries = jest.fn();
    this.setQueryData = jest.fn();
    this.getQueryData = jest.fn();
    this.removeQueries = jest.fn();
    this.clear = jest.fn();
    this.mount = jest.fn();
    this.unmount = jest.fn();

    // Make it chainable
    return this;
  }

  // Add prototype methods for proper inheritance
  QueryClient.prototype.invalidateQueries = jest.fn();
  QueryClient.prototype.setQueryData = jest.fn();
  QueryClient.prototype.getQueryData = jest.fn();
  QueryClient.prototype.removeQueries = jest.fn();
  QueryClient.prototype.clear = jest.fn();
  QueryClient.prototype.mount = jest.fn();
  QueryClient.prototype.unmount = jest.fn();

  return {
    useQuery: jest.fn(() => ({
      data: undefined,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
      refetch: jest.fn(),
      fetchStatus: 'idle',
      status: 'success',
    })),
    useInfiniteQuery: jest.fn(() => ({
      data: {
        pages: [
          {
            items: [],
            pagination: {
              limit: 20,
              hasNextPage: false,
              nextCursor: null,
            },
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
      isRefetching: false,
    })),
    useMutation: jest.fn(() => ({
      mutate: jest.fn(),
      mutateAsync: jest.fn(() => Promise.resolve()),
      isLoading: false,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: jest.fn(),
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
      removeQueries: jest.fn(),
      clear: jest.fn(),
    })),
    // ✅ FIXED: Proper QueryClient constructor that can be instantiated with 'new'
    QueryClient,
    QueryClientProvider: jest.fn(({ children }) => children),
    // ✅ FIXED: Add missing useQueries hook
    useQueries: jest.fn(() => []),
  };
});

// Mock React Hot Toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}));

// Mock Toast components
jest.mock('@/components/feedback/Toast/ToastProvider', () => ({
  ToastProvider: ({ children }) => children,
  useToast: () => ({
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      loading: jest.fn(),
      dismiss: jest.fn(),
    },
  }),
}));

// Mock window.matchMedia for responsive design tests (DOM only)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock IntersectionObserver for virtual scrolling tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }
};

// Mock ResizeObserver for responsive component tests
global.ResizeObserver = class ResizeObserver {
  constructor() {
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }
};

// Mock PerformanceObserver for performance tests
global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock performance API (DOM only)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'performance', {
    writable: true,
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn(() => []),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn(),
      navigation: {
        type: 0,
      },
      timing: {
        navigationStart: Date.now(),
        loadEventEnd: Date.now() + 1000,
      },
    },
  });
}

// Minimal polyfills for Headers and Blob in Node
if (typeof global.Headers === 'undefined') {
  class SimpleHeaders {
    constructor(init = {}) {
      this.map = new Map(Object.entries(init));
    }
    append(key, value) {
      this.map.set(key, value);
    }
    get(key) {
      return this.map.get(key);
    }
    set(key, value) {
      this.map.set(key, value);
    }
    entries() {
      return this.map.entries();
    }
  }
  // @ts-ignore
  global.Headers = SimpleHeaders;
}
if (typeof global.Blob === 'undefined') {
  // @ts-ignore
  global.Blob = class Blob {
    constructor() {}
  };
}

// Mock crypto API for security tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
    subtle: {
      digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
  },
});

// Mock localStorage and sessionStorage with all required methods (DOM only)
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  get length() {
    return 0;
  },
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockStorage,
    writable: true,
  });
}

// Mock geolocation API (browser only)
if (typeof navigator !== 'undefined') {
  if (!navigator.geolocation) {
    navigator.geolocation = {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    };
  }
}

// Mock clipboard API for copy/paste functionality (browser only)
if (typeof navigator !== 'undefined') {
  if (!Object.prototype.hasOwnProperty.call(navigator, 'clipboard')) {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(() => Promise.resolve()),
        readText: jest.fn(() => Promise.resolve('mock clipboard text')),
      },
      writable: true,
      configurable: true,
    });
  }
}

// Mock Web Workers
global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
  })
);

// Mock Next.js Request/Response for API route testing
global.Request = class MockRequest {
  constructor(url, options = {}) {
    // Use Object.defineProperty to handle read-only url property
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    this.method = options.method || 'GET';
    this.headers = new Headers(options.headers || {});
    this.body = options.body || null;
  }

  async json() {
    return this.body ? JSON.parse(this.body) : {};
  }

  async text() {
    return this.body || '';
  }
};

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers || {});
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
};

// Mock NextResponse for Next.js API routes
jest.mock('next/server', () => {
  class MockNextResponse extends global.Response {
    constructor(body, init = {}) {
      super(body, init);
    }

    static json(data, init = {}) {
      const response = new MockNextResponse(JSON.stringify(data), {
        status: init.status || 200,
        statusText: init.statusText || 'OK',
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });
      return response;
    }

    static redirect(url, status = 302) {
      return new MockNextResponse(null, {
        status,
        headers: { Location: url },
      });
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: jest.fn().mockImplementation((url, options = {}) => {
      return new global.Request(url, options);
    }),
  };
});

// Mock File and FileReader for upload tests
global.File = jest.fn().mockImplementation((content, filename, options = {}) => ({
  name: filename,
  size: content.length,
  type: options.type || 'text/plain',
  lastModified: Date.now(),
}));

global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  result: null,
  error: null,
  onload: null,
  onerror: null,
  onloadend: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock URL.createObjectURL for file upload tests
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress specific warnings/errors that are expected in tests
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clear all mocks between tests
afterEach(() => {
  jest.clearAllMocks();

  // Clear localStorage and sessionStorage using our mock methods (DOM only)
  if (typeof window !== 'undefined') {
    if (window.localStorage && typeof window.localStorage.clear === 'function') {
      window.localStorage.clear();
    }
    if (window.sessionStorage && typeof window.sessionStorage.clear === 'function') {
      window.sessionStorage.clear();
    }
  }

  // Reset fetch mock
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});

// Global test utilities
global.testUtils = {
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Administrator',
    status: 'Active',
    createdAt: new Date('2024-01-01'),
    lastActive: new Date(),
    ...overrides,
  }),

  // Create mock proposal
  createMockProposal: (overrides = {}) => ({
    id: 'test-proposal-1',
    name: 'Test Proposal',
    client: 'Test Client',
    status: 'Draft',
    progress: 50,
    deadline: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }),

  // Create mock API response
  createMockApiResponse: (data = {}, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  }),

  // Wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Trigger resize event
  triggerResize: (width = 1024, height = 768) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  },

  // Mock intersection observer entry
  createIntersectionObserverEntry: (isIntersecting = true) => ({
    isIntersecting,
    target: document.createElement('div'),
    intersectionRatio: isIntersecting ? 1 : 0,
    rootBounds: null,
    boundingClientRect: {
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
    },
    intersectionRect: isIntersecting
      ? {
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
        }
      : {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
        },
    time: Date.now(),
  }),
};

// Error boundary for testing
global.TestErrorBoundary = class extends mockReact.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Test Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return mockReact.createElement('div', { 'data-testid': 'error-boundary' }, 'Something went wrong.');
    }

    return this.props.children;
  }
};

// MSW Server Setup - Temporarily commented out due to TextEncoder issues
// import { server } from './src/test/mocks/api.mock';

// // Establish API mocking before all tests
// beforeAll(() => {
//   server.listen({ onUnhandledRequest: 'warn' });
// });

// // Reset any request handlers that we may add during the tests,
// // so they don't affect other tests
// afterEach(() => {
//   server.resetHandlers();
// });

// // Clean up after the tests are finished
// afterAll(() => {
//   server.close();
// });

// Increase default timeout for all tests
jest.setTimeout(30000);

// Suppress console output during tests
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}
