import { GET as getOpenApi } from '@/app/api/docs/openapi.json/route';

describe('API headers', () => {
  it('adds x-api-version on createRoute-based endpoints', async () => {
    const req = new Request('http://localhost/api/docs/openapi.json');
    const res = await getOpenApi(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-api-version')).toBe('1');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});

