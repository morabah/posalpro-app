import { SecurityHeaders } from '@/lib/security/hardening';

describe('Security - SecurityHeaders', () => {
  it('returns a CSP header string', () => {
    const headers = SecurityHeaders.getSecurityHeaders();
    expect(typeof headers['Content-Security-Policy']).toBe('string');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
  });

  it('includes clickjacking and mime protections', () => {
    const headers = SecurityHeaders.getSecurityHeaders();
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });
});
