export const log = (
  level: "info" | "warn" | "error",
  msg: string,
  extra: Record<string, unknown> = {}
) => {
  const rid = (globalThis as any).__requestId;
  console[level](JSON.stringify({ level, msg, requestId: rid, ...extra }));
};

// Enhanced logging functions with request ID support
export const logInfo = (message: string, extra: Record<string, unknown> = {}) => {
  const rid = (globalThis as any).__requestId;
  console.info(JSON.stringify({ level: 'info', message, requestId: rid, ...extra }));
};

export const logWarn = (message: string, extra: Record<string, unknown> = {}) => {
  const rid = (globalThis as any).__requestId;
  console.warn(JSON.stringify({ level: 'warn', message, requestId: rid, ...extra }));
};

export const logError = (message: string, extra: Record<string, unknown> = {}) => {
  const rid = (globalThis as any).__requestId;
  console.error(JSON.stringify({ level: 'error', message, requestId: rid, ...extra }));
};

// Debug logging (only in development)
export const logDebug = (message: string, extra: Record<string, unknown> = {}) => {
  if (process.env.NODE_ENV === 'development') {
    const rid = (globalThis as any).__requestId;
    console.debug(JSON.stringify({ level: 'debug', message, requestId: rid, ...extra }));
  }
};
