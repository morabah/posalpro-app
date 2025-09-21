#!/usr/bin/env tsx

/*
 * PosalPro CLI - API Client Implementation
 *
 * HTTP client with session management and authentication
 */

import fs from 'node:fs';
import path from 'node:path';
import { URLSearchParams } from 'url';
import { logDebug, logError, logInfo, logWarn } from '../../../src/lib/logger';
import { CookieJar, extractSetCookieList } from './cookie-jar';
import { CLIError, HttpMethod, ApiRequestOptions } from './types';

// Performance tracking
const performanceMetrics: Array<{ operation: string; duration: number; timestamp: number }> = [];

function trackPerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  return fn().then(
    result => {
      const duration = Date.now() - start;
      performanceMetrics.push({ operation, duration, timestamp: Date.now() });
      return result;
    },
    error => {
      const duration = Date.now() - start;
      performanceMetrics.push({ operation, duration, timestamp: Date.now() });
      throw error;
    }
  );
}

// Helper function to create a slug from a string
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// HTTPS fetch wrapper with proper error handling
async function httpsFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    throw new CLIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'network_error',
      'ApiClient',
      { url, originalError: error }
    );
  }
}

export class ApiClient {
  private baseUrl: string;
  private jar: CookieJar;
  private tenantId: string | null;
  private currentSessionTag: string;

