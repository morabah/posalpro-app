type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMeta {
  requestId?: string;
  route?: string;
  method?: string;
  code?: string;
  duration?: number; // ms
  dbMs?: number; // optional db time
  cache?: 'hit' | 'miss' | 'bypass';
  userIdHash?: string; // hashed user id (never raw PII)
  [key: string]: unknown;
}

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
  // Deterministic non-cryptographic hash (FNV-1a 32-bit), returned as 16 hex chars by repeating
  let hash = 0x811c9dc5; // FNV-1a offset
  const str = String(userId);
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    // 32-bit FNV prime: 16777619
    hash = (hash >>> 0) * 0x01000193;
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  // Repeat to 16 chars to keep previous length behavior
  return (hex + hex).slice(0, 16);
}
