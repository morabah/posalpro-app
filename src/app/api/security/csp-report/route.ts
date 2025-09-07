import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/security/hardening';
import { setCache } from '@/lib/redis';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { ErrorCodes, StandardError } from '@/lib/errors';

interface LegacyCspReport {
  'csp-report'?: {
    'document-uri'?: string;
    referrer?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    'blocked-uri'?: string;
    disposition?: string;
    'status-code'?: number;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'script-sample'?: string;
  };
}

interface ReportingApiEnvelope {
  type?: string; // 'csp-violation'
  body?: Record<string, unknown>;
}

function getClientIp(req: NextRequest): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor && xForwardedFor.trim().length > 0) {
    return xForwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim().length > 0) {
    return xRealIp;
  }
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'SecurityCSPReportRoute',
    operation: 'POST',
  });

  try {
    const contentType = request.headers.get('content-type') || '';
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let reports: Array<Record<string, unknown>> = [];

    // Parse body according to content-type
    if (contentType.includes('application/reports+json')) {
      // Reporting API sends an array of report envelopes
      const body = await withAsyncErrorHandler(
        () => request.json() as Promise<ReportingApiEnvelope[]>,
        'Failed to parse CSP report body',
        { component: 'SecurityCSPReportRoute', operation: 'POST' }
      );
      reports = Array.isArray(body)
        ? body
            .filter(r => r && (r.type === 'csp-violation' || r.type === 'csp'))
            .map(r => ({ type: r.type, ...(r.body || {}) }))
        : [];
    } else {
      // Legacy application/csp-report or generic JSON
      const body = await withAsyncErrorHandler(
        () => request.json() as Promise<LegacyCspReport | Record<string, unknown>>,
        'Failed to parse CSP report body',
        { component: 'SecurityCSPReportRoute', operation: 'POST' }
      );
      const legacy = (body as LegacyCspReport)['csp-report'];
      if (legacy) {
        reports = [legacy as unknown as Record<string, unknown>];
      } else {
        reports = [body as Record<string, unknown>];
      }
    }

    // Normalize minimal fields and store
    const receivedAt = new Date().toISOString();
    for (const r of reports) {
      const normalized = {
        receivedAt,
        ip,
        userAgent,
        documentUri: (r['document-uri'] as string) || (r['documentURI'] as string) || null,
        blockedUri: (r['blocked-uri'] as string) || (r['blockedURI'] as string) || null,
        violatedDirective:
          (r['violated-directive'] as string) || (r['effective-directive'] as string) || null,
        originalPolicy: (r['original-policy'] as string) || null,
        disposition: (r['disposition'] as string) || null,
        statusCode: (r['status-code'] as number) || null,
        sourceFile: (r['source-file'] as string) || null,
        lineNumber: (r['line-number'] as number) || null,
        columnNumber: (r['column-number'] as number) || null,
        sample: (r['script-sample'] as string) || (r['sample'] as string) || null,
        raw: r,
      };

      // Store with TTL (7 days) using cache layer (Redis in prod, memory in dev)
      const id = crypto.randomUUID();
      await withAsyncErrorHandler(
        () => setCache(`csp:${id}`, normalized, 7 * 24 * 60 * 60),
        'Failed to cache CSP violation report',
        { component: 'SecurityCSPReportRoute', operation: 'POST' }
      );

      // Audit log entry for security monitoring
      auditLogger.log({
        action: 'csp_violation',
        resource: normalized.documentUri || 'unknown',
        details: {
          violatedDirective: normalized.violatedDirective,
          blockedUri: normalized.blockedUri,
        },
        ipAddress: ip,
        userAgent,
        severity: 'high',
        success: false,
        error: 'Content Security Policy violation reported',
      });
    }

    // Acknowledge report with 200 OK and minimal body
    const responseData = { status: 'ok' };
    return errorHandler.createSuccessResponse(
      responseData,
      'CSP violation report received successfully'
    );
  } catch (error) {
    // For security routes, return 200 to avoid noisy client errors
    // but still log the error internally for monitoring
    const securityError = new Error('CSP violation report processing failed');
    const errorResponse = errorHandler.createErrorResponse(
      securityError,
      'CSP report processing failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      200 // Return 200 to avoid client errors
    );
    return errorResponse;
  }
}
