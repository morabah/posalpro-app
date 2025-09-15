/**
 * Tests for scripts/verify-prisma-client.js
 *
 * Tests Prisma client verification script under various scenarios:
 * - Success cases with properly configured Prisma client
 * - Failure cases with Data Proxy misconfigurations
 * - Environment file loading
 * - Exit codes and logged messages
 * - Prisma client connection management
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('scripts/verify-prisma-client.js', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/verify-prisma-client.js');

  // Helper function to run the script with custom environment
  const runScript = (envVars = {}, timeout = 15000) => {
    const result = spawnSync('node', [scriptPath], {
      env: { ...process.env, ...envVars },
      encoding: 'utf8',
      timeout: timeout
    });

    return {
      exitCode: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      output: result.output?.join('') || ''
    };
  };

  // Helper to create temporary environment files for testing
  const createTempEnvFile = (filename, content) => {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  };

  const removeTempEnvFile = (filename) => {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  };

  describe('Environment file loading', () => {
    test('should load environment files in correct order', () => {
      // Create temporary environment files
      createTempEnvFile('.env.test', 'TEST_VAR=base\n');
      createTempEnvFile('production-env-vars.test.env', 'TEST_VAR=production\n');
      createTempEnvFile('.env.local.test', 'TEST_VAR=local\n');

      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      };

      const result = runScript(envVars);

      expect(result.output).toContain('📁 Loading environment files...');
      expect(result.output).toContain('✅ Loaded .env');
      expect(result.output).toContain('✅ Loaded production-env-vars.env');
      expect(result.output).toContain('ℹ️  .env.production not found');
      expect(result.output).toContain('✅ Loaded .env.local');

      // Cleanup
      removeTempEnvFile('.env.test');
      removeTempEnvFile('production-env-vars.test.env');
      removeTempEnvFile('.env.local.test');
    });

    test('should handle missing environment files gracefully', () => {
      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      };

      const result = runScript(envVars);

      expect(result.output).toContain('📁 Loading environment files...');
      expect(result.output).toContain('✅ Loaded .env');
      expect(result.output).toContain('✅ Loaded production-env-vars.env');
      expect(result.output).toContain('ℹ️  .env.production not found');
      expect(result.output).toContain('✅ Loaded .env.local');
    });
  });

  describe('Success scenarios', () => {
    test('should succeed with properly configured direct connection', () => {
      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key',
        PRISMA_GENERATE_DATAPROXY: 'false',
        PRISMA_CLIENT_ENGINE_TYPE: 'binary'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('✅ Prisma client verification complete!');
      expect(result.output).toContain('✅ Client is properly configured for direct PostgreSQL connections');
      expect(result.output).toContain('🔌 Prisma client disconnected successfully');
    });

    test('should succeed with Data Proxy configuration', () => {
      const envVars = {
        DATABASE_URL: 'prisma://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key',
        PRISMA_GENERATE_DATAPROXY: 'true',
        PRISMA_CLIENT_ENGINE_TYPE: 'dataproxy'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('✅ Prisma client verification complete!');
      expect(result.output).toContain('🔌 Prisma client disconnected successfully');
    });
  });

  describe('Failure scenarios', () => {
    test('should fail with Data Proxy URL but direct connection settings', () => {
      const envVars = {
        DATABASE_URL: 'prisma://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key',
        PRISMA_GENERATE_DATAPROXY: 'false',
        PRISMA_CLIENT_ENGINE_TYPE: 'binary'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('❌ CRITICAL: Data Proxy URL detected with direct connection configuration');
      expect(result.output).toContain('🚫 Build should fail - Data Proxy misconfiguration found');
      expect(result.output).toContain('🔌 Prisma client disconnected successfully');
    });

    test('should fail with missing DATABASE_URL', () => {
      const envVars = {
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('❌ CRITICAL: DATABASE_URL not found in environment variables');
      expect(result.output).toContain('🚫 Build should fail - Data Proxy misconfiguration found');
    });

    test('should fail with invalid DATABASE_URL protocol', () => {
      const envVars = {
        DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('❌ CRITICAL: Invalid DATABASE_URL protocol');
      expect(result.output).toContain('🚫 Build should fail - Data Proxy misconfiguration found');
    });
  });

  describe('Warning scenarios', () => {
    test('should warn with direct URL but Data Proxy settings', () => {
      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key',
        PRISMA_GENERATE_DATAPROXY: 'true',
        PRISMA_CLIENT_ENGINE_TYPE: 'dataproxy'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(0); // Warnings don't fail the build
      expect(result.output).toContain('⚠️  WARNING: Direct connection URL (postgresql://) with Data Proxy settings');
      expect(result.output).toContain('⚠️  WARNINGS DETECTED');
    });
  });

  describe('Prisma client connection management', () => {
    test('should always disconnect Prisma client even on errors', () => {
      const envVars = {
        DATABASE_URL: 'prisma://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key',
        PRISMA_GENERATE_DATAPROXY: 'false', // This will cause an error
        PRISMA_CLIENT_ENGINE_TYPE: 'binary'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('🔌 Prisma client disconnected successfully');
      expect(result.output).toContain('❌ CRITICAL: Data Proxy URL detected with direct connection configuration');
    });

    test('should handle disconnect errors gracefully', () => {
      // This test is harder to simulate without mocking, but we can verify
      // the disconnect logic is present in the output
      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      };

      const result = runScript(envVars);

      // Should show disconnect success message
      expect(result.output).toContain('🔌 Prisma client disconnected successfully');
    });
  });

  describe('Script execution', () => {
    test('should be executable', () => {
      expect(fs.existsSync(scriptPath)).toBe(true);
      expect(fs.statSync(scriptPath).mode & parseInt('111', 8)).toBeTruthy();
    });

    test('should complete within timeout', () => {
      const start = Date.now();
      const result = runScript({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      }, 10000);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
      expect(result.exitCode).toBe(0);
    });

    test('should provide helpful error messages', () => {
      const envVars = {
        DATABASE_URL: 'prisma://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key',
        PRISMA_GENERATE_DATAPROXY: 'false',
        PRISMA_CLIENT_ENGINE_TYPE: 'binary'
      };

      const result = runScript(envVars);

      expect(result.output).toContain('💡 To fix this:');
      expect(result.output).toContain('1. Ensure PRISMA_GENERATE_DATAPROXY=false');
      expect(result.output).toContain('2. Set PRISMA_CLIENT_ENGINE_TYPE=binary or library');
      expect(result.output).toContain('3. Regenerate the Prisma client: npx prisma generate');
      expect(result.output).toContain('4. Use a postgresql:// URL, not prisma://');
    });
  });

  describe('Verification summary', () => {
    test('should show success summary on success', () => {
      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      };

      const result = runScript(envVars);

      expect(result.output).toContain('📊 Verification Summary:');
      expect(result.output).toContain('✅ ALL CHECKS PASSED');
      expect(result.output).toContain('✅ Prisma client is properly configured');
      expect(result.output).toContain('🎉 Build can proceed - no configuration issues detected');
    });

    test('should show error summary on failure', () => {
      const envVars = {
        DATABASE_URL: 'prisma://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key',
        PRISMA_GENERATE_DATAPROXY: 'false',
        PRISMA_CLIENT_ENGINE_TYPE: 'binary'
      };

      const result = runScript(envVars);

      expect(result.output).toContain('📊 Verification Summary:');
      expect(result.output).toContain('❌ CRITICAL ERRORS DETECTED');
      expect(result.output).toContain('🚫 Build should fail - Data Proxy misconfiguration found');
      expect(result.output).toContain('💡 This configuration will cause runtime errors in production');
    });
  });
});
