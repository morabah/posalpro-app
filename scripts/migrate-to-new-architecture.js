#!/usr/bin/env node

/**
 * Migration Script: Bridge Pattern to New Architecture
 *
 * This script automates the migration process from the current bridge pattern
 * to the new simplified architecture using React Query + Zustand + Service Layer.
 *
 * Usage:
 *   node scripts/migrate-to-new-architecture.js [domain]
 *
 * Examples:
 *   node scripts/migrate-to-new-architecture.js customers
 *   node scripts/migrate-to-new-architecture.js products
 *   node scripts/migrate-to-new-architecture.js proposals
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ====================
// Configuration
// ====================

const DOMAINS = {
  customers: {
    entity: 'Customer',
    resource: 'customers',
    priority: 'high',
    currentBridge: 'CustomerApiBridge',
    currentManagement: 'CustomerManagementBridge',
    currentHooks: ['useCustomer', 'useCustomers'],
    apiRoutes: ['/api/customers', '/api/customers/[id]'],
    components: ['CustomerList', 'CustomerForm', 'CustomerDetail'],
  },
  products: {
    entity: 'Product',
    resource: 'products',
    priority: 'high',
    currentBridge: 'ProductApiBridge',
    currentManagement: 'ProductManagementBridge',
    currentHooks: ['useProduct', 'useProducts'],
    apiRoutes: ['/api/products', '/api/products/[id]'],
    components: ['ProductList', 'ProductForm', 'ProductDetail'],
  },
  proposals: {
    entity: 'Proposal',
    resource: 'proposals',
    priority: 'medium',
    currentBridge: 'ProposalApiBridge',
    currentManagement: 'ProposalManagementBridge',
    currentHooks: ['useProposal', 'useProposals'],
    apiRoutes: ['/api/proposals', '/api/proposals/[id]'],
    components: ['ProposalList', 'ProposalForm', 'ProposalDetail'],
  },
  dashboard: {
    entity: 'Dashboard',
    resource: 'dashboard',
    priority: 'medium',
    currentBridge: 'DashboardApiBridge',
    currentManagement: 'DashboardManagementBridge',
    currentHooks: ['useDashboard'],
    apiRoutes: ['/api/dashboard'],
    components: ['Dashboard', 'DashboardStats'],
  },
  admin: {
    entity: 'Admin',
    resource: 'admin',
    priority: 'low',
    currentBridge: 'AdminApiBridge',
    currentManagement: 'AdminManagementBridge',
    currentHooks: ['useAdmin'],
    apiRoutes: ['/api/admin'],
    components: ['AdminPanel', 'UserManagement'],
  },
};

// ====================
// Utility Functions
// ====================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m', // Reset
  };

  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, 'success');
  }
}

function copyTemplate(templatePath, targetPath, replacements) {
  if (!fs.existsSync(templatePath)) {
    log(`Template not found: ${templatePath}`, 'error');
    return false;
  }

  let content = fs.readFileSync(templatePath, 'utf8');

  // Apply replacements
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(key, 'g');
    content = content.replace(regex, value);
  });

  // Ensure target directory exists
  const targetDir = path.dirname(targetPath);
  ensureDirectoryExists(targetDir);

  // Write the file
  fs.writeFileSync(targetPath, content);
  log(`Created file: ${targetPath}`, 'success');
  return true;
}

function runCommand(command, description) {
  try {
    log(`Running: ${description}`, 'info');
    execSync(command, { stdio: 'inherit' });
    log(`Completed: ${description}`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${description}`, 'error');
    log(`Error: ${error.message}`, 'error');
    return false;
  }
}

function checkPrerequisites() {
  log('Checking prerequisites...', 'info');

  const checks = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'TypeScript', command: 'npx tsc --version' },
  ];

  for (const check of checks) {
    try {
      execSync(check.command, { stdio: 'pipe' });
      log(`✓ ${check.name} is available`, 'success');
    } catch (error) {
      log(`✗ ${check.name} is not available`, 'error');
      return false;
    }
  }

  return true;
}

function validateDomain(domain) {
  if (!DOMAINS[domain]) {
    log(`Invalid domain: ${domain}`, 'error');
    log('Available domains:', 'info');
    Object.keys(DOMAINS).forEach(d => {
      log(`  - ${d} (${DOMAINS[d].priority} priority)`, 'info');
    });
    return false;
  }
  return true;
}

// ====================
// Migration Functions
// ====================

function assessCurrentImplementation(domain) {
  log(`Assessing current implementation for ${domain}...`, 'info');

  const config = DOMAINS[domain];
  const assessment = {
    domain,
    config,
    files: {
      bridge: `src/lib/bridges/${config.currentBridge}.ts`,
      management: `src/components/bridges/${config.currentManagement}.tsx`,
      hooks: config.currentHooks.map(hook => `src/hooks/${hook}.ts`),
      components: config.components.map(comp => `src/components/${comp}.tsx`),
      apiRoutes: config.apiRoutes.map(route => `src/app/api${route}/route.ts`),
    },
    exists: {},
    issues: [],
  };

  // Check if files exist
  Object.entries(assessment.files).forEach(([type, paths]) => {
    if (Array.isArray(paths)) {
      assessment.exists[type] = paths.map(p => ({ path: p, exists: fs.existsSync(p) }));
    } else {
      assessment.exists[type] = { path: paths, exists: fs.existsSync(paths) };
    }
  });

  // Log assessment results
  log('File existence check:', 'info');
  Object.entries(assessment.exists).forEach(([type, files]) => {
    if (Array.isArray(files)) {
      files.forEach(file => {
        const status = file.exists ? '✓' : '✗';
        log(`  ${status} ${file.path}`, file.exists ? 'success' : 'warning');
      });
    } else {
      const status = files.exists ? '✓' : '✗';
      log(`  ${status} ${files.path}`, files.exists ? 'success' : 'warning');
    }
  });

  return assessment;
}

function createServiceLayer(domain) {
  log(`Creating service layer for ${domain}...`, 'info');

  const config = DOMAINS[domain];
  const templatePath = 'templates/migration/service.template.ts';
  const targetPath = `src/services/${config.resource}Service.ts`;

  const replacements = {
    __ENTITY__: config.entity,
    __RESOURCE__: config.resource,
  };

  return copyTemplate(templatePath, targetPath, replacements);
}

function createHooks(domain) {
  log(`Creating hooks for ${domain}...`, 'info');

  const config = DOMAINS[domain];
  const templatePath = 'templates/migration/hook.template.ts';
  const targetPath = `src/hooks/use${config.entity}s_new.ts`;

  const replacements = {
    __ENTITY__: config.entity,
    __RESOURCE__: config.resource,
  };

  return copyTemplate(templatePath, targetPath, replacements);
}

function createStore(domain) {
  log(`Creating Zustand store for ${domain}...`, 'info');

  const config = DOMAINS[domain];
  const templatePath = 'templates/migration/store.template.ts';
  const targetPath = `src/lib/store/${config.resource}Store.ts`;

  const replacements = {
    __ENTITY__: config.entity,
    __RESOURCE__: config.resource,
  };

  return copyTemplate(templatePath, targetPath, replacements);
}

function createComponents(domain) {
  log(`Creating components for ${domain}...`, 'info');

  const config = DOMAINS[domain];
  const templatePath = 'templates/migration/component.template.tsx';
  const targetPath = `src/components/${config.resource}_new/${config.entity}List_new.tsx`;

  const replacements = {
    __ENTITY__: config.entity,
    __RESOURCE__: config.resource,
  };

  return copyTemplate(templatePath, targetPath, replacements);
}

function createPage(domain) {
  log(`Creating page for ${domain}...`, 'info');

  const config = DOMAINS[domain];
  const templatePath = 'templates/migration/page.template.tsx';
  const targetPath = `src/app/(dashboard)/${config.resource}_new/page.tsx`;

  const replacements = {
    __ENTITY__: config.entity,
    __RESOURCE__: config.resource,
  };

  return copyTemplate(templatePath, targetPath, replacements);
}

function runTests(domain) {
  log(`Running tests for ${domain}...`, 'info');

  const commands = [
    { command: 'npm run type-check', description: 'TypeScript type checking' },
    { command: 'npm run lint', description: 'ESLint linting' },
    { command: 'npm run build', description: 'Production build' },
  ];

  let allPassed = true;
  for (const cmd of commands) {
    if (!runCommand(cmd.command, cmd.description)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function createMigrationLog(domain, assessment) {
  log(`Creating migration log for ${domain}...`, 'info');

  const timestamp = new Date().toISOString();
  const logContent = `# Migration Log: ${domain}

## Migration Date
${timestamp}

## Domain Configuration
- Entity: ${assessment.config.entity}
- Resource: ${assessment.config.resource}
- Priority: ${assessment.config.priority}

## Current Implementation Assessment
${Object.entries(assessment.exists)
  .map(([type, files]) => {
    if (Array.isArray(files)) {
      return `### ${type}
${files.map(f => `- ${f.path}: ${f.exists ? 'EXISTS' : 'MISSING'}`).join('\n')}`;
    } else {
      return `### ${type}
- ${files.path}: ${files.exists ? 'EXISTS' : 'MISSING'}`;
    }
  })
  .join('\n\n')}

## Migration Steps Completed
- [ ] Service layer created
- [ ] Hooks migrated
- [ ] Zustand store created
- [ ] Components migrated
- [ ] Page created
- [ ] Tests passing

## Issues Found
${assessment.issues.length > 0 ? assessment.issues.map(issue => `- ${issue}`).join('\n') : '- None'}

## Next Steps
1. Test the new implementation
2. Update imports in existing components
3. Remove old bridge files
4. Update documentation
`;

  const logPath = `migration-logs/${domain}-migration-${timestamp.split('T')[0]}.md`;
  ensureDirectoryExists('migration-logs');
  fs.writeFileSync(logPath, logContent);
  log(`Created migration log: ${logPath}`, 'success');
}

// ====================
// Main Migration Function
// ====================

function migrateDomain(domain) {
  log(`Starting migration for domain: ${domain}`, 'info');

  // Validate domain
  if (!validateDomain(domain)) {
    return false;
  }

  // Check prerequisites
  if (!checkPrerequisites()) {
    return false;
  }

  // Assess current implementation
  const assessment = assessCurrentImplementation(domain);

  // Create migration log
  createMigrationLog(domain, assessment);

  // Step 1: Create service layer
  if (!createServiceLayer(domain)) {
    log('Failed to create service layer', 'error');
    return false;
  }

  // Step 2: Create hooks
  if (!createHooks(domain)) {
    log('Failed to create hooks', 'error');
    return false;
  }

  // Step 3: Create store
  if (!createStore(domain)) {
    log('Failed to create store', 'error');
    return false;
  }

  // Step 4: Create components
  if (!createComponents(domain)) {
    log('Failed to create components', 'error');
    return false;
  }

  // Step 5: Create page
  if (!createPage(domain)) {
    log('Failed to create page', 'error');
    return false;
  }

  // Step 6: Run tests
  if (!runTests(domain)) {
    log('Tests failed - please fix issues before continuing', 'warning');
    return false;
  }

  log(`Migration completed successfully for ${domain}!`, 'success');
  log('Next steps:', 'info');
  log('1. Test the new implementation at the new route', 'info');
  log('2. Update any imports that reference the old components', 'info');
  log('3. Remove old bridge files when ready', 'info');
  log('4. Update documentation', 'info');

  return true;
}

// ====================
// CLI Interface
// ====================

function showHelp() {
  console.log(`
Migration Script: Bridge Pattern to New Architecture

Usage:
  node scripts/migrate-to-new-architecture.js [domain] [options]

Arguments:
  domain    The domain to migrate (customers, products, proposals, dashboard, admin)

Options:
  --help, -h    Show this help message
  --list, -l    List available domains
  --all, -a     Migrate all domains (use with caution)

Examples:
  node scripts/migrate-to-new-architecture.js customers
  node scripts/migrate-to-new-architecture.js products
  node scripts/migrate-to-new-architecture.js --list
  node scripts/migrate-to-new-architecture.js --all

Available Domains:
${Object.entries(DOMAINS)
  .map(([key, config]) => `  ${key.padEnd(12)} (${config.priority} priority) - ${config.entity}`)
  .join('\n')}
`);
}

function listDomains() {
  log('Available domains for migration:', 'info');
  Object.entries(DOMAINS).forEach(([key, config]) => {
    log(`  ${key.padEnd(12)} (${config.priority} priority) - ${config.entity}`, 'info');
  });
}

function migrateAll() {
  log('Starting migration for all domains...', 'warning');
  log('This will create a lot of files. Are you sure?', 'warning');

  const domains = Object.keys(DOMAINS);
  let successCount = 0;
  let failureCount = 0;

  for (const domain of domains) {
    log(`\n--- Migrating ${domain} ---`, 'info');
    if (migrateDomain(domain)) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  log(`\nMigration Summary:`, 'info');
  log(`  Success: ${successCount} domains`, 'success');
  log(`  Failed: ${failureCount} domains`, failureCount > 0 ? 'error' : 'success');
}

// ====================
// Main Execution
// ====================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  if (args.includes('--list') || args.includes('-l')) {
    listDomains();
    return;
  }

  if (args.includes('--all') || args.includes('-a')) {
    migrateAll();
    return;
  }

  const domain = args[0];
  migrateDomain(domain);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  migrateDomain,
  DOMAINS,
  assessCurrentImplementation,
  createServiceLayer,
  createHooks,
  createStore,
  createComponents,
  createPage,
  runTests,
};
