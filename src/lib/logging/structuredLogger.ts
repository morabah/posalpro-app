type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function format(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    console.debug(format('debug', message, meta)),
  info: (message: string, meta?: Record<string, unknown>) =>
    console.info(format('info', message, meta)),
  warn: (message: string, meta?: Record<string, unknown>) =>
    console.warn(format('warn', message, meta)),
  error: (message: string, meta?: Record<string, unknown>) =>
    console.error(format('error', message, meta)),
};

export function getRequestMeta(headers: Headers): Record<string, unknown> {
  return { requestId: headers.get('x-request-id') || undefined };
}
