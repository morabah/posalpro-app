type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private static instance: Logger | null = null;
  private logLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
  private currentLogLevel: LogLevel = typeof window !== 'undefined' ? 'info' : 'debug';

  private constructor() {}

  public static getInstance(): Logger {
    if (Logger.instance === null) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.currentLogLevel);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    // Validate that the level is a valid console method
    const validLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    if (!validLevels.includes(level)) {
      // Fallback to console.log for invalid levels
      console.log(`[LOGGER ERROR] Invalid log level: ${level}`);
      console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`, data);
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Use a typed map of console functions to avoid unsafe member access
    const consoleFns: Record<LogLevel, (...args: unknown[]) => void> = {
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };

    // Enhanced meaningful data detection to prevent noisy "[object Object]" logs
    if (data !== undefined && data !== null) {
      const isObject = typeof data === 'object';
      const isArray = Array.isArray(data);
      const isEmptyObject = isObject && !isArray && Object.keys(data as Record<string, unknown>).length === 0;
      const isEmptyString = typeof data === 'string' && data.trim() === '';
      const isLargePlainObject = isObject && !isArray && Object.keys(data as Record<string, unknown>).length > 10;

      if (!isEmptyObject && !isEmptyString && !isLargePlainObject) {
        // For small plain objects, try to stringify for better readability
        if (isObject && !isArray && Object.keys(data as Record<string, unknown>).length <= 5) {
          try {
            const stringified = JSON.stringify(data, null, 2);
            if (stringified !== '{}' && stringified !== 'null') {
              consoleFns[level](`${logMessage} ${stringified}`);
            } else {
              consoleFns[level](logMessage);
            }
          } catch {
            consoleFns[level](logMessage);
          }
        } else {
          consoleFns[level](logMessage, data);
        }
      } else {
        // Log message only if data is empty/meaningless
        consoleFns[level](logMessage);
      }
    } else {
      consoleFns[level](logMessage);
    }
  }

  public error(message: string, error?: unknown): void {
    this.log('error', message, error);
  }

  public warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  public info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  public debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }
}

export const logger = Logger.getInstance();
