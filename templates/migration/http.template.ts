// HTTP Client Template for Migration from Bridge Pattern

export type ApiError = { code?: string; message: string; details?: unknown };

export async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    let payload: ApiError | undefined;
    try {
      payload = await res.json();
    } catch {}

    const err = new Error(payload?.message ?? `HTTP ${res.status}`);
    (err as any).err = payload ?? { code: 'HTTP_ERROR', message: `HTTP ${res.status}` };
    (err as any).status = res.status;
    (err as any).requestId = res.headers.get('x-request-id') ?? undefined;
    throw err;
  }

  return res.json() as Promise<T>;
}
