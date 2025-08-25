// Error Handling Template for Migration from Bridge Pattern

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    msg: string,
    public status: number,
    public details?: unknown
  ) {
    super(msg);
  }
}

export const unauthorized = () => new AppError('UNAUTHORIZED', 'Unauthorized', 401);
export const forbidden = () => new AppError('FORBIDDEN', 'Forbidden', 403);
export const notFound = () => new AppError('NOT_FOUND', 'Not found', 404);
export const badRequest = (msg: string, details?: unknown) =>
  new AppError('BAD_REQUEST', msg, 400, details);

export function errorToJson(e: unknown) {
  return e instanceof AppError
    ? { code: e.code, message: e.message, details: e.details }
    : { code: 'INTERNAL', message: e instanceof Error ? e.message : 'Unknown' };
}
