// Typed API response envelopes for consistent API responses
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; details?: unknown };

// Helper function to create successful responses
export const ok = <T>(data: T): ApiResponse<T> => ({
  ok: true,
  data,
});

// Helper function to create error responses
export const error = (code: string, message: string, details?: unknown): ApiResponse<never> => ({
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
  errors?: Array<{ id: string; error: string }>;
}

export const bulk = (
  processed: number,
  successful: number,
  failed: number,
  errors?: Array<{ id: string; error: string }>
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
