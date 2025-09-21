#!/usr/bin/env tsx

/*
 * PosalPro CLI - Authentication Commands
 *
 * Handles login, logout, session management, and authentication-related operations
 */

import { logDebug, logError, logInfo } from '../../../src/lib/logger';
import { ApiClient } from '../core/api-client';
import { CommandContext } from '../core/types';

export async function handleLoginCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const [_, email, password, role] = tokens;

  if (!email || !password) {
    console.log('Usage: login <email> <password> [role]');
    return;
  }

  try {
    await api.login(email, password, role);
    console.log('Login successful.');
  } catch (error) {
    logError('CLI: Login command failed', {
      component: 'AuthCommands',
      operation: 'login_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      email,
      role,
    });
    throw error;
  }
}

export async function handleLoginAsCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const [_, email, password, role, tag] = tokens;

  if (!email || !password) {
    console.log('Usage: login-as <email> <password> [role] [tag]');
    return;
  }

  const sessionTag = tag || (email.includes('@') ? email.split('@')[0] : email);

  try {
    // First login with the default session to get proper authentication
    await api.login(email, password, role);

    // Then switch to the named session and copy the authentication cookies
    (api as any).switchSession(sessionTag);

    console.log(`Login successful as ${email}. Session tag: ${sessionTag}`);
  } catch (error) {
    logError('CLI: Login-as command failed', {
      component: 'AuthCommands',
      operation: 'login_as_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      email,
      role,
      tag: sessionTag,
    });
    throw error;
  }
}

export async function handleUseSessionCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const tag = tokens[1];

  if (!tag) {
    console.log('Usage: use-session <tag>');
    return;
  }

  try {
    (api as any).switchSession(tag);
    console.log(`Switched to session: ${tag}`);
  } catch (error) {
    logError('CLI: Use-session command failed', {
      component: 'AuthCommands',
      operation: 'use_session_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      tag,
    });
    throw error;
  }
}

