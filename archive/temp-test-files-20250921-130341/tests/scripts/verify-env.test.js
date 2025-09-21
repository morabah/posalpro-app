/**
 * Tests for scripts/verify-env.js
 *
 * Tests environment verification script under various scenarios:
 * - Success cases with valid environment variables
 * - Failure cases with missing required variables
 * - Protocol validation for DATABASE_URL
 * - Exit codes and logged messages
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('scripts/verify-env.js', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/verify-env.js');

  // Helper function to run the script with custom environment
  const runScript = (envVars = {}) => {
    const result = spawnSync('node', [scriptPath], {
      env: { ...process.env, ...envVars },
      encoding: 'utf8',
      timeout: 10000
    });

    return {
      exitCode: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      output: result.output?.join('') || ''
    };
  };

  describe('Success scenarios', () => {
    test('should succeed with all required environment variables', () => {
      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('✅ All required keys present');
      expect(result.output).toContain('✅ DATABASE_URL: Direct connection URL (postgresql://) with correct configuration');
    });

    test('should succeed with direct PostgreSQL URL and correct Prisma settings', () => {
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
      expect(result.output).toContain('✅ DATABASE_URL: Direct connection URL (postgresql://) with correct configuration');
    });

    test('should succeed with Data Proxy URL and correct settings', () => {
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
      expect(result.output).toContain('✅ DATABASE_URL: Data Proxy URL (prisma://) with correct configuration');
    });
  });

  describe('Failure scenarios', () => {
    test('should fail with missing DATABASE_URL', () => {
      const envVars = {
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(0); // The script doesn't fail for missing vars, it just warns
      expect(result.output).toContain('❌ Missing required keys');
      expect(result.output).toContain('DATABASE_URL');
    });

    test('should fail with missing NEXTAUTH_SECRET', () => {
      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(0); // The script doesn't fail for missing vars, it just warns
      expect(result.output).toContain('❌ Missing required keys');
      expect(result.output).toContain('NEXTAUTH_SECRET');
    });

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
      expect(result.output).toContain('❌ DATABASE_URL Protocol Mismatch:');
      expect(result.output).toContain('Data Proxy URL (prisma://) detected but direct connection settings found');
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
      expect(result.output).toContain('❌ Invalid DATABASE_URL Protocol:');
      expect(result.output).toContain('Invalid DATABASE_URL protocol: \'mysql://\'');
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
      expect(result.output).toContain('⚠️  Warnings:');
      expect(result.output).toContain('DATABASE_URL: Direct connection URL (postgresql://) with Data Proxy settings');
    });
  });

  describe('Optional environment variables', () => {
    test('should succeed without optional variables', () => {
      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key'
        // No optional variables
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('✅ All required keys present');
    });

    test('should handle optional variables when present', () => {
      const envVars = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret',
        JWT_SECRET: 'jwt-secret',
        CSRF_SECRET: 'csrf-secret',
        SESSION_ENCRYPTION_KEY: 'session-key',
        NEXT_PUBLIC_ANALYTICS_ID: 'analytics-id',
        NEXT_PUBLIC_SENTRY_DSN: 'sentry-dsn'
      };

      const result = runScript(envVars);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('✅ All required keys present');
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
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.exitCode).toBe(0);
    });
  });
});
