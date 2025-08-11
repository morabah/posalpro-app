/**
 * Environment Configuration Management
 * Provides type-safe environment variable access with validation
 * and support for multiple deployment environments (dev, staging, prod)
 */

import { logError, logInfo, logWarn } from './logger';

// Environment types enum
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

// Configuration validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  environment: Environment;
}

// Application configuration interface
export interface AppConfig {
  // Environment settings
  nodeEnv: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  isTest: boolean;

  // Application settings
  port: number;
  host: string;
  appName: string;
  appVersion: string;

  // Database configuration
  database: {
    url: string;
    maxConnections: number;
    timeout: number;
    ssl: boolean;
  };

  // API configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };

  // Authentication configuration
  auth: {
    jwtSecret: string;
    jwtExpiration: string;
    apiKey: string;
    refreshTokenExpiration: string;
  };

  // External services
  services: {
    logging: {
      endpoint?: string;
      level: string;
      enableRemote: boolean;
    };
    analytics: {
      trackingId?: string;
      enabled: boolean;
    };
    storage: {
      provider: string;
      bucket?: string;
      region?: string;
    };
  };

  // Security settings
  security: {
    corsOrigins: string[];
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    encryptionKey: string;
  };

  // Feature flags
  features: {
    enableMetrics: boolean;
    enableDebugMode: boolean;
    enableExperimentalFeatures: boolean;
    maintenanceMode: boolean;
  };
}

// Environment configuration manager class
class EnvironmentManager {
  private config: AppConfig | null = null;
  private validationResult: ValidationResult | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  // ✅ PERFORMANCE FIX: Browser-specific warning suppression
  private browserWarningsLogged = new Set<string>();
  private lastBrowserLogTime = 0;
  private readonly BROWSER_LOG_THROTTLE = 30000; // 30 seconds

  constructor() {
    this.loadConfiguration();
  }

  public getCurrentEnvironment(): Environment {
    // Use browser-safe environment detection
    if (typeof window !== 'undefined') {
      // Browser environment - NODE_ENV is defined by Next.js at build time
      return process.env.NODE_ENV as Environment;
    }

    // Server environment - NODE_ENV is defined by Next.js runtime
    const env = process.env.NODE_ENV as string;
    switch (env.toLowerCase()) {
      case 'production':
        return Environment.PRODUCTION;
      case 'staging':
        return Environment.STAGING;
      case 'test':
        return Environment.TEST;
      case 'development':
      default:
        return Environment.DEVELOPMENT;
    }
  }

  // ✅ PERFORMANCE FIX: Throttled browser warning system
  private logBrowserWarning(warning: string, environment: Environment) {
    const now = Date.now();
    const warningKey = `${warning}-${environment}`;

    // Only log each warning once per throttle period
    if (
      !this.browserWarningsLogged.has(warningKey) ||
      now - this.lastBrowserLogTime > this.BROWSER_LOG_THROTTLE
    ) {
      this.browserWarningsLogged.add(warningKey);
      this.lastBrowserLogTime = now;

      // Only log in development mode to reduce production console spam
      if (environment === Environment.DEVELOPMENT) {
        logWarn('Environment configuration warning', { warning, environment });
      }
    }
  }

  // Type-safe environment variable getter
  private getEnvVar(
    key: string,
    options: {
      required?: boolean;
      default?: string | number | boolean;
      type: 'string' | 'number' | 'boolean';
    }
  ): string | number | boolean {
    const value = process.env[key];

    // Handle required variables
    if (options.required && (value === undefined || value === '')) {
      throw new Error(`Required environment variable ${key} is not set`);
    }

    // Use default if value not provided
    const finalValue = value || (options.default ? options.default.toString() : '') || '';

    // Type conversion
    switch (options.type) {
      case 'number': {
        const numValue = Number(finalValue);
        if (isNaN(numValue)) {
          throw new Error(`Environment variable ${key} must be a valid number, got: ${finalValue}`);
        }
        return numValue;
      }
      case 'boolean':
        return finalValue.toLowerCase() === 'true' || finalValue === '1';

      case 'string':
      default:
        return finalValue;
    }
  }

