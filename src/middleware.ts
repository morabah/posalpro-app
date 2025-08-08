import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const res = NextResponse.next();
  res.headers.set('x-request-id', requestId);
  return res;
}

export const config = {
  matcher: ['/api/:path*', '/:path*'],
};
