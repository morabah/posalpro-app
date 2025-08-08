import { logger } from '@/lib/logging/structuredLogger';

export async function withApiTiming<T>(
  req: Request,
  operation: string,
  handler: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await handler();
    const durationMs = Math.round(performance.now() - start);
    logger.info('api_timing', {
      operation,
      durationMs,
      status: 'success',
    });
    return result;
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    logger.error('api_timing', {
      operation,
      durationMs,
      status: 'error',
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw err;
  }
}
