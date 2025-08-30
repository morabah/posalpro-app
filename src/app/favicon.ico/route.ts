/**
 * Favicon Redirect Route
 * Avoids 404 for /favicon.ico by redirecting to existing PWA icon.
 */

export function GET(req: Request) {
  const url = new URL('/icons/icon-192x192.png', req.url);
  return Response.redirect(url, 302);
}

