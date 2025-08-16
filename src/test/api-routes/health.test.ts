import { GET } from '@/app/api/health/route';

describe('API Route - /api/health', () => {
  it('returns healthy status with responseTime', async () => {
    const req = new global.Request('http://localhost/api/health');
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(typeof body.responseTime).toBe('number');
  });
});
