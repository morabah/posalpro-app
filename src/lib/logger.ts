// Structured logging for consistent log format across the application
export interface LogMetadata {
  component?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  userStory?: string;
  hypothesis?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata: LogMetadata;
}

function formatLogEntry(
  level: LogEntry['level'],
  message: string,
  metadata: LogMetadata = {}
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata: {
      ...metadata,
      environment: process.env.NODE_ENV,
    },
  };
}

function logToConsole(entry: LogEntry): void {
  const logString = JSON.stringify(entry);

  switch (entry.level) {
    case 'debug':
      console.debug(logString);
      break;
    case 'info':
      console.info(logString);
      break;
    case 'warn':
      console.warn(logString);
      break;
    case 'error':
      console.error(logString);
      break;
  }
}

// Main logging functions
export const logDebug = (message: string, metadata: LogMetadata = {}): void => {
  const entry = formatLogEntry('debug', message, metadata);
  logToConsole(entry);
};

export const logInfo = (message: string, metadata: LogMetadata = {}): void => {
  const entry = formatLogEntry('info', message, metadata);
  logToConsole(entry);
};

export const logWarn = (message: string, metadata: LogMetadata = {}): void => {
  const entry = formatLogEntry('warn', message, metadata);
  logToConsole(entry);
};

export const logError = (
  message: string,
  errorOrMetadata?: LogMetadata | unknown,
  metadata?: LogMetadata
): void => {
  let finalMetadata: LogMetadata = {};

  // Handle the common pattern: logError(message, error, metadata)
  if (errorOrMetadata && typeof errorOrMetadata === 'object' && !('component' in errorOrMetadata)) {
    // This is likely an error object, merge it into metadata
    finalMetadata = {
      ...metadata,
      error: errorOrMetadata,
    };
  } else {
    // This is metadata or undefined
    finalMetadata = (errorOrMetadata as LogMetadata) || {};
  }

  const entry = formatLogEntry('error', message, finalMetadata);
  logToConsole(entry);
};

// Logger object for backward compatibility
export const logger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
};

// Convenience functions for common logging patterns
export const logApiRequest = (method: string, path: string, metadata: LogMetadata = {}): void => {
  logInfo('API request', {
    ...metadata,
    method,
    path,
  });
};

export const logApiResponse = (
  method: string,
  path: string,
  status: number,
  duration: number,
  metadata: LogMetadata = {}
): void => {
  logInfo('API response', {
    ...metadata,
    method,
    path,
    status,
    duration,
  });
};

export const logDatabaseQuery = (
  operation: string,
  table: string,
  duration: number,
  metadata: LogMetadata = {}
): void => {
  logDebug('Database query', {
    ...metadata,
    operation,
    table,
    duration,
  });
};

export const logUserAction = (action: string, userId: string, metadata: LogMetadata = {}): void => {
  logInfo('User action', {
    ...metadata,
    action,
    userId,
  });
};

export const logErrorWithContext = (
  error: Error,
  context: string,
  metadata: LogMetadata = {}
): void => {
  logError('Error occurred', {
    ...metadata,
    context,
    errorMessage: error.message,
    errorStack: error.stack,
    errorName: error.name,
  });
};
