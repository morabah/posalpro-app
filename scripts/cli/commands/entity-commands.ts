#!/usr/bin/env tsx

/*
 * PosalPro CLI - Entity Commands
 *
 * Handles CRUD operations for customers, products, proposals, and users
 */

import { logDebug, logError, logInfo } from '../../../src/lib/logger';
import { ApiClient } from '../core/api-client';
import { CommandContext } from '../core/types';

// Customer commands
export async function handleCustomersCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (!subCommand) {
    console.log('Usage: customers <action> [options]');
    console.log('Actions: list, create, update, delete, get');
    console.log('Examples:');
    console.log('  customers list --limit=10');
    console.log('  customers create \'{"name":"Test","email":"test@example.com"}\'');
    console.log('  customers get <id>');
    return;
  }

  try {
    switch (subCommand) {
      case 'list': {
        const limit = tokens.find(t => t.startsWith('--limit='))?.split('=')[1] || '50';
        const res = await api.request('GET', `/api/customers?limit=${limit}`);
        console.log(await res.text());
        break;
      }
      case 'create': {
        const data = tokens.slice(2).join(' ');
        if (!data) {
          console.log('Usage: customers create <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('POST', '/api/customers', body);
        console.log(await res.text());
        break;
      }
      case 'update': {
        const id = tokens[2];
        const data = tokens.slice(3).join(' ');
        if (!id || !data) {
          console.log('Usage: customers update <id> <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('PUT', `/api/customers/${id}`, body);
        console.log(await res.text());
        break;
      }
      case 'delete': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: customers delete <id>');
          return;
        }
        const res = await api.request('DELETE', `/api/customers/${id}`);
        console.log(await res.text());
        break;
      }
      case 'get': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: customers get <id>');
          return;
        }
        const res = await api.request('GET', `/api/customers/${id}`);
        console.log(await res.text());
        break;
      }
      default:
        console.log(`Unknown customers action: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError('CLI: Customers command failed', {
      component: 'EntityCommands',
      operation: 'customers_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
    });
    throw error;
  }
}

// Product commands
export async function handleProductsCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (!subCommand) {
    console.log('Usage: products <action> [options]');
    console.log('Actions: list, create, update, delete, get');
    console.log('Examples:');
    console.log('  products list --limit=10');
    console.log('  products create \'{"name":"Test Product","price":100}\'');
    console.log('  products get <id>');
    return;
  }

  try {
    switch (subCommand) {
      case 'list': {
        const limit = tokens.find(t => t.startsWith('--limit='))?.split('=')[1] || '50';
        const res = await api.request('GET', `/api/products?limit=${limit}`);
        console.log(await res.text());
        break;
      }
      case 'create': {
        const data = tokens.slice(2).join(' ');
        if (!data) {
          console.log('Usage: products create <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('POST', '/api/products', body);
        console.log(await res.text());
        break;
      }
      case 'update': {
        const id = tokens[2];
        const data = tokens.slice(3).join(' ');
        if (!id || !data) {
          console.log('Usage: products update <id> <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('PUT', `/api/products/${id}`, body);
        console.log(await res.text());
        break;
      }
      case 'delete': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: products delete <id>');
          return;
        }
        const res = await api.request('DELETE', `/api/products/${id}`);
        console.log(await res.text());
        break;
      }
      case 'get': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: products get <id>');
          return;
        }
        const res = await api.request('GET', `/api/products/${id}`);
        console.log(await res.text());
        break;
      }
      default:
        console.log(`Unknown products action: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError('CLI: Products command failed', {
      component: 'EntityCommands',
      operation: 'products_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
    });
    throw error;
  }
}

// Proposal commands
export async function handleProposalsCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (!subCommand) {
    console.log('Usage: proposals <action> [options]');
    console.log('Actions: list, create, update, delete, get, patch-products, patch-manual-total, cache, backfill, add-product, update-product, remove-product, snapshot');
    console.log('Examples:');
    console.log('  proposals list --limit=10');
    console.log('  proposals create \'{"title":"Test Proposal","customerId":"..."}\'');
    console.log('  proposals get <id>');
    return;
  }

  try {
    switch (subCommand) {
      case 'list': {
        const limit = tokens.find(t => t.startsWith('--limit='))?.split('=')[1] || '50';
        const res = await api.request('GET', `/api/proposals?limit=${limit}`);
        console.log(await res.text());
        break;
      }
      case 'create': {
        const data = tokens.slice(2).join(' ');
        if (!data) {
          console.log('Usage: proposals create <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('POST', '/api/proposals', body);
        console.log(await res.text());
        break;
      }
      case 'update': {
        const id = tokens[2];
        const data = tokens.slice(3).join(' ');
        if (!id || !data) {
          console.log('Usage: proposals update <id> <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('PUT', `/api/proposals/${id}`, body);
        console.log(await res.text());
        break;
      }
      case 'delete': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: proposals delete <id>');
          return;
        }
        const res = await api.request('DELETE', `/api/proposals/${id}`);
        console.log(await res.text());
        break;
      }
      case 'get': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: proposals get <id>');
          return;
        }
        const res = await api.request('GET', `/api/proposals/${id}`);
        console.log(await res.text());
        break;
      }
      case 'patch-products': {
        const id = tokens[2];
        const data = tokens.slice(3).join(' ');
        if (!id || !data) {
          console.log('Usage: proposals patch-products <id> <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('PATCH', `/api/proposals/${id}/products`, body);
        console.log(await res.text());
        break;
      }
      case 'patch-manual-total': {
        const id = tokens[2];
        const total = tokens[3];
        if (!id || !total) {
          console.log('Usage: proposals patch-manual-total <id> <total>');
          return;
        }
        const res = await api.request('PATCH', `/api/proposals/${id}/manual-total`, { total: parseFloat(total) });
        console.log(await res.text());
        break;
      }
      case 'cache': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: proposals cache <id>');
          return;
        }
        const res = await api.request('POST', `/api/proposals/${id}/cache`);
        console.log(await res.text());
        break;
      }
      case 'backfill': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: proposals backfill <id>');
          return;
        }
        const res = await api.request('POST', `/api/proposals/${id}/backfill`);
        console.log(await res.text());
        break;
      }
      case 'add-product': {
        const proposalId = tokens[2];
        const productId = tokens[3];
        const qty = Number(tokens[4]);
        const unitPrice = tokens[5] ? Number(tokens[5]) : undefined;
        const discount = tokens[6] ? Number(tokens[6]) : 0;
        if (!proposalId || !productId || !Number.isFinite(qty)) {
          console.log('Usage: proposals add-product <proposalId> <productId> <qty> [unitPrice] [discount]');
          return;
        }
        const body = {
          productId,
          quantity: qty,
          unitPrice,
          discount
        };
        const res = await api.request('POST', `/api/proposals/${proposalId}/products`, body);
        console.log(await res.text());
        break;
      }
      case 'update-product': {
        const id = tokens[2];
        const productId = tokens[3];
        const data = tokens.slice(4).join(' ');
        if (!id || !productId || !data) {
          console.log('Usage: proposals update-product <id> <productId> <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('PUT', `/api/proposals/${id}/products/${productId}`, body);
        console.log(await res.text());
        break;
      }
      case 'remove-product': {
        const id = tokens[2];
        const productId = tokens[3];
        if (!id || !productId) {
          console.log('Usage: proposals remove-product <id> <productId>');
          return;
        }
        const res = await api.request('DELETE', `/api/proposals/${id}/products/${productId}`);
        console.log(await res.text());
        break;
      }
      case 'snapshot': {
        const id = tokens[2];
        const changeType = tokens[3];
        const summary = tokens[4];
        if (!id) {
          console.log('Usage: proposals snapshot <id> [changeType] [summary]');
          return;
        }
        const body: any = {};
        if (changeType) body.changeType = changeType;
        if (summary) body.summary = summary;
        const res = await api.request('POST', `/api/proposals/${id}/snapshot`, body);
        console.log(await res.text());
        break;
      }
      case 'cache': {
        const id = tokens[2];
        if (id) {
          console.log(`🔍 Inspecting proposal cache for ID: ${id}`);
          const res = await api.request('GET', `/api/proposals/${id}/cache`);
          console.log(await res.text());
        } else {
          console.log('📋 Listing all cached proposals...');
          const res = await api.request('GET', '/api/proposals/cache');
          console.log(await res.text());
        }
        break;
      }
      case 'backfill-step4': {
        const limit = tokens[2] || '100';
        const execute = tokens.includes('--execute');
        if (!execute) {
          console.log('⚠️ WARNING: This will mirror DB products to metadata!');
          console.log('Use "proposals backfill-step4 [limit] --execute" to confirm.');
          return;
        }
        console.log(`🔄 Mirroring DB products to metadata (limit: ${limit})...`);
        const res = await api.request('POST', `/api/proposals/backfill-step4?limit=${limit}`);
        console.log(await res.text());
        break;
      }
      default:
        console.log(`Unknown proposals action: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError('CLI: Proposals command failed', {
      component: 'EntityCommands',
      operation: 'proposals_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
    });
    throw error;
  }
}

// User commands
export async function handleUsersCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (!subCommand) {
    console.log('Usage: users <action> [options]');
    console.log('Actions: list, create, update, delete, get');
    console.log('Examples:');
    console.log('  users list --limit=10');
    console.log('  users create \'{"name":"Test User","email":"test@example.com"}\'');
    console.log('  users get <id>');
    return;
  }

  try {
    switch (subCommand) {
      case 'list': {
        const limit = tokens.find(t => t.startsWith('--limit='))?.split('=')[1] || '50';
        const res = await api.request('GET', `/api/users?limit=${limit}`);
        console.log(await res.text());
        break;
      }
      case 'create': {
        const data = tokens.slice(2).join(' ');
        if (!data) {
          console.log('Usage: users create <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('POST', '/api/users', body);
        console.log(await res.text());
        break;
      }
      case 'update': {
        const id = tokens[2];
        const data = tokens.slice(3).join(' ');
        if (!id || !data) {
          console.log('Usage: users update <id> <json_data>');
          return;
        }
        const body = JSON.parse(data);
        const res = await api.request('PUT', `/api/users/${id}`, body);
        console.log(await res.text());
        break;
      }
      case 'delete': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: users delete <id>');
          return;
        }
        const res = await api.request('DELETE', `/api/users/${id}`);
        console.log(await res.text());
        break;
      }
      case 'get': {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: users get <id>');
          return;
        }
        const res = await api.request('GET', `/api/users/${id}`);
        console.log(await res.text());
        break;
      }
      default:
        console.log(`Unknown users action: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError('CLI: Users command failed', {
      component: 'EntityCommands',
      operation: 'users_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
    });
    throw error;
  }
}

// Export all entity command handlers
export const entityCommands = {
  customers: handleCustomersCommand,
  products: handleProductsCommand,
  proposals: handleProposalsCommand,
  users: handleUsersCommand,
};
