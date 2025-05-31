/**
 * Development Environment Validation Utilities
 * Phase 1.5 - Development Scripts & Validation Tracking
 */

import { logger } from '../logger';
import { environmentManager } from '../env';
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

    // Configuration validation
    checks.configuration = await this.validateConfiguration();

    // Dependencies validation
    checks.dependencies = await this.validateDependencies();

    // File system validation
    checks.filesystem = await this.validateFileSystem();

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

      // Check critical environment variables
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
   * Validate project configuration files
   */
  private async validateConfiguration(): Promise<ValidationResult> {
    const startTime = Date.now();

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
          : `Configuration issues found: ${issues.join(', ')}`,
        details: { issues, checkedFiles: requiredConfigs },
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
   * Validate project dependencies
   */
  private async validateDependencies(): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const fs = await import('fs');
      const path = await import('path');

      const issues: string[] = [];

      // Check if node_modules exists
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        issues.push('node_modules directory not found');
      }

      // Check package.json and package-lock.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageLockPath = path.join(process.cwd(), 'package-lock.json');

      if (!fs.existsSync(packageJsonPath)) {
        issues.push('package.json not found');
      }

      if (!fs.existsSync(packageLockPath)) {
        issues.push('package-lock.json not found (run npm install)');
      }

      // Check critical dependencies
      if (fs.existsSync(nodeModulesPath)) {
        const criticalDeps = ['next', 'react', 'typescript'];
        for (const dep of criticalDeps) {
          const depPath = path.join(nodeModulesPath, dep);
          if (!fs.existsSync(depPath)) {
            issues.push(`Missing critical dependency: ${dep}`);
          }
        }
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'Dependencies validation passed'
          : `Dependency issues found: ${issues.join(', ')}`,
        details: { issues },
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
   * Validate file system structure
   */
  private async validateFileSystem(): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const fs = await import('fs');
      const path = await import('path');

      const issues: string[] = [];

      // Check required directories
      const requiredDirs = ['src', 'src/app', 'src/lib', 'src/components', 'src/types', 'public'];

      for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
          issues.push(`Missing directory: ${dir}`);
        }
      }

      // Check write permissions
      try {
        const tempFile = path.join(process.cwd(), '.temp-write-test');
        fs.writeFileSync(tempFile, 'test');
        fs.unlinkSync(tempFile);
      } catch {
        issues.push('No write permissions in project directory');
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'File system validation passed'
          : `File system issues found: ${issues.join(', ')}`,
        details: { issues, checkedDirectories: requiredDirs },
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
      const issues: string[] = [];

      // Check if port 3000 is available (development server port)
      const net = await import('net');
      const isPortAvailable = await new Promise<boolean>(resolve => {
        const server = net.createServer();
        server.listen(3000, () => {
          server.close(() => resolve(true));
        });
        server.on('error', () => resolve(false));
      });

      if (!isPortAvailable) {
        issues.push('Port 3000 is already in use');
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'Network connectivity validation passed'
          : `Network issues found: ${issues.join(', ')}`,
        details: { issues, portChecked: 3000 },
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        passed: false,
        message: `Network validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

      if (heapUsedMB > 500) {
        issues.push(`High memory usage: ${heapUsedMB}MB`);
      }

      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);

      if (majorVersion < 18) {
        issues.push(`Outdated Node.js version: ${nodeVersion} (recommend 18+)`);
      }

      const passed = issues.length === 0;
      const duration = Date.now() - startTime;

      return {
        passed,
        message: passed
          ? 'Performance validation passed'
          : `Performance issues found: ${issues.join(', ')}`,
        details: {
          issues,
          memoryUsage: heapUsedMB,
          nodeVersion,
        },
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

  /**
   * Generate validation summary
   */
  private generateSummary(checks: Record<string, ValidationResult>) {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(check => check.passed).length;
    const failed = total - passed;
    const warnings = Object.values(checks).filter(
      check => !check.passed && check.message.toLowerCase().includes('warning')
    ).length;

    return {
      total,
      passed,
      failed,
      warnings,
    };
  }

  /**
   * Validate database URL format
   */
  private isValidDatabaseUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['postgres:', 'postgresql:', 'mysql:', 'sqlite:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Get development quality metrics
   */
  async getQualityMetrics(): Promise<QualityMetrics> {
    this.logger.info('Collecting quality metrics');

    const metrics: QualityMetrics = {
      typescript: {
        strictMode: true, // This would be determined by checking tsconfig.json
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
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      codebase: {
        totalFiles: 0,
        totalLines: 0,
        complexityScore: 0,
        testCoverage: 0,
      },
    };

    try {
      // Collect file statistics
      const fs = await import('fs');
      const path = await import('path');

      const srcPath = path.join(process.cwd(), 'src');
      if (fs.existsSync(srcPath)) {
        const stats = await this.analyzeCodebase(srcPath);
        metrics.codebase = { ...metrics.codebase, ...stats };
      }
    } catch (error) {
      this.logger.error('Failed to collect quality metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return metrics;
  }

  /**
   * Analyze codebase statistics
   */
  private async analyzeCodebase(srcPath: string) {
    const fs = await import('fs');
    const path = await import('path');

    let totalFiles = 0;
    let totalLines = 0;
    let complexityScore = 0;

    const traverse = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          traverse(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          totalFiles++;

          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content
            .split('\n')
            .filter((line: string) => line.trim() && !line.trim().startsWith('//')).length;
          totalLines += lines;

          // Simple complexity calculation
          const complexityMatches = content.match(/(if|for|while|switch|catch)\s*\(/g) || [];
          complexityScore += complexityMatches.length;
        }
      });
    };

    traverse(srcPath);

    return {
      totalFiles,
      totalLines,
      complexityScore,
    };
  }
}