  // Load and validate configuration
  private loadConfiguration(): void {
    // ✅ PERFORMANCE FIX: Prevent multiple simultaneous loads
    if (this.isLoading) {
      return;
    }

    if (this.loadPromise) {
      return;
    }

    this.isLoading = true;
    this.loadPromise = this.performLoad();
  }

  private async performLoad(): Promise<void> {
    try {
      const currentEnv = this.getCurrentEnvironment();
      const errors: string[] = [];
      const warnings: string[] = [];

      // Environment-specific validation rules
      const isProduction = currentEnv === Environment.PRODUCTION;
      const isDevelopment = currentEnv === Environment.DEVELOPMENT;
      const isStaging = currentEnv === Environment.STAGING;
      const isTest = currentEnv === Environment.TEST;
      const isBrowser = typeof window !== 'undefined';

      // Core configuration
      const nodeEnv = currentEnv;
      const port = this.getEnvVar('PORT', { required: false, default: 3000, type: 'number' });
      const host = this.getEnvVar('HOST', {
        required: false,
        default: 'localhost',
        type: 'string',
      });
      const appName = this.getEnvVar('APP_NAME', {
        required: false,
        default: 'PosalPro MVP2',
        type: 'string',
      });
      const appVersion = this.getEnvVar('APP_VERSION', {
        required: false,
        default: '1.0.0',
        type: 'string',
      });

      // Database configuration with enhanced browser optimization
      let databaseUrl: string;

      if (isBrowser) {
        // ✅ PERFORMANCE FIX: Browser environment - use static placeholder
        databaseUrl = 'browser-placeholder://not-accessible';
        // Only warn in development and throttle warnings
        if (isDevelopment) {
          this.logBrowserWarning(
            'Database configuration not available in browser environment',
            currentEnv
          );
        }
      } else {
        // Server environment - load actual DATABASE_URL
        try {
          databaseUrl = this.getEnvVar('DATABASE_URL', {
            required: !isTest,
            default: isTest ? 'sqlite://memory' : undefined,
            type: 'string',
          }) as string;
        } catch (error) {
          if (isTest) {
            databaseUrl = 'sqlite://memory';
          } else {
            throw error;
          }
        }
      }

      const databaseMaxConnections = this.getEnvVar('DATABASE_MAX_CONNECTIONS', {
        required: false,
        default: 10,
        type: 'number',
      });
      const databaseTimeout = this.getEnvVar('DATABASE_TIMEOUT', {
        required: false,
        default: 30000,
        type: 'number',
      });
      const databaseSsl = this.getEnvVar('DATABASE_SSL', {
        required: false,
        default: isProduction,
        type: 'boolean',
      });

      // API configuration
      const apiBaseUrl = this.getEnvVar('API_BASE_URL', {
        required: false,
        default: isDevelopment
          ? 'http://localhost:3000/api'
          : isProduction
            ? 'https://posalpro-mvp2.windsurf.build/api'
            : '/api',
        type: 'string',
      }) as string;

      const apiTimeout = this.getEnvVar('API_TIMEOUT', {
        required: false,
        default: 10000,
        type: 'number',
      });
      const apiRetryAttempts = this.getEnvVar('API_RETRY_ATTEMPTS', {
        required: false,
        default: 3,
        type: 'number',
      });
      const apiRetryDelay = this.getEnvVar('API_RETRY_DELAY', {
        required: false,
        default: 1000,
        type: 'number',
      });

      // Authentication configuration with enhanced browser safety
      let jwtSecret: string;
      let apiKey: string;
      let encryptionKey: string;

      if (isBrowser) {
        // ✅ SECURITY FIX: Browser environment - use safe placeholders
        jwtSecret = 'browser-placeholder-jwt-secret';
        apiKey = 'browser-placeholder-api-key';
        encryptionKey = 'browser-placeholder-encryption-key';

        // Throttled warnings for development only
        if (isDevelopment) {
          this.logBrowserWarning(
            'Authentication configuration not available in browser environment',
            currentEnv
          );
        }
      } else {
        // Server environment - load actual secrets
        jwtSecret = this.getEnvVar('JWT_SECRET', {
          required: false,
          default: isTest
            ? 'test-jwt-secret'
            : 'posalpro-mvp2-development-secret-key-minimum-32-characters-required',
          type: 'string',
        }) as string;

        apiKey = this.getEnvVar('API_KEY', {
          required: false,
          default: isTest ? 'test-api-key' : 'posalpro-mvp2-development-api-key',
          type: 'string',
        }) as string;

        encryptionKey = this.getEnvVar('ENCRYPTION_KEY', {
          required: false,
          default: isTest
            ? 'test-encryption-key-32-chars'
            : 'posalpro-mvp2-development-encryption-key-32-characters',
          type: 'string',
        }) as string;

        // Server-side validation for production
        if (isProduction) {
          if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('default')) {
            errors.push('JWT_SECRET must be set to a secure value in production');
          }
          if (!process.env.API_KEY || process.env.API_KEY.includes('default')) {
            errors.push('API_KEY must be set to a secure value in production');
          }
        } else if (isDevelopment) {
          // Development warnings (throttled)
          if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('default')) {
            this.logBrowserWarning(
              'Using default JWT_SECRET in development - update for production',
              currentEnv
            );
          }
          if (!process.env.API_KEY || process.env.API_KEY.includes('default')) {
            this.logBrowserWarning(
              'Using default API_KEY in development - update for production',
              currentEnv
            );
          }
        }
      }

