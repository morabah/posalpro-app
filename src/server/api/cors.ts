import { NextRequest, NextResponse } from 'next/server';

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS || '';
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function matchOrigin(requestOrigin: string | null, allowlist: string[]): string | null {
  if (!requestOrigin) return null;
  for (const allowed of allowlist) {
    if (allowed === '*' || allowed === requestOrigin) return requestOrigin;
    // Support simple subdomain wildcard: https://*.example.com
    if (allowed.startsWith('https://*.') || allowed.startsWith('http://*.')) {
      const proto = allowed.startsWith('https://') ? 'https://' : 'http://';
      const base = allowed.replace(/^https?:\/\/*\./, '');
      if (requestOrigin.startsWith(proto) && requestOrigin.endsWith(base)) return requestOrigin;
    }
  }
  return null;
}

export function handleCorsPreflight(req: NextRequest): NextResponse | null {
  if (req.method !== 'OPTIONS') return null;
  const allowlist = parseAllowedOrigins();
  const origin = req.headers.get('origin');
  const allowedOrigin = matchOrigin(origin, allowlist);
  const res = new NextResponse(null, { status: 204 });
  if (allowedOrigin) {
    res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    res.headers.set('Vary', 'Origin');
  }
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set(
    'Access-Control-Allow-Headers',
    req.headers.get('access-control-request-headers') || 'Content-Type, Authorization'
  );
  res.headers.set(
    'Access-Control-Allow-Methods',
    req.headers.get('access-control-request-method') || 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  res.headers.set('Access-Control-Max-Age', '600');
  return res;
}

export function withCors(response: NextResponse, req: NextRequest): NextResponse {
  const allowlist = parseAllowedOrigins();
  const origin = req.headers.get('origin');
  const allowedOrigin = matchOrigin(origin, allowlist);
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Vary', 'Origin');
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

