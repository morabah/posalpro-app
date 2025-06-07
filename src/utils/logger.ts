import { env } from '@/env.mjs';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private static instance: Logger;
  private logLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
  private currentLogLevel: LogLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

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
    
    if (data) {
      console[level](logMessage, data);
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
