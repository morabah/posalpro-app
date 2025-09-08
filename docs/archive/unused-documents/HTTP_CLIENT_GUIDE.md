# HTTP Client Guide

## Overview

The PosalPro MVP2 centralized HTTP client provides consistent error handling,
request ID tracking, and TypeScript support for all API communications. It
follows best practices for modern React applications and integrates seamlessly
with React Query.

## Features

- ✅ **Automatic Request ID Tracking**: Every request gets a unique ID for
  correlation
- ✅ **Consistent Error Handling**: Standardized error responses with proper
  typing
- ✅ **Request/Response Logging**: Comprehensive logging for debugging and
  monitoring
- ✅ **Retry Logic**: Automatic retries for network errors and 5xx responses
- ✅ **Timeout Handling**: Configurable timeouts with proper error messages
- ✅ **TypeScript Support**: Full type safety with generic responses
- ✅ **React Query Integration**: Seamless integration with TanStack Query
- ✅ **Backward Compatibility**: Works with existing code while providing new
  features

## Basic Usage

### Direct HTTP Client Usage

```typescript
import { http } from '@/lib/http';

// GET request
const products = await http.get<Product[]>('/api/products');

// POST request
const newProduct = await http.post<Product>('/api/products', {
  name: 'New Product',
  price: 99.99,
});

// PUT request
const updatedProduct = await http.put<Product>(`/api/products/${id}`, {
  name: 'Updated Product',
});

// DELETE request
await http.delete(`/api/products/${id}`);

// Generic request
const response = await http<ApiResponse<Product>>('/api/products', {
  method: 'PATCH',
  body: JSON.stringify({ price: 89.99 }),
});
```

### React Hook Usage

```typescript
import { useHttpClient } from '@/hooks/useHttpClient';

function MyComponent() {
  const { get, post, put, delete: del } = useHttpClient();

  const handleFetchData = async () => {
    try {
      const data = await get<MyDataType>('/api/my-endpoint');
      console.log(data);
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  const handleCreateData = async (payload: CreatePayload) => {
    try {
      const result = await post<MyDataType>('/api/my-endpoint', payload);
      console.log('Created:', result);
    } catch (error) {
      console.error('Creation failed:', error);
    }
  };
}
```

### React Query Integration

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { useHttpClient } from '@/hooks/useHttpClient';

// Query hook
export function useProducts() {
  const { get } = useHttpClient();

  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      return await get<Product[]>('/api/products');
    },
    staleTime: 30000,
    gcTime: 120000,
  });
}

// Mutation hook
export function useCreateProduct() {
  const { post } = useHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductCreate) => {
      return await post<Product>('/api/products', data);
    },
    onSuccess: newProduct => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.setQueryData(['products', newProduct.id], newProduct);
    },
  });
}
```

## Configuration

### Global Configuration

```typescript
import { HttpClient } from '@/lib/http';

// Create custom client with configuration
const customClient = new HttpClient({
  baseURL: 'https://api.example.com',
  defaultHeaders: {
    Authorization: 'Bearer token',
    'X-Custom-Header': 'value',
  },
  timeout: 60000, // 60 seconds
  retries: 3,
  retryDelay: 2000, // 2 seconds
});

// Use custom client
const data = await customClient.get<MyType>('/endpoint');
```

### Per-Request Configuration

```typescript
// Override configuration for specific request
const response = await http.get<MyType>('/api/endpoint', {
  timeout: 10000, // 10 seconds for this request
  headers: {
    'X-Special-Header': 'value',
  },
  retries: 0, // No retries for this request
});
```

## Error Handling

### Error Types

The HTTP client provides detailed error information:

```typescript
import { HttpClientError } from '@/lib/http';

try {
  const data = await http.get<MyType>('/api/endpoint');
} catch (error) {
  if (error instanceof HttpClientError) {
    console.log('Status:', error.status);
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('Request ID:', error.requestId);
    console.log('Details:', error.details);
  }
}
```

### Error Codes

- `NETWORK_ERROR`: Network connectivity issues
- `TIMEOUT`: Request timeout
- `PARSE_ERROR`: Response parsing failed
- `HTTP_ERROR`: HTTP error responses (4xx, 5xx)
- `UNKNOWN_ERROR`: Unexpected errors

### API Response Envelope

The client automatically handles API response envelopes:

```typescript
// Server returns: { ok: true, data: {...} }
const response = await http.get<MyType>('/api/endpoint');
// response is directly the data, not the envelope