      const jwtExpiration = this.getEnvVar('JWT_EXPIRATION', {
        required: false,
        default: '1h',
        type: 'string',
      }) as string;
      const refreshTokenExpiration = this.getEnvVar('REFRESH_TOKEN_EXPIRATION', {
        required: false,
        default: '7d',
        type: 'string',
      }) as string;

      // External services configuration
      const loggingEndpoint = this.getEnvVar('LOGGING_ENDPOINT', {
        required: false,
        type: 'string',
      }) as string | undefined;
      const loggingLevel = this.getEnvVar('LOGGING_LEVEL', {
        required: false,
        default: isDevelopment ? 'debug' : 'info',
        type: 'string',
      }) as string;
      const analyticsTrackingId = this.getEnvVar('ANALYTICS_TRACKING_ID', {
        required: false,
        type: 'string',
      }) as string | undefined;
      const storageProvider = this.getEnvVar('STORAGE_PROVIDER', {
        required: false,
        default: 'local',
        type: 'string',
      }) as string;
      const storageBucket = this.getEnvVar('STORAGE_BUCKET', {
        required: false,
        type: 'string',
      }) as string | undefined;
      const storageRegion = this.getEnvVar('STORAGE_REGION', {
        required: false,
        type: 'string',
      }) as string | undefined;

      // Security configuration
      const corsOrigins = this.getEnvVar('CORS_ORIGINS', {
        required: false,
        default: isDevelopment ? 'http://localhost:3000' : '',
        type: 'string',
      }) as string;
      const rateLimitWindowMs = this.getEnvVar('RATE_LIMIT_WINDOW_MS', {
        required: false,
        default: 900000,
        type: 'number',
      }) as number;
      const rateLimitMaxRequests = this.getEnvVar('RATE_LIMIT_MAX_REQUESTS', {
        required: false,
        default: 100,
        type: 'number',
      }) as number;

      // Feature flags
      const enableMetrics = this.getEnvVar('ENABLE_METRICS', {
        required: false,
        default: true,
        type: 'boolean',
      }) as boolean;
      const enableDebugMode = this.getEnvVar('ENABLE_DEBUG_MODE', {
        required: false,
        default: isDevelopment,
        type: 'boolean',
      }) as boolean;
      const enableExperimentalFeatures = this.getEnvVar('ENABLE_EXPERIMENTAL_FEATURES', {
        required: false,
        default: false,
        type: 'boolean',
      }) as boolean;
      const maintenanceMode = this.getEnvVar('MAINTENANCE_MODE', {
        required: false,
        default: false,
        type: 'boolean',
      }) as boolean;

