/**
 * PosalPro MVP2 - Comprehensive Error Detection System
 * Detects and diagnoses both frontend and backend errors in real-time
 * Created in response to persistent proposal API 500 errors
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 PosalPro MVP2 - Comprehensive Error Detection System');
console.log('====================================================\n');

class ErrorDetectionSystem {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  // 1. BACKEND ERROR DETECTION
  async detectBackendErrors() {
    console.log('🔧 1. BACKEND ERROR DETECTION');
    console.log('──────────────────────────────');

    // TypeScript Compilation Errors
    try {
      console.log('📋 Checking TypeScript compilation...');
      const typeOutput = execSync('npm run type-check', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ TypeScript: No errors detected');
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message;
      const errorLines = errorOutput
        .split('\n')
        .filter(
          line => line.includes('error TS') || line.includes('Found') || line.includes('Error:')
        );

      if (errorLines.length > 0) {
        console.log('❌ TypeScript Errors Found:');
        errorLines.forEach(line => {
          console.log(`   ${line.trim()}`);
          this.errors.push({ type: 'TypeScript', message: line.trim() });
        });
      }
    }

    // Prisma Schema Validation
    try {
      console.log('📋 Checking Prisma schema validation...');
      const prismaOutput = execSync('npx prisma validate', { encoding: 'utf8' });
      console.log('✅ Prisma Schema: Valid');
    } catch (error) {
      console.log('❌ Prisma Schema Errors:');
      console.log(`   ${error.message}`);
      this.errors.push({ type: 'Prisma', message: error.message });
    }

    // Database Connection Test
    try {
      console.log('📋 Testing database connection...');
      const healthTest = execSync('curl -s "http://localhost:3000/api/health"', {
        encoding: 'utf8',
      });
      const health = JSON.parse(healthTest);

      if (health.data?.database?.status === 'healthy') {
        console.log('✅ Database: Connected and healthy');
      } else {
        console.log('❌ Database: Connection issues detected');
        this.errors.push({ type: 'Database', message: 'Database connection unhealthy' });
      }
    } catch (error) {
      console.log('❌ Database: Cannot connect or test');
      this.errors.push({ type: 'Database', message: 'Cannot connect to health endpoint' });
    }

    console.log('');
  }

  // 2. FRONTEND ERROR DETECTION
  async detectFrontendErrors() {
    console.log('🎨 2. FRONTEND ERROR DETECTION');
    console.log('─────────────────────────────');

    // React Component Syntax Check
    try {
      console.log('📋 Checking React component syntax...');
      const lintOutput = execSync('npm run lint', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ React Components: No syntax errors');
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message;
      if (errorOutput.includes('error') || errorOutput.includes('Error:')) {
        console.log('❌ React Component Errors:');
        const errorLines = errorOutput
          .split('\n')
          .filter(line => line.includes('error') || line.includes('Error:'));
        errorLines.forEach(line => {
          console.log(`   ${line.trim()}`);
          this.errors.push({ type: 'React', message: line.trim() });
        });
      }
    }

    // Browser Console Error Simulation
    console.log('📋 Testing browser-side API calls...');
    try {
      // Test the exact API call that's failing
      const apiTest = execSync(
        'curl -s "http://localhost:3000/api/proposals?page=1&limit=50&sortBy=createdAt&sortOrder=desc" -w "\\nHTTP_STATUS:%{http_code}"',
        { encoding: 'utf8' }
      );

      const lines = apiTest.split('\n');
      const statusLine = lines.find(line => line.startsWith('HTTP_STATUS:'));
      const status = statusLine ? statusLine.split(':')[1] : 'unknown';

      if (status === '200') {
        console.log('✅ API Endpoint: Responding correctly');
      } else if (status === '401') {
        console.log('⚠️  API Endpoint: Returns 401 (authentication required) - This is expected');
        this.warnings.push({
          type: 'API',
          message: 'Authentication required for proposals endpoint',
        });
      } else if (status === '500') {
        console.log('❌ API Endpoint: 500 Internal Server Error detected');
        this.errors.push({
          type: 'API',
          message: '500 Internal Server Error on proposals endpoint',
        });

        // Try to extract error details from response
        const responseBody = lines.slice(0, -1).join('\n');
        if (responseBody.includes('PrismaClientValidationError')) {
          console.log('🔍 Detected: PrismaClientValidationError');
          this.errors.push({
            type: 'Prisma',
            message: 'PrismaClientValidationError in proposals endpoint',
          });
        }
      } else {
        console.log(`❌ API Endpoint: Unexpected status ${status}`);
        this.errors.push({ type: 'API', message: `Unexpected status code: ${status}` });
      }
    } catch (error) {
      console.log('❌ API Endpoint: Cannot connect');
      this.errors.push({ type: 'API', message: 'Cannot connect to proposals endpoint' });
    }

    console.log('');
  }

  // 3. REAL-TIME LOG MONITORING
  async monitorRealTimeLogs() {
    console.log('📊 3. REAL-TIME LOG MONITORING');
    console.log('─────────────────────────────');

    console.log('📋 Starting real-time log monitoring for 10 seconds...');
    console.log('   (Make a request to the proposals endpoint in another browser tab)');

    return new Promise(resolve => {
      const logProcess = spawn('npm', ['run', 'dev:smart'], { stdio: 'pipe' });

      let logBuffer = '';
      const timeout = setTimeout(() => {
        logProcess.kill();
        resolve();
      }, 10000);

      logProcess.stdout.on('data', data => {
        const logLine = data.toString();
        logBuffer += logLine;

        // Check for specific error patterns
        if (logLine.includes('PrismaClientValidationError')) {
          console.log('🔍 DETECTED: PrismaClientValidationError in real-time logs');
          this.errors.push({
            type: 'Real-time',
            message: 'PrismaClientValidationError detected in logs',
          });
        }

        if (logLine.includes('Unknown field')) {
          console.log('🔍 DETECTED: Unknown field error in real-time logs');
          this.errors.push({ type: 'Real-time', message: 'Unknown field error detected' });
        }

        if (logLine.includes('500') || logLine.includes('Internal Server Error')) {
          console.log('🔍 DETECTED: 500 error in real-time logs');
          this.errors.push({ type: 'Real-time', message: '500 Internal Server Error in logs' });
        }
      });

      logProcess.stderr.on('data', data => {
        const errorLine = data.toString();
        if (errorLine.includes('ERROR') || errorLine.includes('Error')) {
          console.log(`🔍 DETECTED: Error in stderr: ${errorLine.trim()}`);
          this.errors.push({ type: 'Real-time', message: errorLine.trim() });
        }
      });

      logProcess.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  // 4. COMPREHENSIVE ANALYSIS
  generateReport() {
    console.log('📋 4. COMPREHENSIVE ERROR ANALYSIS');
    console.log('───────────────────────────────────');

    if (this.errors.length === 0) {
      console.log('🎉 SUCCESS: No critical errors detected!');
      console.log('✅ All systems appear to be functioning correctly.');
      return;
    }

    console.log(`❌ TOTAL ERRORS FOUND: ${this.errors.length}`);
    console.log(`⚠️  TOTAL WARNINGS: ${this.warnings.length}\n`);

    // Group errors by type
    const errorsByType = {};
    this.errors.forEach(error => {
      if (!errorsByType[error.type]) {
        errorsByType[error.type] = [];
      }
      errorsByType[error.type].push(error.message);
    });

    // Display errors by category
    Object.keys(errorsByType).forEach(type => {
      console.log(`🔴 ${type.toUpperCase()} ERRORS:`);
      errorsByType[type].forEach(message => {
        console.log(`   • ${message}`);
      });
      console.log('');
    });

    // Provide specific fixes for common issues
    console.log('🛠️  RECOMMENDED FIXES:');

    if (errorsByType['Prisma'] || errorsByType['Real-time']) {
      console.log('   1. Fix Prisma schema field mismatches');
      console.log('      → Check estimatedValue vs value field naming');
      console.log('      → Run: npx prisma validate');
    }

    if (errorsByType['TypeScript']) {
      console.log('   2. Resolve TypeScript compilation errors');
      console.log('      → Run: npm run type-check');
      console.log('      → Fix type mismatches and imports');
    }

    if (errorsByType['API']) {
      console.log('   3. Debug API endpoint issues');
      console.log('      → Check server logs for detailed error messages');
      console.log('      → Verify database connection and schema');
    }

    console.log('');
  }

  // 5. FRONTEND-SPECIFIC BROWSER TESTING
  async testBrowserScenarios() {
    console.log('🌐 5. BROWSER-SPECIFIC ERROR TESTING');
    console.log('───────────────────────────────────');

    // Test authentication flow
    console.log('📋 Testing authentication flow...');
    try {
      const authTest = execSync('curl -s "http://localhost:3000/api/auth/session"', {
        encoding: 'utf8',
      });
      const authData = JSON.parse(authTest);

      if (authData.user) {
        console.log('✅ Authentication: User session active');
      } else {
        console.log('⚠️  Authentication: No active session (this is normal)');
      }
    } catch (error) {
      console.log('❌ Authentication: Cannot test auth endpoint');
      this.errors.push({ type: 'Auth', message: 'Cannot access auth endpoint' });
    }

    // Test static asset loading
    console.log('📋 Testing static asset accessibility...');
    try {
      const staticTest = execSync(
        'curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/"',
        { encoding: 'utf8' }
      );

      if (staticTest === '200') {
        console.log('✅ Static Assets: Loading correctly');
      } else {
        console.log(`❌ Static Assets: HTTP ${staticTest}`);
        this.errors.push({ type: 'Static', message: `Static assets returning ${staticTest}` });
      }
    } catch (error) {
      console.log('❌ Static Assets: Cannot access main page');
      this.errors.push({ type: 'Static', message: 'Cannot access main application page' });
    }

    console.log('');
  }
}

// Run the comprehensive error detection
async function runComprehensiveDetection() {
  const detector = new ErrorDetectionSystem();

  await detector.detectBackendErrors();
  await detector.detectFrontendErrors();
  await detector.testBrowserScenarios();
  // Skip real-time monitoring in batch mode to keep it fast
  // await detector.monitorRealTimeLogs();

  detector.generateReport();

  return detector.errors.length === 0;
}

// Run if called directly
if (require.main === module) {
  runComprehensiveDetection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { ErrorDetectionSystem, runComprehensiveDetection };
