type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = {
  requestId?: string;
  route?: string;
  method?: string;
  code?: string;
  duration?: number; // ms
  dbMs?: number; // optional db time
  cache?: 'hit' | 'miss' | 'bypass';
  userIdHash?: string; // hashed user id (never raw PII)
  [key: string]: unknown;
};

function format(level: LogLevel, message: string, meta?: LogMeta) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  } as const;
  return JSON.stringify(entry);
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => console.debug(format('debug', message, meta)),
  info: (message: string, meta?: LogMeta) => console.info(format('info', message, meta)),
  warn: (message: string, meta?: LogMeta) => console.warn(format('warn', message, meta)),
  error: (message: string, meta?: LogMeta) => console.error(format('error', message, meta)),
};

export function getRequestMeta(headers: Headers): { requestId?: string } {
  const id = headers.get('x-request-id') || undefined;
  return { requestId: id };
}

// Stable one-way hash for user identifiers (avoid logging raw IDs)
export function userIdToHash(userId: string | undefined | null): string | undefined {
  if (!userId) return undefined;
  try {
    // Node.js crypto hashing (fallback to simple base64 if not available)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(String(userId)).digest('hex').slice(0, 16);
  } catch {
    try {
      return Buffer.from(String(userId)).toString('base64').slice(0, 16);
    } catch {
      return undefined;
    }
  }
}
