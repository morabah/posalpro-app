#!/usr/bin/env tsx

/*
 * PosalPro CLI - Core Types and Interfaces
 *
 * Shared type definitions for the modular CLI architecture
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface CLIErrorOptions {
  operation?: string;
  component?: string;
  metadata?: Record<string, any>;
}

export class CLIError extends Error {
  public readonly operation: string;
  public readonly component: string;
  public readonly metadata: Record<string, any>;

  constructor(message: string, operation: string = 'unknown', component: string = 'CLI', options: CLIErrorOptions = {}) {
    super(message);
    this.name = 'CLIError';
    this.operation = operation;
    this.component = component;
    this.metadata = options.metadata || {};
  }
}

export interface SessionInfo {
  tag: string;
  timestamp: number;
}

export interface ApiRequestOptions {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  redirect?: 'manual' | 'follow';
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }>;
  timestamp: number;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'sql';
  limit?: number;
  where?: Record<string, any>;
  include?: string[];
  exclude?: string[];
}

export interface ImportOptions {
  validateOnly?: boolean;
  skipErrors?: boolean;
  batchSize?: number;
  updateExisting?: boolean;
}

export interface SchemaTestResult {
  schemaName: string;
  testType: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: Record<string, any>;
  duration: number;
}

export interface ComponentAnalysisResult {
  component: string;
  layer: string;
  fields: string[];
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    suggestion?: string;
  }>;
  healthScore: number;
}

export interface RBACTestResult {
  endpoint: string;
  method: HttpMethod;
  role: string;
  expectedAccess: 'allow' | 'deny';
  actualAccess: 'allow' | 'deny';
  status: 'pass' | 'fail';
  message?: string;
  duration: number;
}

export interface ConsistencyCheckResult {
  entity: string;
  entityId: string;
  issues: Array<{
    field: string;
    listValue: any;
    detailValue: any;
    severity: 'high' | 'medium' | 'low';
  }>;
  status: 'consistent' | 'inconsistent';
  checkedAt: number;
}

// Performance tracking types
export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceTracker {
  start(operation: string): void;
  end(operation: string): PerformanceMetric;
  getMetrics(): PerformanceMetric[];
  clear(): void;
}

// Command execution context
export interface CommandContext {
  api: any; // ApiClient instance
  tokens: string[];
  args: string[];
  options: Record<string, any>;
}

export interface CommandHandler {
  (context: CommandContext): Promise<void>;
}

export interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  handler: CommandHandler;
  aliases?: string[];
  options?: Array<{
    name: string;
    description: string;
    type: 'string' | 'boolean' | 'number';
    required?: boolean;
    default?: any;
  }>;
}
