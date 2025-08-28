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
export const ok = <T>(data: T): ApiResponse<T> => ({ ok: true, data });

// Helper function for cursor paginated responses
export const okPaginated = <T>(
  items: T[],
  nextCursor: string | null,
  meta?: Record<string, unknown>
): ApiResponse<CursorPaginatedResponse<T>> => ({
  ok: true,
  data: {
    items,
    nextCursor,
    meta,
  },
});

// Helper function to create error responses
export const error = (code: string, message: string, details?: unknown): ApiResponse<never> => ({
  ok: false,
  code,
  message,
  details,
});

// Alias for error function to match acceptance criteria
export const fail = (code: string, message: string, details?: unknown): ApiResponse<never> => ({
  ok: false,
  code,
  message,
  details,
});

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
): ApiResponse<PaginatedResponse<T>> => {
  return ok({
    items,
    pagination: {
      limit,
      hasNextPage,
      nextCursor,
    },
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
): ApiResponse<ListResponse<T>> => {
  return ok({
    items,
    total,
    page,
    limit,
  });
};

// Helper function to create single item responses
export const single = <T>(item: T): ApiResponse<T> => {
  return ok(item);
};

// Helper function to create empty success responses
export const success = (): ApiResponse<null> => {
  return ok(null);
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
): ApiResponse<BulkResponse> => {
  return ok({
    processed,
    successful,
    failed,
    errors,
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
