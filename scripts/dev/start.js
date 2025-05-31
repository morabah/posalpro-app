#!/usr/bin/env node

/**
 * Enhanced Development Server with Environment Validation
 * Phase 1.5 - Development Scripts & Validation Tracking
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`),
};

class DevServerManager {
  constructor() {
    this.startTime = Date.now();
    this.validationResults = {
      environment: false,
      dependencies: false,
      configuration: false,
      ports: false,
    };
  }

  async start() {
    try {
      log.header('🚀 PosalPro Development Server - Phase 1.5');
      console.log();

      // Run pre-flight checks
      await this.runPreflightChecks();
      
      // Validate environment
      await this.validateEnvironment();
      
      // Check dependencies
      await this.checkDependencies();
      
      // Validate configuration
      await this.validateConfiguration();
      
      // Check port availability
      await this.checkPortAvailability();
      
      // Display validation summary
      this.displayValidationSummary();
      
      // Start the development server
      if (this.allValidationsPassed()) {
        await this.startNextServer();
      } else {
        log.error('Pre-flight checks failed. Cannot start development server.');
        process.exit(1);
      }
    } catch (error) {
      log.error(`Failed to start development server: ${error.message}`);
      process.exit(1);
    }
  }

  async runPreflightChecks() {
    log.info('Running pre-flight checks...');
    
    // Check if we're in the correct directory
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found. Are you in the correct directory?');
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
    }

    log.success('Pre-flight checks completed');
  }

  async validateEnvironment() {
    log.info('Validating environment configuration...');
    
    try {
      // Check for .env.local file
      const envPath = path.join(process.cwd(), '.env.local');
      if (!fs.existsSync(envPath)) {
        log.warning('.env.local file not found');
        this.validationResults.environment = false;
        return;
      }

      // Read and validate environment variables
      const envContent = fs.readFileSync(envPath, 'utf8');
      const requiredVars = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'API_KEY'];
      const missingVars = [];

      for (const varName of requiredVars) {
        if (!envContent.includes(`${varName}=`)) {
          missingVars.push(varName);
        }
      }

      if (missingVars.length > 0) {
        log.warning(`Missing environment variables: ${missingVars.join(', ')}`);
        this.validationResults.environment = false;
      } else {
        log.success('Environment configuration validated');
        this.validationResults.environment = true;
      }
    } catch (error) {
      log.error(`Environment validation failed: ${error.message}`);
      this.validationResults.environment = false;
    }
  }

  async checkDependencies() {
    log.info('Checking dependencies...');
    
    try {
      // Check if node_modules exists
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        log.warning('node_modules not found. Run npm install first.');
        this.validationResults.dependencies = false;
        return;
      }

      // Check for critical dependencies
      const criticalDeps = ['next', 'react', 'typescript', 'tailwindcss'];
      const missingDeps = [];

      for (const dep of criticalDeps) {
        const depPath = path.join(nodeModulesPath, dep);
        if (!fs.existsSync(depPath)) {
          missingDeps.push(dep);
        }
      }

      if (missingDeps.length > 0) {
        log.warning(`Missing critical dependencies: ${missingDeps.join(', ')}`);
        this.validationResults.dependencies = false;
      } else {
        log.success('Dependencies validated');
        this.validationResults.dependencies = true;
      }
    } catch (error) {
      log.error(`Dependency check failed: ${error.message}`);
      this.validationResults.dependencies = false;
    }
  }

  async validateConfiguration() {
    log.info('Validating configuration files...');
    
    try {
      const configFiles = [
        'next.config.ts',
        'tsconfig.json',
        'eslint.config.mjs',
        'postcss.config.mjs'
      ];
      
      const missingConfigs = [];
      
      for (const configFile of configFiles) {
        const configPath = path.join(process.cwd(), configFile);
        if (!fs.existsSync(configPath)) {
          missingConfigs.push(configFile);
        }
      }

      if (missingConfigs.length > 0) {
        log.warning(`Missing configuration files: ${missingConfigs.join(', ')}`);
        this.validationResults.configuration = false;
      } else {
        log.success('Configuration files validated');
        this.validationResults.configuration = true;
      }
    } catch (error) {
      log.error(`Configuration validation failed: ${error.message}`);
      this.validationResults.configuration = false;
    }
  }

  async checkPortAvailability() {
    log.info('Checking port availability...');
    
    try {
      const net = require('net');
      const port = 3000;
      
      const server = net.createServer();
      
      return new Promise((resolve) => {
        server.listen(port, () => {
          server.close(() => {
            log.success(`Port ${port} is available`);
            this.validationResults.ports = true;
            resolve();
          });
        });
        
        server.on('error', () => {
          log.warning(`Port ${port} is already in use`);
          this.validationResults.ports = false;
          resolve();
        });
      });
    } catch (error) {
      log.error(`Port check failed: ${error.message}`);
      this.validationResults.ports = false;
    }
  }

  displayValidationSummary() {
    console.log();
    log.header('📋 Validation Summary');
    
    const checks = [
      { name: 'Environment Variables', passed: this.validationResults.environment },
      { name: 'Dependencies', passed: this.validationResults.dependencies },
      { name: 'Configuration Files', passed: this.validationResults.configuration },
      { name: 'Port Availability', passed: this.validationResults.ports },
    ];

    checks.forEach(check => {
      const status = check.passed ? '✓' : '✗';
      const color = check.passed ? colors.green : colors.red;
      console.log(`  ${color}${status}${colors.reset} ${check.name}`);
    });

    const passedCount = checks.filter(c => c.passed).length;
    const totalCount = checks.length;
    
    console.log();
    if (passedCount === totalCount) {
      log.success(`All validations passed (${passedCount}/${totalCount})`);
    } else {
      log.warning(`${passedCount}/${totalCount} validations passed`);
    }
    console.log();
  }

  allValidationsPassed() {
    return Object.values(this.validationResults).every(result => result);
  }

  async startNextServer() {
    const elapsed = Date.now() - this.startTime;
    log.info(`Pre-flight checks completed in ${elapsed}ms`);
    log.header('🎯 Starting Next.js development server...');
    console.log();

    // Start Next.js development server
    const nextProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    // Handle process termination
    process.on('SIGINT', () => {
      log.info('Shutting down development server...');
      nextProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      log.info('Shutting down development server...');
      nextProcess.kill('SIGTERM');
      process.exit(0);
    });

    nextProcess.on('error', (error) => {
      log.error(`Failed to start Next.js server: ${error.message}`);
      process.exit(1);
    });

    nextProcess.on('close', (code) => {
      if (code !== 0) {
        log.error(`Next.js server exited with code ${code}`);
        process.exit(code);
      }
    });
  }
}

// Run the development server
if (require.main === module) {
  const devServer = new DevServerManager();
  devServer.start().catch((error) => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = DevServerManager; 