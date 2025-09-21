#!/usr/bin/env tsx

/*
 * PosalPro App CLI - MODULAR VERSION
 *
 * This is the new modular version of the CLI that replaces the monolithic app-cli.ts
 *
 * 🚀 ALWAYS USE THIS CLI FOR:
 *   - Database operations and schema management
 *   - API testing and monitoring
 *   - Authentication and session management
 *   - System health monitoring
 *   - Environment variable inspection
 *   - Data export/import operations
 *   - Test data generation
 *   - RBAC permission testing
 *   - Multi-session authentication management
 *
 * 📋 AVAILABLE COMMANDS:
 *   - Authentication: login, login-as, use-session, whoami, logout
 *   - Database: detect-db, db, health, health:db, health:api
 *   - API Testing: get, post, put, delete <endpoint>
 *   - Environment: env show, env list
 *   - Troubleshooting: troubleshoot auth, cookies show
 *
 * ⚡ ENHANCED FEATURES:
 *   - Modular architecture for better maintainability
 *   - Automatic .env file loading
 *   - Multi-session management with tagged sessions
 *   - Comprehensive error handling with structured logging
 *   - Real-time API monitoring
 *   - Data export in JSON/CSV/SQL formats
 *
 * Usage Examples:
 *   npm run app:cli                                      # interactive REPL
 *   npm run app:cli -- --command "health"                # system health check
 *   npm run app:cli -- --command "login user@example.com password123 admin" # login
 *   npm run app:cli -- --command "get /api/proposals"    # API request
 *   npm run app:cli -- --command "db proposal findMany '{\"take\":5}'" # database query
 *   npm run app:cli -- --command "detect-db"             # database detection
 */

// Import and run the modular CLI
import './cli/cli-main';
