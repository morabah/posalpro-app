/**
 * PosalPro MVP2 - Jest E2E Setup
 * Separate setup for Puppeteer E2E tests (no JSX)
 */

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

// Mock Next.js Image component (NO JSX - pure JS)
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => {
    // Return plain object instead of JSX
    return {
      type: 'img',
      props: { src, alt, ...props },
    };
  },
}));

// Mock NextAuth with authenticated session
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

// Mock Next.js cookies to bypass authentication
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: name => {
      if (name === 'next-auth.session-token') {
        return { value: 'mock-session-token' };
      }
      return undefined;
    },
    getAll: () => [],
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

// Mock React Query with more realistic implementations
jest.mock('@tanstack/react-query', () => ({
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
  QueryClient: jest.fn().mockImplementation(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    removeQueries: jest.fn(),
    clear: jest.fn(),
    mount: jest.fn(),
    unmount: jest.fn(),
  })),
  QueryClientProvider: jest.fn(({ children }) => children),
}));

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

// Mock crypto API for security tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
    subtle: {
      digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
  },
});

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
};

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