export async function handleWhoamiCommand(context: CommandContext): Promise<void> {
  const { api } = context;

  try {
    const res = await api.request('GET', '/api/profile');
    const text = await res.text();
    console.log(text);
  } catch (error) {
    logError('CLI: Whoami command failed', {
      component: 'AuthCommands',
      operation: 'whoami_command',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function handleLogoutCommand(context: CommandContext): Promise<void> {
  const { api } = context;

  try {
    // Clear session cookies
    (api as any).jar.clear();
    console.log('Logged out successfully.');
  } catch (error) {
    logError('CLI: Logout command failed', {
      component: 'AuthCommands',
      operation: 'logout_command',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function handleCookiesCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const sub = (tokens[1] || '').toLowerCase();

  if (sub !== 'show') {
    console.log('Usage: cookies show');
    return;
  }

  try {
    // 1) Print local Cookie header
    const cookieHeader = (api as any).getCookieHeader();
    console.log('CLI Cookie header to be sent:');
    console.log(cookieHeader || '(empty)');
    const cookieNames = (cookieHeader || '')
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.split('=')[0]);
    console.log('Cookie names:', cookieNames.length ? cookieNames.join(', ') : '(none)');

    // 2) Server-side debug
    try {
      const res = await api.request('GET', '/api/auth/debug');
      const text = await res.text();
      console.log(`\nServer /api/auth/debug → ${res.status}`);
      try {
        const j = JSON.parse(text);
        console.log('Server sees cookie(s):', j?.cookieNamesPresent || []);
        console.log('hasCookie:', j?.hasCookie);
        console.log('session.hasUser:', j?.session?.hasUser ?? false);
        console.log('token.hasSessionId:', j?.token?.hasSessionId ?? false);
      } catch {
        console.log(text);
      }
    } catch (e) {
      console.log('auth debug endpoint unavailable, falling back to /api/auth/session');
      try {
        const res2 = await api.request('GET', '/api/auth/session');
        const text2 = await res2.text();
        console.log(`/api/auth/session → ${res2.status}`);
        console.log(text2);
      } catch (e2) {
        console.log('Fallback request failed:', (e2 as Error)?.message);
      }
    }
  } catch (error) {
    logError('CLI: Cookies command failed', {
      component: 'AuthCommands',
      operation: 'cookies_command',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function handleTroubleshootAuthCommand(context: CommandContext): Promise<void> {
  const { api } = context;

  try {
    console.log('🔍 Troubleshooting Authentication Issues...\n');

    // 1. Check current session
    console.log('1. Checking current session...');
    try {
      const sessionRes = await api.request('GET', '/api/auth/session');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        console.log('✅ Session endpoint accessible');
        console.log('Session data:', JSON.stringify(sessionData, null, 2));
      } else {
        console.log(`❌ Session endpoint failed: ${sessionRes.status}`);
      }
    } catch (error) {
      console.log(`❌ Session check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 2. Check profile endpoint
    console.log('\n2. Checking profile endpoint...');
    try {
      const profileRes = await api.request('GET', '/api/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        console.log('✅ Profile endpoint accessible');
        console.log('Profile data:', JSON.stringify(profileData, null, 2));
      } else {
        console.log(`❌ Profile endpoint failed: ${profileRes.status}`);
      }
    } catch (error) {
      console.log(`❌ Profile check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 3. Check cookies
    console.log('\n3. Checking cookies...');
    const cookieHeader = (api as any).getCookieHeader();
    console.log('Cookie header:', cookieHeader || '(empty)');

    // 4. Check CSRF token
    console.log('\n4. Checking CSRF token...');
    try {
      const csrfRes = await api.request('GET', '/api/auth/csrf');
      if (csrfRes.ok) {
        const csrfData = await csrfRes.json();
        console.log('✅ CSRF endpoint accessible');
        console.log('CSRF token:', csrfData.csrfToken ? 'Present' : 'Missing');
      } else {
        console.log(`❌ CSRF endpoint failed: ${csrfRes.status}`);
      }
    } catch (error) {
      console.log(`❌ CSRF check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n🔍 Authentication troubleshooting complete.');
  } catch (error) {
    logError('CLI: Troubleshoot auth command failed', {
      component: 'AuthCommands',
      operation: 'troubleshoot_auth_command',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function handleTroubleshootDashboardCommand(context: CommandContext): Promise<void> {
  const { api } = context;

  console.log('🔍 Troubleshooting Dashboard RBAC/Entitlements & Fallbacks');
  console.log('========================================================\n');

  try {
    // Check dashboard access
    console.log('1. Checking dashboard access...');
    const res = await api.request('GET', '/api/dashboard/enhanced-stats');
    if (res.ok) {
      console.log('✅ Dashboard access granted');
      const stats = await res.json();
      console.log(`   Stats available: ${Object.keys(stats).length} metrics`);
    } else {
      console.log(`❌ Dashboard access denied: ${res.status}`);
    }

    // Check RBAC permissions
    console.log('\n2. Checking RBAC permissions...');
    const rbacRes = await api.request('GET', '/api/rbac/check');
    if (rbacRes.ok) {
      console.log('✅ RBAC system operational');
    } else {
      console.log(`❌ RBAC system issue: ${rbacRes.status}`);
    }

    // Check entitlements
    console.log('\n3. Checking entitlements...');
    const entitlementsRes = await api.request('GET', '/api/entitlements/check');
    if (entitlementsRes.ok) {
      console.log('✅ Entitlements system operational');
    } else {
      console.log(`❌ Entitlements system issue: ${entitlementsRes.status}`);
    }

    console.log('\n✅ Dashboard troubleshooting complete');
  } catch (error) {
    logError('CLI: Troubleshoot dashboard command failed', {
      component: 'AuthCommands',
      operation: 'troubleshoot_dashboard',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Export all auth command handlers
export const authCommands = {
  login: handleLoginCommand,
  'login-as': handleLoginAsCommand,
  'use-session': handleUseSessionCommand,
  whoami: handleWhoamiCommand,
  logout: handleLogoutCommand,
  cookies: handleCookiesCommand,
  'troubleshoot auth': handleTroubleshootAuthCommand,
  'troubleshoot dashboard': handleTroubleshootDashboardCommand,
};