      // Build configuration object
      this.config = {
        nodeEnv,
        isDevelopment,
        isProduction,
        isStaging,
        isTest,
        port: port as number,
        host: host as string,
        appName: appName as string,
        appVersion: appVersion as string,
        database: {
          url: databaseUrl,
          maxConnections: databaseMaxConnections as number,
          timeout: databaseTimeout as number,
          ssl: databaseSsl as boolean,
        },
        api: {
          baseUrl: apiBaseUrl,
          timeout: apiTimeout as number,
          retryAttempts: apiRetryAttempts as number,
          retryDelay: apiRetryDelay as number,
        },
        auth: {
          jwtSecret,
          jwtExpiration,
          apiKey,
          refreshTokenExpiration,
        },
        services: {
          logging: {
            endpoint: loggingEndpoint,
            level: loggingLevel,
            enableRemote: isProduction && !!loggingEndpoint,
          },
          analytics: {
            trackingId: analyticsTrackingId,
            enabled: !!analyticsTrackingId,
          },
          storage: {
            provider: storageProvider,
            bucket: storageBucket,
            region: storageRegion,
          },
        },
        security: {
          corsOrigins: corsOrigins
            .split(',')
            .map(origin => origin.trim())
            .filter(Boolean),
          rateLimitWindowMs,
          rateLimitMaxRequests,
          encryptionKey,
        },
        features: {
          enableMetrics,
          enableDebugMode,
          enableExperimentalFeatures,
          maintenanceMode,
        },
      };

      // Validation result
      this.validationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        environment: currentEnv,
      };

      // ✅ PERFORMANCE FIX: Intelligent logging strategy
      if (errors.length > 0) {
        logError('Environment configuration validation failed', new Error('Configuration errors'), {
          errors,
          warnings,
          environment: currentEnv,
        });
      } else {
        // Only log success in server environment or development (and throttled)
        if (!isBrowser && isDevelopment) {
          logInfo('Environment configuration loaded successfully', {
            environment: currentEnv,
            warnings: warnings.length > 0 ? warnings : undefined,
            configSummary: {
              environment: currentEnv,
              port: this.config.port,
              databaseConfigured:
                !!this.config.database.url && !this.config.database.url.includes('placeholder'),
              apiConfigured: !!this.config.api.baseUrl,
              authConfigured:
                !!this.config.auth.jwtSecret && !this.config.auth.jwtSecret.includes('placeholder'),
              featuresEnabled: Object.values(this.config.features).filter(Boolean).length,
            },
          });
        }
      }

      // ✅ PERFORMANCE FIX: No warning logs in browser environment for better performance
      // Warnings are now handled by throttled logBrowserWarning method
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logError('Failed to load environment configuration', error, {
        environment: this.getCurrentEnvironment(),
      });

      this.validationResult = {
        isValid: false,
        errors: [errorMessage],
        warnings: [],
        environment: this.getCurrentEnvironment(),
      };

      throw new Error(`Environment configuration failed: ${errorMessage}`);
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  // Get configuration
  public getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfiguration() first.');
    }
    return this.config;
  }

  // Get validation result
  public getValidationResult(): ValidationResult {
    if (!this.validationResult) {
      throw new Error('Configuration not validated. Call loadConfiguration() first.');
    }
    return this.validationResult;
  }

  // Check if configuration is valid
  public isValid(): boolean {
    return this.getValidationResult().isValid;
  }

  // Get specific configuration section
  public getDatabaseConfig() {
    return this.getConfig().database;
  }

  public getApiConfig() {
    return this.getConfig().api;
  }

  public getAuthConfig() {
    return this.getConfig().auth;
  }

  public getSecurityConfig() {
    return this.getConfig().security;
  }

  public getFeatureFlags() {
    return this.getConfig().features;
  }

  // Reload configuration (useful for testing)
  public reloadConfiguration(): void {
    this.config = null;
    this.validationResult = null;
    this.loadConfiguration();
  }
}

// Create singleton environment manager
const environmentManager = new EnvironmentManager();

// Export convenience functions
export const getConfig = (): AppConfig => environmentManager.getConfig();
export const getValidationResult = (): ValidationResult => environmentManager.getValidationResult();
export const isValidConfiguration = (): boolean => environmentManager.isValid();
export const getCurrentEnvironment = (): Environment => environmentManager.getCurrentEnvironment();
export const getDatabaseConfig = () => environmentManager.getDatabaseConfig();
export const getApiConfig = () => environmentManager.getApiConfig();
export const getAuthConfig = () => environmentManager.getAuthConfig();
export const getSecurityConfig = () => environmentManager.getSecurityConfig();
export const getFeatureFlags = () => environmentManager.getFeatureFlags();
export const reloadConfiguration = (): void => environmentManager.reloadConfiguration();

// Export environment manager for advanced usage
export { environmentManager };