// Server returns: { ok: false, code: 'ERROR', message: '...' }
try {
  const response = await http.get<MyType>('/api/endpoint');
} catch (error) {
  // error.message contains the server error message
  // error.code contains the server error code
}
```

## Logging

The HTTP client provides comprehensive logging:

```typescript
// Request start
logDebug('HTTP request start', {
  component: 'HttpClient',
  operation: 'makeRequest',
  url: '/api/products',
  method: 'GET',
  requestId: 'req_1234567890_abc123',
  attempt: 1,
});

// Request success
logInfo('HTTP request completed', {
  component: 'HttpClient',
  operation: 'makeRequest',
  url: '/api/products',
  method: 'GET',
  status: 200,
  duration: 150,
  requestId: 'req_1234567890_abc123',
  attempt: 1,
});

// Request failure
logError('HTTP request failed', {
  component: 'HttpClient',
  operation: 'makeRequest',
  url: '/api/products',
  method: 'GET',
  error: 'Network error',
  duration: 5000,
  requestId: 'req_1234567890_abc123',
  attempt: 1,
});
```

## Best Practices

### 1. Use React Query for Data Fetching

```typescript
// ✅ Good: Use React Query for data that needs caching
const { data, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: () => http.get<Product[]>('/api/products'),
});

// ❌ Avoid: Direct HTTP calls in components for data fetching
const [data, setData] = useState();
useEffect(() => {
  http.get('/api/products').then(setData);
}, []);
```

### 2. Use HTTP Client for Mutations

```typescript
// ✅ Good: Use HTTP client for mutations
const mutation = useMutation({
  mutationFn: data => http.post('/api/products', data),
  onSuccess: () => queryClient.invalidateQueries(['products']),
});

// ✅ Good: Use HTTP client for one-time operations
const handleExport = async () => {
  const data = await http.get('/api/export');
  downloadFile(data);
};
```

### 3. Proper Error Handling

```typescript
// ✅ Good: Handle errors properly
try {
  const data = await http.get<MyType>('/api/endpoint');
  // Handle success
} catch (error) {
  if (error instanceof HttpClientError) {
    // Handle specific HTTP errors
    if (error.status === 404) {
      // Handle not found
    } else if (error.status === 403) {
      // Handle forbidden
    }
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

### 4. Type Safety

```typescript
// ✅ Good: Use proper TypeScript types
interface Product {
  id: string;
  name: string;
  price: number;
}

const products = await http.get<Product[]>('/api/products');
// products is typed as Product[]

// ✅ Good: Use API response types
const response = await http.get<ApiResponse<Product[]>>('/api/products');
// response is typed as ApiResponse<Product[]>
```

### 5. Request ID Correlation

```typescript
// ✅ Good: Use request IDs for debugging
try {
  const data = await http.get<MyType>('/api/endpoint');
} catch (error) {
  if (error instanceof HttpClientError) {
    console.error(`Request ${error.requestId} failed:`, error.message);
    // Log request ID for correlation with server logs
  }
}
```

## Migration Guide

### From Old HTTP Client

If you're migrating from the old HTTP client:

```typescript
// Old way
import { http } from '@/lib/http';

const response = await http('/api/products');

// New way - same API, better features
import { http } from '@/lib/http';

const response = await http.get<Product[]>('/api/products');
// or
const response = await http<Product[]>('/api/products');
```

### From Fetch API

```typescript
// Old way with fetch
const response = await fetch('/api/products');
if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
const data = await response.json();

// New way with HTTP client
const data = await http.get<Product[]>('/api/products');
// Automatic error handling, request ID tracking, logging
```

## Examples

### Complete Product Management Example

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHttpClient } from '@/hooks/useHttpClient';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductCreate {
  name: string;
  price: number;
}

// Query keys
const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Hooks
export function useProducts(filters: string = '') {
  const { get } = useHttpClient();

  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const url = filters ? `/api/products?${filters}` : '/api/products';
      return await get<Product[]>(url);
    },
    staleTime: 30000,
    gcTime: 120000,
  });
}

export function useProduct(id: string) {
  const { get } = useHttpClient();

  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      return await get<Product>(`/api/products/${id}`);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateProduct() {
  const { post } = useHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductCreate) => {
      return await post<Product>('/api/products', data);
    },
    onSuccess: newProduct => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.setQueryData(productKeys.detail(newProduct.id), newProduct);
    },
  });
}

export function useUpdateProduct() {
  const { put } = useHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ProductCreate>;
    }) => {
      return await put<Product>(`/api/products/${id}`, data);
    },
    onSuccess: updatedProduct => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      );
    },
  });
}

export function useDeleteProduct() {
  const { delete: del } = useHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await del(`/api/products/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.removeQueries({ queryKey: productKeys.detail(deletedId) });
    },
  });
}
```

This HTTP client provides a robust, type-safe, and feature-rich solution for API
communication in the PosalPro MVP2 application.
