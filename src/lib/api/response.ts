/**
 * PosalPro MVP2 - API Response Types
 * Standardized response formats for consistent API communication
 */

// Standard API response envelope
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; details?: unknown };

// Cursor pagination response format (recommended for all lists)
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  meta?: {
    total?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

// Helper function for successful responses
export const ok = <T>(data: T, status: number = 200): Response => {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Helper function for cursor paginated responses
export const okPaginated = <T>(
  items: T[],
  nextCursor: string | null,
  meta?: Record<string, unknown>,
  status: number = 200
): Response => {
  return new Response(JSON.stringify({
    ok: true,
    data: {
      items,
      nextCursor,
      meta,
    },
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Helper function to create error responses
export const error = (code: string, message: string, details?: unknown, status: number = 400): Response => {
  return new Response(JSON.stringify({
    ok: false,
    code,
    message,
    details,
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Alias for error function to match acceptance criteria
export const fail = (code: string, message: string, details?: unknown, status: number = 400): Response => {
  return new Response(JSON.stringify({
    ok: false,
    code,
    message,
    details,
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Helper function to create paginated responses
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    limit: number;
    hasNextPage: boolean;
    nextCursor?: string | null;
  };
}

export const paginated = <T>(
  items: T[],
  limit: number,
  hasNextPage: boolean,
  nextCursor?: string | null
): Response => {
  return new Response(JSON.stringify({
    ok: true,
    data: {
      items,
      pagination: {
        limit,
        hasNextPage,
        nextCursor,
      },
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Helper function to create list responses (for backward compatibility)
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const list = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): Response => {
  return new Response(JSON.stringify({
    ok: true,
    data: {
      items,
      total,
      page,
      limit,
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Helper function to create single item responses
export const single = <T>(item: T): Response => {
  return new Response(JSON.stringify({
    ok: true,
    data: item,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Helper function to create empty success responses
export const success = (): Response => {
  return new Response(JSON.stringify({
    ok: true,
    data: null,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Helper function to create bulk operation responses
export interface BulkResponse {
  processed: number;
  successful: number;
  failed: number;
  errors?: { id: string; error: string }[];
}

export const bulk = (
  processed: number,
  successful: number,
  failed: number,
  errors?: { id: string; error: string }[]
): Response => {
  return new Response(JSON.stringify({
    ok: true,
    data: {
      processed,
      successful,
      failed,
      errors,
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Type guards for response checking
export const isSuccess = <T>(response: ApiResponse<T>): response is { ok: true; data: T } => {
  return response.ok === true;
};

export const isError = <T>(
  response: ApiResponse<T>
): response is { ok: false; code: string; message: string; details?: unknown } => {
  return response.ok === false;
};

// Extract data from response (with error handling)
export const extractData = <T>(response: ApiResponse<T>): T => {
  if (isSuccess(response)) {
    return response.data;
  }
  throw new Error(`API Error: ${response.code} - ${response.message}`);
};

// Extract error from response (with type safety)
export const extractError = <T>(
  response: ApiResponse<T>
): { code: string; message: string; details?: unknown } => {
  if (isError(response)) {
    return {
      code: response.code,
      message: response.message,
      details: response.details,
    };
  }
  throw new Error('Response is not an error');
};
