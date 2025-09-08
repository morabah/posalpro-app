export const log = (
  level: 'info' | 'warn' | 'error',
  msg: string,
  extra: Record<string, unknown> = {}
) => {
  const rid = (globalThis as any).__requestId;
  // ✅ MIGRATED: Use structured logger instead of console
  const { logInfo, logWarn, logError } = require('./logger');
  const logEntry = { level, msg, requestId: rid, ...extra };

  switch (level) {
    case 'info':
      logInfo(msg, { requestId: rid, ...extra });
      break;
    case 'warn':
      logWarn(msg, { requestId: rid, ...extra });
      break;
    case 'error':
      logError(msg, { requestId: rid, ...extra });
      break;
  }
};

// Enhanced logging functions with request ID support
export const logInfo = (message: string, extra: Record<string, unknown> = {}) => {
  const rid = (globalThis as any).__requestId;
  // ✅ MIGRATED: Use structured logger instead of console
  const { logInfo: structuredLogInfo } = require('./logger');
  structuredLogInfo(message, { requestId: rid, ...extra });
};

export const logWarn = (message: string, extra: Record<string, unknown> = {}) => {
  const rid = (globalThis as any).__requestId;
  // ✅ MIGRATED: Use structured logger instead of console
  const { logWarn: structuredLogWarn } = require('./logger');
  structuredLogWarn(message, { requestId: rid, ...extra });
};

export const logError = (message: string, extra: Record<string, unknown> = {}) => {
  const rid = (globalThis as any).__requestId;
  // ✅ MIGRATED: Use structured logger instead of console
  const { logError: structuredLogError } = require('./logger');
  structuredLogError(message, { requestId: rid, ...extra });
};

// Debug logging (only in development)
export const logDebug = (message: string, extra: Record<string, unknown> = {}) => {
  if (process.env.NODE_ENV === 'development') {
    const rid = (globalThis as any).__requestId;
    // ✅ MIGRATED: Use structured logger instead of console
    const { logDebug: structuredLogDebug } = require('./logger');
    structuredLogDebug(message, { requestId: rid, ...extra });
  }
};
