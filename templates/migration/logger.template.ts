// Logging Template for Migration from Bridge Pattern

export const logInfo = (msg: string, f: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ level: 'info', msg, ...f }));

export const logError = (msg: string, f: Record<string, unknown> = {}) =>
  console.error(JSON.stringify({ level: 'error', msg, ...f }));

export const logDebug = (msg: string, f: Record<string, unknown> = {}) =>
  console.debug(JSON.stringify({ level: 'debug', msg, ...f }));

export const logWarn = (msg: string, f: Record<string, unknown> = {}) =>
  console.warn(JSON.stringify({ level: 'warn', msg, ...f }));
