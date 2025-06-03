/**
 * Development Environment Validation Utilities
 * Phase 1.5 - Development Scripts & Validation Tracking
 */

import { environmentManager } from '../env';
import { logger } from '../logger';
import { performanceManager } from '../performance';

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  duration: number;
}

export interface HealthCheckResult {
  overall: boolean;
  checks: Record<string, ValidationResult>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface QualityMetrics {
  typescript: {
    strictMode: boolean;
    errorCount: number;
    warningCount: number;
  };
  eslint: {
    errorCount: number;
    warningCount: number;
    rulesCount: number;
  };
  performance: {
    buildTime: number;
    bundleSize: number;
    memoryUsage: number;
  };
  codebase: {
    totalFiles: number;
    totalLines: number;
    complexityScore: number;
    testCoverage: number;
  };
}

/**
 * Check if running in Node.js environment (server-side)
 */
const isServerSide = (): boolean => {
  return typeof window === 'undefined' && typeof process !== 'undefined';
};

export class DevelopmentValidator {
  private logger: typeof logger;
  private envManager: typeof environmentManager;
  private perfManager: typeof performanceManager;

  constructor() {
    this.logger = logger;
    this.envManager = environmentManager;
    this.perfManager = performanceManager;
  }

  /**
   * Perform comprehensive development environment health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    this.logger.info('Starting development environment health check');

    const checks: Record<string, ValidationResult> = {};

    // Environment validation
    checks.environment = await this.validateEnvironment();

    // Configuration validation (server-side only)
    if (isServerSide()) {
      checks.configuration = await this.validateConfiguration();
      checks.filesystem = await this.validateFileSystem();
    } else {
      checks.configuration = {
        passed: true,
        message: 'Configuration validation skipped on client-side',
        timestamp: Date.now(),
        duration: 0,
      };
      checks.filesystem = {
        passed: true,
        message: 'Filesystem validation skipped on client-side',
        timestamp: Date.now(),
        duration: 0,
      };
    }

    // Dependencies validation
    checks.dependencies = await this.validateDependencies();

    // Network connectivity validation
    checks.network = await this.validateNetworkConnectivity();

    // Performance validation
    checks.performance = await this.validatePerformance();

    const summary = this.generateSummary(checks);
    const overall = summary.failed === 0;

    const result: HealthCheckResult = {
      overall,
      checks,
      summary,
    };

    const duration = Date.now() - startTime;
    this.logger.info('Development environment health check completed', {
      duration,
      overall: overall ? 'PASSED' : 'FAILED',
      summary,
    });

    return result;
  }

  /**
   * Validate environment configuration
   */
  private async validateEnvironment(): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const config = this.envManager.getConfig();
      const issues: string[] = [];