  constructor(baseUrl: string, tenantId: string | null = null) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.tenantId = tenantId;
    this.currentSessionTag = 'default';
    const defaultSessionPath = path.resolve(process.cwd(), '.posalpro-cli-session.json');
    const storage = process.env.APP_CLI_SESSION_FILE || defaultSessionPath;
    this.jar = new CookieJar(storage);
  }

  switchSession(tag: string) {
    const safe = slugify(tag || 'default');
    const sessionPath = path.resolve(process.cwd(), `.posalpro-cli-session-${safe}.json`);

    logDebug('CLI: Switching session', {
      component: 'AppCLI',
      operation: 'switch_session',
      fromTag: this.currentSessionTag || 'default',
      toTag: tag,
      newPath: sessionPath,
    });

    // Save current session cookies before switching
    const currentCookies = this.jar.getAllCookies();

    // Create new session jar
    const newJar = new CookieJar(sessionPath);

    // Copy all cookies from current session to new session
    // This preserves authentication cookies across session switches
    if (currentCookies.size > 0) {
      newJar.replaceCookies(currentCookies);
    }

    // Update the jar reference
    this.jar = newJar;
    this.currentSessionTag = tag;

    // Save active session information for persistence across CLI commands
    const activeSessionPath = path.resolve(process.cwd(), '.posalpro-cli-active-session.json');
    logDebug('CLI: Preparing to save active session', {
      component: 'AppCLI',
      operation: 'prepare_save_active_session',
      tag,
      path: activeSessionPath,
    });

    try {
      const activeSession = { tag, timestamp: Date.now() };
      const activeSessionData = JSON.stringify(activeSession, null, 2);

      logDebug('CLI: Writing active session file', {
        component: 'AppCLI',
        operation: 'write_active_session_file',
        tag,
        dataLength: activeSessionData.length,
        path: activeSessionPath,
      });

      fs.writeFileSync(activeSessionPath, activeSessionData);

      // Verify the file was written
      const verifyData = fs.readFileSync(activeSessionPath, 'utf8');
      const verifyParsed = JSON.parse(verifyData);

      logInfo('CLI: Active session saved and verified', {
        component: 'AppCLI',
        operation: 'save_active_session_success',
        tag,
        path: activeSessionPath,
        savedTag: verifyParsed.tag,
        savedTimestamp: verifyParsed.timestamp,
      });
    } catch (err) {
      logError('CLI: Failed to save active session', {
        component: 'AppCLI',
        operation: 'save_active_session_error',
        error: (err as Error)?.message,
        tag,
        path: activeSessionPath,
      });
    }

    logInfo('CLI: Session switched successfully', {
      component: 'AppCLI',
      operation: 'switch_session_success',
      tag,
      cookiesCopied: currentCookies.size,
      sessionFile: sessionPath,
    });
  }

  getTenantId(): string | null {
    return this.tenantId;
  }

  // Expose the exact Cookie header that will be sent
  getCookieHeader(): string {
    return this.jar.getCookieHeader();
  }

  async login(email: string, password: string, role?: string) {
    try {
      logInfo('CLI: Login attempt started', {
        component: 'AppCLI',
        operation: 'login',
        email,
        role,
        baseUrl: this.baseUrl,
      });

      // 1) Get CSRF token
      const csrfRes = await httpsFetch(`${this.baseUrl}/api/auth/csrf`, {
        method: 'GET',
      });

      if (!csrfRes.ok) {
        throw new CLIError(
          `CSRF token fetch failed (${csrfRes.status})`,
          'login_csrf_fetch',
          'AppCLI',
          { status: csrfRes.status, baseUrl: this.baseUrl }
        );
      }

      const rawSetCookie = extractSetCookieList(csrfRes.headers);
      this.jar.setFromSetCookie(rawSetCookie);
      const csrfData = (await csrfRes.json()) as { csrfToken: string };

      logDebug('CLI: CSRF token obtained', {
        component: 'AppCLI',
        operation: 'login_csrf_success',
        hasCsrfToken: !!csrfData.csrfToken,
      });

      // 2) Post credentials to NextAuth callback to obtain session cookie
      const params = new URLSearchParams();
      params.set('csrfToken', csrfData.csrfToken);
      params.set('email', email);
      params.set('password', password);
      if (role) params.set('role', role);
      params.set('callbackUrl', `${this.baseUrl}/dashboard`);

      const loginRes = await httpsFetch(`${this.baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.jar.getCookieHeader(),
        },
        body: params.toString(),
        redirect: 'manual',
      });
      const loginSetCookie = extractSetCookieList(loginRes.headers);
      this.jar.setFromSetCookie(loginSetCookie);

      if (loginRes.status !== 302 && loginRes.status !== 200) {
        const text = await loginRes.text();
        throw new CLIError(
          `Login failed (${loginRes.status}): ${text}`,
          'login_credentials_failed',
          'AppCLI',
          { status: loginRes.status, email, role }
        );
      }

      // Follow one redirect to callbackUrl to collect any additional cookies
      if (
        loginRes.status === 302 ||
        loginRes.status === 303 ||
        loginRes.status === 307 ||
        loginRes.status === 308
      ) {
        const loc = loginRes.headers.get('location');
        if (loc) {
          const redirectUrl = loc.startsWith('http')
            ? loc
            : `${this.baseUrl}${loc.startsWith('/') ? '' : '/'}${loc}`;
          const redirRes = await httpsFetch(redirectUrl, {
            method: 'GET',
            headers: { Cookie: this.jar.getCookieHeader(), Accept: 'text/html,application/json' },
            redirect: 'manual',
          });
          const redirCookies = extractSetCookieList(redirRes.headers);
          this.jar.setFromSetCookie(redirCookies);
        }
      }

      logDebug('CLI: Credentials accepted', {
        component: 'AppCLI',
        operation: 'login_credentials_success',
        status: loginRes.status,
      });

      // 3) Verify session by calling NextAuth session endpoint (stable across roles)
      const verifyRes = await this.request('GET', '/api/auth/session');
      if (!verifyRes.ok) {
        throw new CLIError(
          `Login verification failed (${verifyRes.status})`,
          'login_verification_failed',
          'AppCLI',
          { status: verifyRes.status }
        );
      }

      logInfo('CLI: Login successful', {
        component: 'AppCLI',
        operation: 'login_success',
        email,
        role,
        sessionVerified: true,
      });

      return true;
    } catch (error) {
      logError('CLI: Login failed', {
        component: 'AppCLI',
        operation: 'login_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        role,
        baseUrl: this.baseUrl,
      });
      throw error;
    }
  }

  async request(method: HttpMethod, path: string, body?: any) {
    return trackPerformance(`api_request_${method.toLowerCase()}`, async () => {
      try {
        const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
        const headers: Record<string, string> = {
          Accept: 'application/json',
          Cookie: this.jar.getCookieHeader(),
        };
        if (this.tenantId) {
          headers['x-tenant-id'] = this.tenantId;
        }
        let fetchBody: any = undefined;
        if (body !== undefined && method !== 'GET') {
          headers['Content-Type'] = 'application/json';
          fetchBody = typeof body === 'string' ? body : JSON.stringify(body);
        }

        logDebug('CLI: API request started', {
          component: 'AppCLI',
          operation: 'api_request',
          method,
          path,
          url,
          hasBody: !!body,
          bodySize: body ? JSON.stringify(body).length : 0,
        });

        const res = await httpsFetch(url, { method, headers, body: fetchBody });

        logDebug('CLI: API request completed', {
          component: 'AppCLI',
          operation: 'api_request_complete',
          method,
          path,
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
        });

        if (!res.ok) {
          logWarn('CLI: API request failed', {
            component: 'AppCLI',
            operation: 'api_request_failed',
            method,
            path,
            status: res.status,
            statusText: res.statusText,
          });
        }

        return res;
      } catch (error) {
        logError('CLI: API request error', {
          component: 'AppCLI',
          operation: 'api_request_error',
          method,
          path,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw new CLIError(
          `API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'api_request_error',
          'AppCLI',
          { method, path, originalError: error }
        );
      }
    });
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return [...performanceMetrics];
  }

  // Clear performance metrics
  clearPerformanceMetrics() {
    performanceMetrics.length = 0;
  }
}
