// Request ID Template for Migration from Bridge Pattern

export const getOrCreateRequestId = (req: Request) =>
  req.headers.get('x-request-id') ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
