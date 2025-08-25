// Request correlation ID generation and management
export function getOrCreateRequestId(request: Request): string {
  // Try to get existing request ID from headers
  const existingId = request.headers.get('x-request-id');
  if (existingId) {
    return existingId;
  }

  // Generate new request ID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Generate a new request ID (for cases where we need a fresh ID)
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Validate request ID format
export function isValidRequestId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // UUID format validation (for crypto.randomUUID generated IDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return true;
  }

  // Fallback format validation (for Math.random generated IDs)
  const fallbackRegex = /^[a-z0-9]{10,}$/i;
  return fallbackRegex.test(id);
}

// Extract request ID from various sources
export function extractRequestId(request: Request): string | null {
  // Check headers first
  const headerId = request.headers.get('x-request-id');
  if (headerId && isValidRequestId(headerId)) {
    return headerId;
  }

  // Check URL parameters
  const url = new URL(request.url);
  const paramId = url.searchParams.get('requestId');
  if (paramId && isValidRequestId(paramId)) {
    return paramId;
  }

  return null;
}

// Add request ID to response headers
export function addRequestIdToHeaders(headers: Headers, requestId: string): void {
  headers.set('x-request-id', requestId);
}

// Create headers with request ID
export function createHeadersWithRequestId(requestId: string): Headers {
  const headers = new Headers();
  addRequestIdToHeaders(headers, requestId);
  return headers;
}
