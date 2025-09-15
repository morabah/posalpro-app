// Document Serving API Route - Option 2: Network URLs for Document Preview
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
// User Story: US-4.1 (Product Management)
// Hypothesis: H5 (Modern data fetching improves performance and user experience)
//
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - Performance monitoring and security
// ✅ ALIGNS: Modern API patterns with proper error handling
// ✅ IMPLEMENTS: Document proxy for network URL preview

import { logDebug, logError, logInfo } from '@/lib/logger';

// Supported file extensions for document preview
const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf'];

// Check if URL is safe to proxy
function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    logDebug('API: URL validation debug', {
      component: 'DocumentProxyAPI',
      operation: 'isSafeUrl',
      url: url.substring(0, 100) + '...',
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      nodeEnv: process.env.NODE_ENV,
    });

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      logDebug('API: URL blocked - invalid protocol', {
        component: 'DocumentProxyAPI',
        operation: 'isSafeUrl',
        protocol: parsedUrl.protocol,
      });
      return false;
    }

    // Allow localhost/127.0.0.1 in development, block in production (security)
    if (process.env.NODE_ENV === 'production') {
      if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
        logDebug('API: URL blocked - localhost in production', {
          component: 'DocumentProxyAPI',
          operation: 'isSafeUrl',
          hostname: parsedUrl.hostname,
        });
        return false;
      }
    }

    // Check file extension
    const pathname = parsedUrl.pathname.toLowerCase();
    const hasSupportedExtension = SUPPORTED_EXTENSIONS.some(ext => pathname.endsWith(ext));

    logDebug('API: URL extension check', {
      component: 'DocumentProxyAPI',
      operation: 'isSafeUrl',
      pathname,
      hasSupportedExtension,
      supportedExtensions: SUPPORTED_EXTENSIONS,
    });

    if (!hasSupportedExtension) {
      logDebug('API: URL blocked - unsupported extension', {
        component: 'DocumentProxyAPI',
        operation: 'isSafeUrl',
        pathname,
      });
      return false;
    }

    logDebug('API: URL validation passed', {
      component: 'DocumentProxyAPI',
      operation: 'isSafeUrl',
    });

    return true;
  } catch (error) {
    logDebug('API: URL validation error', {
      component: 'DocumentProxyAPI',
      operation: 'isSafeUrl',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// GET /api/documents?url=<document-url>
// Proxies document from network URL for preview - NO AUTHENTICATION REQUIRED
export const GET = async (req: Request): Promise<Response> => {
  const startTime = performance.now();
  const url = new URL(req.url);
  const encodedUrl = url.searchParams.get('url');
  const filename = url.searchParams.get('filename');

  // Decode the URL since it gets double-encoded in query parameters
  const queryUrl = encodedUrl ? decodeURIComponent(encodedUrl) : null;

  logDebug('API: Proxying document from URL', {
    component: 'DocumentProxyAPI',
    operation: 'GET /api/documents',
    originalEncodedUrl: encodedUrl?.substring(0, 100) + '...',
    decodedUrl: queryUrl?.substring(0, 100) + '...', // Log truncated URL for security
    filename,
  });

  try {
    // Validate URL parameter
    if (!queryUrl) {
      return new Response('Missing URL parameter', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Validate URL safety
    if (!isSafeUrl(queryUrl)) {
      logError('API: Unsafe URL blocked', {
        component: 'DocumentProxyAPI',
        operation: 'GET /api/documents',
        encodedUrl: encodedUrl?.substring(0, 100) + '...',
        decodedUrl: queryUrl?.substring(0, 100) + '...',
        reason: 'URL validation failed',
      });

      return new Response('Invalid or unsafe URL', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Fetch document from URL
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'PosalPro-Document-Preview/1.0',
        Accept: '*/*',
      },
      // Set reasonable timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      logError('API: Failed to fetch document', {
        component: 'DocumentProxyAPI',
        operation: 'GET /api/documents',
        status: response.status,
        statusText: response.statusText,
        url: queryUrl?.substring(0, 100) + '...',
      });

      return new Response(`Failed to fetch document: ${response.statusText}`, {
        status: response.status,
      });
    }

    // Get content type and size
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Validate content type for security
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/rtf',
      'application/rtf',
    ];

    if (!allowedTypes.some(type => contentType.includes(type))) {
      logError('API: Unsupported content type blocked', {
        component: 'DocumentProxyAPI',
        operation: 'GET /api/documents',
        contentType,
        url: queryUrl?.substring(0, 100) + '...',
      });

      return new Response('Unsupported file type', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (contentLength && parseInt(contentLength) > maxSize) {
      logError('API: File too large', {
        component: 'DocumentProxyAPI',
        operation: 'GET /api/documents',
        size: contentLength,
        maxSize,
        url: queryUrl?.substring(0, 100) + '...',
      });

      return new Response('File too large (max 50MB)', {
        status: 413,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Get response data
    const data = await response.arrayBuffer();
    const loadTime = performance.now() - startTime;

    logInfo('API: Document proxied successfully', {
      component: 'DocumentProxyAPI',
      operation: 'GET /api/documents',
      contentType,
      size: data.byteLength,
      loadTime: Math.round(loadTime),
      url: queryUrl?.substring(0, 100) + '...',
    });

    // Return proxied document with proper headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', data.byteLength.toString());
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    headers.set('X-Frame-Options', 'DENY'); // Prevent iframe embedding
    headers.set('X-Content-Type-Options', 'nosniff');

    // Add filename if provided
    if (filename) {
      const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);
    }

    return new Response(data, {
      status: 200,
      headers,
    });
  } catch (error) {
    const loadTime = performance.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      logError('API: Document fetch timeout', {
        component: 'DocumentProxyAPI',
        operation: 'GET /api/documents',
        loadTime: Math.round(loadTime),
        url: queryUrl?.substring(0, 100) + '...',
      });

      return new Response('Request timeout', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    logError('API: Document proxy error', {
      component: 'DocumentProxyAPI',
      operation: 'GET /api/documents',
      error: error instanceof Error ? error.message : 'Unknown error',
      loadTime: Math.round(loadTime),
      url: queryUrl?.substring(0, 100) + '...',
    });

    return new Response('Failed to fetch document', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};
