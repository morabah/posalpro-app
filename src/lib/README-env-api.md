# Environment Configuration & API Client Foundation

## Overview

This document provides comprehensive documentation for the environment
configuration management and API client infrastructure implemented in Phase 1.4
of the PosalPro MVP2 project.

## Table of Contents

1. [Environment Configuration (`env.ts`)](#environment-configuration)
2. [API Client Foundation (`api.ts`)](#api-client-foundation)
3. [Testing Infrastructure (`test-env-api.ts`)](#testing-infrastructure)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Environment Configuration

### Features

- **Type-safe Environment Variables**: Strongly typed configuration with
  validation
- **Multi-environment Support**: Development, staging, production, and test
  environments
- **Configuration Validation**: Comprehensive validation with error reporting
- **Environment-specific Defaults**: Intelligent defaults based on deployment
  environment
- **Integration with Logging**: Built-in logging for configuration events

### Configuration Structure

```typescript
interface AppConfig {
  // Environment settings
  nodeEnv: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  isTest: boolean;

  // Application settings
  port: number;
  host: string;
  appName: string;
  appVersion: string;

  // Database configuration
  database: {
    url: string;
    maxConnections: number;
    timeout: number;
    ssl: boolean;
  };

  // API configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };

  // Authentication configuration
  auth: {
    jwtSecret: string;
    jwtExpiration: string;
    apiKey: string;
    refreshTokenExpiration: string;
  };

  // External services
  services: {
    logging: {
      endpoint?: string;
      level: string;
      enableRemote: boolean;
    };
    analytics: {
      trackingId?: string;
      enabled: boolean;
    };
    storage: {
      provider: string;
      bucket?: string;
      region?: string;
    };
  };

  // Security settings
  security: {
    corsOrigins: string[];
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    encryptionKey: string;
  };

  // Feature flags
  features: {
    enableMetrics: boolean;
    enableDebugMode: boolean;
    enableExperimentalFeatures: boolean;
    maintenanceMode: boolean;
  };
}
```

### Environment Variables

#### Required Variables

- `NODE_ENV`: Environment type (development, staging, production, test)
- `DATABASE_URL`: Database connection string (except in test)
- `API_BASE_URL`: Base URL for API requests (except in development)
- `JWT_SECRET`: JWT signing secret (except in development)
- `API_KEY`: API authentication key (except in development)
- `ENCRYPTION_KEY`: Data encryption key (except in development)

#### Optional Variables

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)
- `APP_NAME`: Application name (default: PosalPro MVP2)
- `APP_VERSION`: Application version (default: 1.0.0)

#### Database Configuration

- `DATABASE_MAX_CONNECTIONS`: Maximum database connections (default: 10)
- `DATABASE_TIMEOUT`: Database query timeout (default: 30000ms)
- `DATABASE_SSL`: Enable SSL for database (default: true in production)

#### API Configuration

- `API_TIMEOUT`: Request timeout (default: 10000ms)
- `API_RETRY_ATTEMPTS`: Maximum retry attempts (default: 3)
- `API_RETRY_DELAY`: Initial retry delay (default: 1000ms)

#### Authentication

- `JWT_EXPIRATION`: JWT token expiration (default: 1h)
- `REFRESH_TOKEN_EXPIRATION`: Refresh token expiration (default: 7d)

#### Services

- `LOGGING_ENDPOINT`: Remote logging endpoint (optional)
- `LOGGING_LEVEL`: Log level (default: debug in dev, info in prod)
- `ANALYTICS_TRACKING_ID`: Analytics tracking ID (optional)
- `STORAGE_PROVIDER`: Storage provider (default: local)
- `STORAGE_BUCKET`: Storage bucket name (optional)
- `STORAGE_REGION`: Storage region (optional)

#### Security

- `CORS_ORIGINS`: Allowed CORS origins (default: localhost:3000 in dev)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window (default: 900000ms)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)

#### Feature Flags

- `ENABLE_METRICS`: Enable metrics collection (default: true)
- `ENABLE_DEBUG_MODE`: Enable debug mode (default: true in dev)
- `ENABLE_EXPERIMENTAL_FEATURES`: Enable experimental features (default: false)
- `MAINTENANCE_MODE`: Enable maintenance mode (default: false)

### Usage Examples

```typescript
import {
  getConfig,
  getCurrentEnvironment,
  getDatabaseConfig,
  getApiConfig,
  getAuthConfig,
  getFeatureFlags,
} from '@/lib/env';

// Get full configuration
const config = getConfig();
console.log('Current environment:', config.nodeEnv);

// Get current environment
const env = getCurrentEnvironment();
if (env === Environment.PRODUCTION) {
  // Production-specific logic
}

// Get specific configuration sections
const dbConfig = getDatabaseConfig();
const apiConfig = getApiConfig();
const authConfig = getAuthConfig();
const features = getFeatureFlags();

// Check feature flags
if (features.enableMetrics) {
  // Enable metrics collection
}
```

## API Client Foundation

### Features

- **Standardized HTTP Client**: Support for all HTTP methods (GET, POST, PUT,
  PATCH, DELETE, HEAD, OPTIONS)
- **Authentication Integration**: Bearer token and API key authentication
- **Comprehensive Error Handling**: Categorized error types with detailed error
  information
- **Retry Mechanisms**: Exponential backoff for resilient API calls
- **Request/Response Caching**: Intelligent caching with TTL support
- **Interceptors**: Request and response interceptors for custom logic
- **Performance Monitoring**: Built-in performance tracking integration
- **Rate Limiting**: Client-side rate limiting protection

### API Client Configuration

```typescript
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  defaultRetryAttempts: number;
  defaultRetryDelay: number;
  defaultHeaders: Record<string, string>;
  enableLogging: boolean;
  enablePerformanceTracking: boolean;
  maxCacheSize: number;
  cacheTimeout: number;
}
```

### Error Types

```typescript
enum ApiErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}
```

### Usage Examples

#### Basic HTTP Methods

```typescript
import { get, post, put, patch, del } from '@/lib/api';

// GET request
const users = await get<User[]>('/users');

// POST request
const newUser = await post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// PUT request
const updatedUser = await put<User>(`/users/${userId}`, userData);

// PATCH request
const partialUpdate = await patch<User>(`/users/${userId}`, {
  name: 'Jane Doe',
});

// DELETE request
await del(`/users/${userId}`);
```

#### Advanced Configuration

```typescript
import { get, post } from '@/lib/api';

// Request with custom configuration
const response = await get<Data>('/sensitive-data', {
  timeout: 30000,
  retryAttempts: 5,
  authType: 'api-key',
  headers: {
    'X-Custom-Header': 'value',
  },
});

// Request with custom authentication
const customAuthResponse = await post<Result>('/custom-endpoint', data, {
  customAuth: headers => ({
    ...headers,
    Authorization: `Custom ${customToken}`,
  }),
});
```

#### Error Handling

```typescript
import { get, ApiError, ApiErrorType } from '@/lib/api';

try {
  const data = await get<Data>('/api/endpoint');
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.type) {
      case ApiErrorType.AUTHENTICATION:
        // Handle authentication error
        redirectToLogin();
        break;
      case ApiErrorType.NETWORK:
        // Handle network error
        showNetworkErrorMessage();
        break;
      case ApiErrorType.RATE_LIMIT:
        // Handle rate limit
        scheduleRetry();
        break;
      default:
        // Handle other errors
        showGenericErrorMessage();
    }
  }
}
```

#### Interceptors

```typescript
import { addRequestInterceptor, addResponseInterceptor } from '@/lib/api';

// Add request interceptor
addRequestInterceptor({
  onRequest: async (config, url) => {
    // Add custom headers or modify request
    config.headers = {
      ...config.headers,
      'X-Request-ID': generateRequestId(),
    };
    return { config, url };
  },
});

// Add response interceptor
addResponseInterceptor({
  onResponse: async response => {
    // Log successful responses
    console.log(`Request to ${response.config.url} completed`);
    return response;
  },
  onError: async error => {
    // Global error handling
    if (error.status === 401) {
      await refreshToken();
    }
    return error;
  },
});
```

#### Custom API Client

```typescript
import { createApiClient } from '@/lib/api';

// Create custom client for specific service
const customClient = createApiClient({
  baseURL: 'https://api.external-service.com',
  timeout: 15000,
  defaultHeaders: {
    'X-Service-Key': 'service-specific-key',
  },
});

const externalData = await customClient.get('/data');
```

## Testing Infrastructure

### Test Coverage

The testing infrastructure provides comprehensive validation for:

#### Environment Configuration Tests

1. **Environment Detection**: Validates environment detection and classification
2. **Configuration Loading**: Ensures all required configuration sections are
   present
3. **Environment Validation**: Checks configuration validation and error
   handling
4. **Configuration Access**: Tests access to different configuration sections
5. **Environment-specific Behavior**: Validates environment-specific defaults
   and behaviors

#### API Client Tests

1. **HTTP Methods**: Tests all HTTP method implementations
2. **Authentication Integration**: Validates authentication header addition
3. **Error Handling**: Tests different error types and categorization
4. **Retry Mechanisms**: Validates retry logic with exponential backoff
5. **Caching**: Tests caching functionality and cache management
6. **Interceptors**: Validates request and response interceptor functionality
7. **Performance Tracking**: Tests integration with performance monitoring

### Running Tests

```typescript
import { runEnvApiTests } from '@/lib/test-env-api';

// Run all tests
const results = await runEnvApiTests();

console.log('Overall passed:', results.overall.passed);
console.log('Success rate:', results.overall.successRate);
console.log('Environment tests:', results.environmentTests.passed);
console.log('API tests:', results.apiTests.passed);
```

### Test Dashboard

Access the visual test dashboard at `/test-env-api` to:

- Run tests interactively
- View detailed test results
- Monitor test performance
- Debug failed tests

## Best Practices

### Environment Configuration

1. **Security**: Never commit sensitive environment variables to version control
2. **Validation**: Always validate environment variables on application startup
3. **Defaults**: Provide sensible defaults for development environments
4. **Documentation**: Document all environment variables and their purposes
5. **Type Safety**: Use TypeScript interfaces for configuration structure

### API Client Usage

1. **Error Handling**: Always handle API errors appropriately
2. **Timeouts**: Set appropriate timeouts for different types of requests
3. **Retries**: Use retry mechanisms for non-idempotent operations carefully
4. **Caching**: Cache GET requests when appropriate to improve performance
5. **Authentication**: Always use secure authentication methods in production

### Performance Optimization

1. **Connection Pooling**: Use connection pooling for database connections
2. **Request Batching**: Batch multiple API requests when possible
3. **Cache Management**: Implement appropriate cache invalidation strategies
4. **Monitoring**: Monitor API performance and error rates
5. **Rate Limiting**: Respect API rate limits and implement client-side limiting

## Troubleshooting

### Common Issues

#### Environment Configuration

**Issue**: Configuration validation fails in production **Solution**: Ensure all
required environment variables are set with appropriate values

**Issue**: Wrong environment detected **Solution**: Check NODE_ENV environment
variable is set correctly

**Issue**: Database connection fails **Solution**: Verify DATABASE_URL and
database accessibility

#### API Client

**Issue**: Authentication failures **Solution**: Check JWT_SECRET and API_KEY
configuration

**Issue**: Timeout errors **Solution**: Increase timeout values or check network
connectivity

**Issue**: Rate limit errors **Solution**: Implement exponential backoff or
reduce request frequency

### Debug Mode

Enable debug mode in development to get detailed logging:

```bash
ENABLE_DEBUG_MODE=true
LOGGING_LEVEL=debug
```

### Monitoring

Monitor the following metrics:

- Configuration loading time
- API request success rates
- Response times
- Error rates by type
- Cache hit rates

## Integration Points

### Logging Integration

- Environment configuration events are logged with appropriate levels
- API requests and responses are logged with performance metrics
- Errors are logged with full context and stack traces

### Performance Monitoring

- Configuration loading performance is tracked
- API request performance is measured and reported
- Cache performance metrics are collected

### Validation Tracking

- Configuration validation results are recorded
- API client functionality is validated during tests
- Phase completion is tracked for project progress

## Version History

- **v1.0.0**: Initial implementation with comprehensive environment
  configuration and API client foundation
- Environment-aware configuration with validation
- Full HTTP method support with authentication
- Retry mechanisms and error handling
- Caching and performance monitoring
- Comprehensive testing infrastructure

## Dependencies

- **Logging**: Integrates with `@/lib/logger` for structured logging
- **Performance**: Uses `@/lib/performance` for performance tracking
- **Validation**: Integrates with `@/lib/validationTracker` for progress
  tracking

## Security Considerations

- Environment variables are validated for security requirements
- Authentication tokens are properly handled and never logged
- Sensitive configuration is protected from accidental exposure
- API requests use secure communication protocols
- Rate limiting protects against abuse

## Performance Considerations

- Configuration is loaded once at startup and cached
- API client uses connection pooling and keep-alive
- Response caching reduces redundant requests
- Performance monitoring helps identify bottlenecks
- Memory usage is managed through cache size limits
