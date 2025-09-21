#!/usr/bin/env tsx

/*
 * PosalPro CLI - API Commands
 *
 * Handles HTTP methods (GET, POST, PUT, DELETE) and API-related operations
 */

import { logDebug, logError } from '../../../src/lib/logger';
import { ApiClient } from '../core/api-client';
import { CommandContext, HttpMethod } from '../core/types';

export async function handleGetCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const path = tokens[1];

  if (!path) {
    console.log('Usage: get <path>');
    return;
  }

  try {
    const res = await api.request('GET' as HttpMethod, path);
    console.log(await res.text());
  } catch (error) {
    logError('CLI: GET command failed', {
      component: 'ApiCommands',
      operation: 'get_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      path,
    });
    throw error;
  }
}

export async function handlePostCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const path = tokens[1];
  const bodyJson = tokens.slice(2).join(' ');

  if (!path || !bodyJson) {
    console.log('Usage: post <path> <json>');
    return;
  }

  try {
    const body = JSON.parse(bodyJson);
    const res = await api.request('POST' as HttpMethod, path, body);
    console.log(await res.text());
  } catch (error) {
    logError('CLI: POST command failed', {
      component: 'ApiCommands',
      operation: 'post_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      path,
      bodyJson,
    });
    throw error;
  }
}

export async function handlePutCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const path = tokens[1];
  const bodyJson = tokens.slice(2).join(' ');

  if (!path || !bodyJson) {
    console.log('Usage: put <path> <json>');
    return;
  }

  try {
    const body = JSON.parse(bodyJson);
    const res = await api.request('PUT' as HttpMethod, path, body);
    console.log(await res.text());
  } catch (error) {
    logError('CLI: PUT command failed', {
      component: 'ApiCommands',
      operation: 'put_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      path,
      bodyJson,
    });
    throw error;
  }
}

export async function handleDeleteCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const path = tokens[1];

  if (!path) {
    console.log('Usage: delete <path>');
    return;
  }

  try {
    const res = await api.request('DELETE' as HttpMethod, path);
    console.log(await res.text());
  } catch (error) {
    logError('CLI: DELETE command failed', {
      component: 'ApiCommands',
      operation: 'delete_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      path,
    });
    throw error;
  }
}

export async function handleBaseCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;

  if (tokens[1]) {
    const normalizedUrl = normalizeBaseUrl(tokens[1]);
    (api as any).baseUrl = normalizedUrl;
    console.log(`Base URL updated to: ${normalizedUrl}`);
  } else {
    console.log(`Current Base URL: ${(api as any).baseUrl}`);
  }
}

// Helper function to normalize base URL
function normalizeBaseUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

// Export all API command handlers
export const apiCommands = {
  get: handleGetCommand,
  post: handlePostCommand,
  put: handlePutCommand,
  delete: handleDeleteCommand,
  base: handleBaseCommand,
};
