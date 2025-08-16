import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/security/hardening';
import { setCache } from '@/lib/redis';

type LegacyCspReport = {
  'csp-report'?: {
    'document-uri'?: string;
    'referrer'?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    'blocked-uri'?: string;
    'disposition'?: string;
    'status-code'?: number;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'script-sample'?: string;
  };
};

type ReportingApiEnvelope = {
  type?: string; // 'csp-violation'
  body?: Record<string, unknown>;
};

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
  try {
    const contentType = request.headers.get('content-type') || '';
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let reports: Array<Record<string, unknown>> = [];

    // Parse body according to content-type
    if (contentType.includes('application/reports+json')) {
      // Reporting API sends an array of report envelopes
      const body = (await request.json()) as ReportingApiEnvelope[];
      reports = Array.isArray(body)
        ? body
            .filter(r => r && (r.type === 'csp-violation' || r.type === 'csp'))
            .map(r => ({ type: r.type, ...(r.body || {}) }))
        : [];
    } else {
      // Legacy application/csp-report or generic JSON
      const body = (await request.json()) as LegacyCspReport | Record<string, unknown>;
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
      await setCache(`csp:${id}`, normalized, 7 * 24 * 60 * 60);

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

    // No content response for report endpoints
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Fail closed but do not throw noisy errors to clients
    return NextResponse.json({ status: 'error' }, { status: 204 });
  }
}

