import { POST } from '@/app/api/security/csp-report/route';

describe('API Route - /api/security/csp-report', () => {
  it('accepts CSP violation reports and returns 200', async () => {
    const req = new global.Request('http://localhost/api/security/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'csp-report': { 'violated-directive': 'script-src' } }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      data: { status: 'ok' },
      message: 'CSP violation report received successfully'
    });
  });
});