      // Check critical environment variables (only on server-side)
      if (isServerSide()) {
        const criticalVars = ['DATABASE_URL', 'JWT_SECRET', 'API_KEY'];
        for (const varName of criticalVars) {
          if (!process.env[varName]) {
            issues.push(`Missing environment variable: ${varName}`);
          }
        }

        // Check environment consistency
        if (config.nodeEnv !== process.env.NODE_ENV) {
          issues.push('Environment configuration mismatch');
        }

        // Validate database URL format
        if (process.env.DATABASE_URL && !this.isValidDatabaseUrl(process.env.DATABASE_URL)) {
          issues.push('Invalid DATABASE_URL format');
        }
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'Environment validation passed'
          : `Environment validation failed: ${issues.join(', ')}`,
        details: { issues, environment: config.nodeEnv },
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        passed: false,
        message: `Environment validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now(),
        duration,
      };
    }
  }

  /**
   * Validate project configuration files (server-side only)
   */
  private async validateConfiguration(): Promise<ValidationResult> {
    const startTime = Date.now();

    if (!isServerSide()) {
      return {
        passed: true,
        message: 'Configuration validation skipped on client-side',
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }

    try {
      const fs = await import('fs');
      const path = await import('path');

      const requiredConfigs = [
        'next.config.ts',
        'tsconfig.json',
        'eslint.config.mjs',
        'postcss.config.mjs',
        'package.json',
      ];

      const issues: string[] = [];

      for (const configFile of requiredConfigs) {
        const configPath = path.join(process.cwd(), configFile);
        if (!fs.existsSync(configPath)) {
          issues.push(`Missing configuration file: ${configFile}`);
        } else {
          // Validate file is readable and has content
          try {
            const content = fs.readFileSync(configPath, 'utf8');
            if (content.trim().length === 0) {
              issues.push(`Empty configuration file: ${configFile}`);
            }
          } catch {
            issues.push(`Unreadable configuration file: ${configFile}`);
          }
        }
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'Configuration validation passed'
          : `Configuration validation failed: ${issues.join(', ')}`,
        details: { issues, configCount: requiredConfigs.length },
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        passed: false,
        message: `Configuration validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now(),
        duration,
      };
    }
  }

  /**
   * Validate dependencies
   */
  private async validateDependencies(): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const issues: string[] = [];

      // Check critical dependencies are available
      const criticalDeps = ['react', 'next', 'zod', 'tailwindcss'];

      for (const dep of criticalDeps) {
        try {
          // Try to resolve the module
          if (typeof require !== 'undefined') {
            require.resolve(dep);
          }
        } catch {
          issues.push(`Missing critical dependency: ${dep}`);
        }
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'Dependencies validation passed'
          : `Dependencies validation failed: ${issues.join(', ')}`,
        details: { issues, checkedDependencies: criticalDeps.length },
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        passed: false,
        message: `Dependencies validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now(),
        duration,
      };
    }
  }

  /**
   * Validate file system structure (server-side only)
   */
  private async validateFileSystem(): Promise<ValidationResult> {
    const startTime = Date.now();

    if (!isServerSide()) {
      return {
        passed: true,
        message: 'Filesystem validation skipped on client-side',
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }

    try {
      const fs = await import('fs');
      const path = await import('path');

      const requiredDirs = ['src', 'src/app', 'src/components', 'src/lib', 'src/types', 'public'];

      const issues: string[] = [];

      for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
          issues.push(`Missing required directory: ${dir}`);
        } else if (!fs.statSync(dirPath).isDirectory()) {
          issues.push(`Expected directory but found file: ${dir}`);
        }
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'File system validation passed'
          : `File system validation failed: ${issues.join(', ')}`,
        details: { issues, checkedDirectories: requiredDirs.length },
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        passed: false,
        message: `File system validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now(),
        duration,
      };
    }
  }

  /**
   * Validate network connectivity
   */
  private async validateNetworkConnectivity(): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // Simple connectivity check that works on both client and server
      const testUrls = ['https://api.github.com', 'https://registry.npmjs.org'];

      const issues: string[] = [];

      for (const url of testUrls) {
        try {
          // Use fetch which is available in both environments
          const response = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });

          if (!response.ok) {
            issues.push(`Network connectivity issue with ${url}: ${response.status}`);
          }
        } catch (error) {
          issues.push(
            `Failed to connect to ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'Network connectivity validation passed'
          : `Network connectivity validation failed: ${issues.join(', ')}`,
        details: { issues, testedUrls: testUrls.length },
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        passed: false,
        message: `Network connectivity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now(),
        duration,
      };
    }
  }

  /**
   * Validate performance metrics
   */
  private async validatePerformance(): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const issues: string[] = [];

      // Memory usage check (if available)
      if (isServerSide() && typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

        if (heapUsedMB > 512) {
          // 512MB threshold
          issues.push(`High memory usage: ${heapUsedMB.toFixed(2)}MB`);
        }
      }

      // Performance timing check (if available)
      if (typeof performance !== 'undefined') {
        const now = performance.now();
        if (now > 30000) {
          // 30 second threshold for long-running processes
          issues.push(`Long process runtime detected: ${(now / 1000).toFixed(2)}s`);
        }
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'Performance validation passed'
          : `Performance validation warnings: ${issues.join(', ')}`,
        details: { issues, environment: isServerSide() ? 'server' : 'client' },
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        passed: false,
        message: `Performance validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now(),
        duration,
      };
    }
  }

  private generateSummary(checks: Record<string, ValidationResult>) {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(check => check.passed).length;
    const failed = total - passed;
    const warnings = Object.values(checks).filter(
      check => !check.passed && check.message.includes('warning')
    ).length;

    return { total, passed, failed, warnings };
  }

  private isValidDatabaseUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['postgresql', 'postgres', 'mysql', 'sqlite'].includes(
        parsed.protocol.replace(':', '')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get quality metrics (server-side only with full analysis)
   */
  async getQualityMetrics(): Promise<QualityMetrics> {
    if (!isServerSide()) {
      // Return basic metrics for client-side
      return {
        typescript: {
          strictMode: true,
          errorCount: 0,
          warningCount: 0,
        },
        eslint: {
          errorCount: 0,
          warningCount: 0,
          rulesCount: 0,
        },
        performance: {
          buildTime: 0,
          bundleSize: 0,
          memoryUsage: 0,
        },
        codebase: {
          totalFiles: 0,
          totalLines: 0,
          complexityScore: 0,
          testCoverage: 0,
        },
      };
    }

    try {
      const codebaseMetrics = await this.analyzeCodebase('src');

      return {
        typescript: {
          strictMode: true, // Assume strict mode is enabled
          errorCount: 0, // Would need to run tsc to get actual errors
          warningCount: 0,
        },
        eslint: {
          errorCount: 0, // Would need to run eslint to get actual errors
          warningCount: 0,
          rulesCount: 0,
        },
        performance: {
          buildTime: 0, // Would need build metrics
          bundleSize: 0, // Would need bundle analysis
          memoryUsage: process.memoryUsage().heapUsed,
        },
        codebase: codebaseMetrics,
      };
    } catch (error) {
      this.logger.error('Failed to get quality metrics', { error });
      throw error;
    }
  }

  /**
   * Analyze codebase metrics (server-side only)
   */
  private async analyzeCodebase(srcPath: string) {
    if (!isServerSide()) {
      return {
        totalFiles: 0,
        totalLines: 0,
        complexityScore: 0,
        testCoverage: 0,
      };
    }

    const fs = await import('fs');
    const path = await import('path');

    let totalFiles = 0;
    let totalLines = 0;

    const traverse = (dir: string) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          traverse(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          totalFiles++;
          const content = fs.readFileSync(filePath, 'utf8');
          totalLines += content.split('\n').length;
        }
      }
    };

    try {
      const fullSrcPath = path.join(process.cwd(), srcPath);
      if (fs.existsSync(fullSrcPath)) {
        traverse(fullSrcPath);
      }
    } catch (error) {
      this.logger.warn('Failed to analyze codebase', { error });
    }

    return {
      totalFiles,
      totalLines,
      complexityScore: Math.floor(totalLines / totalFiles) || 0, // Simple complexity metric
      testCoverage: 0, // Would need to run coverage tools
    };
  }
}

/**
 * Global development validator instance
 */
export const developmentValidator = new DevelopmentValidator();
