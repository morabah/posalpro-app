type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private static instance: Logger;
  private logLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
  private currentLogLevel: LogLevel = typeof window !== 'undefined' ? 'info' : 'debug';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.currentLogLevel);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Enhanced meaningful data detection to prevent "Object" logging
    if (data !== undefined && data !== null) {
      // Check if data is an empty object or meaningless
      const isEmptyObject =
        typeof data === 'object' && data !== null && Object.keys(data).length === 0;

      const isEmptyString = typeof data === 'string' && data.trim() === '';

      // Check if it's a generic object that would show as "Object" in console
      const isGenericObject =
        typeof data === 'object' &&
        data !== null &&
        data.constructor === Object &&
        data.toString() === '[object Object]';

      // Check for large objects that would be meaningless to log
      const isMeaninglessObject =
        typeof data === 'object' &&
        data !== null &&
        Object.keys(data).length > 10 &&
        !Array.isArray(data);

      if (!isEmptyObject && !isEmptyString && !isGenericObject && !isMeaninglessObject) {
        // For small objects, try to stringify for better readability
        if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length <= 5) {
          try {
            const stringified = JSON.stringify(data, null, 2);
            if (stringified && stringified !== '{}' && stringified !== 'null') {
              console[level](`${logMessage} ${stringified}`);
            } else {
              console[level](logMessage);
            }
          } catch {
            console[level](logMessage);
          }
        } else {
          console[level](logMessage, data);
        }
      } else {
        // Log message only if data is empty/meaningless
        console[level](logMessage);
      }
    } else {
      console[level](logMessage);
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
