/**
 * Validation Tracking System
 * Central registry for phase completion tracking with integration
 * to logging and performance monitoring systems
 */

import { logInfo, logValidation, logWarn } from './logger';
import { trackPerformanceSync } from './performance';

// Validation status enum
export enum ValidationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// Validation result interface
export interface ValidationResult {
  phase: string;
  status: ValidationStatus;
  details: string;
  lessons?: string;
  patterns?: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: Error | unknown;
}

// Phase information interface
export interface PhaseInfo {
  phase: string;
  description: string;
  totalPrompts: number;
  completedPrompts: number;
  status: ValidationStatus;
  startTime?: string;
  endTime?: string;
  duration?: number;
  validationResults: ValidationResult[];
}

// Project progress interface
export interface ProjectProgress {
  totalPhases: number;
  completedPhases: number;
  currentPhase: string;
  overallStatus: ValidationStatus;
  phases: Record<string, PhaseInfo>;
  startTime: string;
  lastUpdate: string;
  successRate: number;
  totalValidations: number;
}

// Validation tracking configuration
interface ValidationConfig {
  enableTracking: boolean;
  enablePerformanceTracking: boolean;
  enableAutoReporting: boolean;
  reportingInterval: number; // milliseconds
  maxHistorySize: number;
}

// Environment-aware validation configuration
const getValidationConfig = (): ValidationConfig => {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';

  return {
    enableTracking: true,
    enablePerformanceTracking: true,
    enableAutoReporting: isProduction,
    reportingInterval: 300000, // 5 minutes
    maxHistorySize: isProduction ? 100 : 1000,
  };
};

// Validation tracker class
class ValidationTracker {
  private config: ValidationConfig;
  private phases: Map<string, PhaseInfo> = new Map();
  private validationHistory: ValidationResult[] = [];
  private projectStartTime: string;
  private reportingTimer?: NodeJS.Timeout;

  constructor() {
    this.config = getValidationConfig();
    this.projectStartTime = new Date().toISOString();

    if (this.config.enableAutoReporting) {
      this.startAutoReporting();
    }

    // Initialize with known phases from framework
    this.initializePhases();
  }

  private initializePhases(): void {
    // Phase 0: Strategy Brief
    this.registerPhase('0', 'Strategy Brief', 3);

    // Phase 1: Technical Foundation
    this.registerPhase('1', 'Technical Foundation', 5);

    // Add more phases as they are implemented
    this.registerPhase('2', 'Data Architecture', 5);
    this.registerPhase('3', 'UI Foundation', 5);
    this.registerPhase('4', 'State Management', 5);
    this.registerPhase('5', 'Backend Services', 6);
  }

  private startAutoReporting(): void {
    this.reportingTimer = setInterval(() => {
      this.generateProgressReport();
    }, this.config.reportingInterval);
  }

  private cleanupHistory(): void {
    if (this.validationHistory.length > this.config.maxHistorySize) {
      this.validationHistory = this.validationHistory.slice(-this.config.maxHistorySize);
    }
  }

  // Register a new phase
  public registerPhase(phase: string, description: string, totalPrompts: number): void {
    const phaseInfo: PhaseInfo = {
      phase,
      description,
      totalPrompts,
      completedPrompts: 0,
      status: ValidationStatus.PENDING,
      validationResults: [],
    };

    this.phases.set(phase, phaseInfo);
  }

  // Start a phase
  public startPhase(phase: string): void {
    const phaseInfo = this.phases.get(phase);
    if (!phaseInfo) {
      logWarn('Attempted to start unknown phase', { phase });
      return;
    }

    phaseInfo.status = ValidationStatus.IN_PROGRESS;
    phaseInfo.startTime = new Date().toISOString();

    logInfo(`Phase ${phase} started`, {
      phase,
      description: phaseInfo.description,
      totalPrompts: phaseInfo.totalPrompts,
    });
  }

  // Complete a phase
  public completePhase(phase: string): void {
    const phaseInfo = this.phases.get(phase);
    if (!phaseInfo) {
      logWarn('Attempted to complete unknown phase', { phase });
      return;
    }

    const endTime = new Date().toISOString();
    phaseInfo.endTime = endTime;
    phaseInfo.status = ValidationStatus.SUCCESS;

    if (phaseInfo.startTime) {
      const startTime = new Date(phaseInfo.startTime).getTime();
      const endTimeMs = new Date(endTime).getTime();
      phaseInfo.duration = endTimeMs - startTime;
    }

    logInfo(`Phase ${phase} completed`, {
      phase,
      description: phaseInfo.description,
      completedPrompts: phaseInfo.completedPrompts,
      totalPrompts: phaseInfo.totalPrompts,
      duration: phaseInfo.duration,
    });
  }

  // Record a validation result
  public recordValidation(
    phase: string,
    status: 'success' | 'failed' | 'in_progress',
    details: string,
    lessons?: string,
    patterns?: string,
    metadata?: Record<string, unknown>
  ): ValidationResult {
    const validationFunction = () => {
      if (!this.config.enableTracking) {
        return {
          phase,
          status: ValidationStatus.SKIPPED,
          details: 'Tracking disabled',
          timestamp: new Date().toISOString(),
        };
      }

      const validationStatus =
        status === 'success'
          ? ValidationStatus.SUCCESS
          : status === 'failed'
            ? ValidationStatus.FAILED
            : ValidationStatus.IN_PROGRESS;

      const result: ValidationResult = {
        phase,
        status: validationStatus,
        details,
        lessons,
        patterns,
        timestamp: new Date().toISOString(),
        metadata,
      };

      // Add to history
      this.validationHistory.push(result);
      this.cleanupHistory();

      // Update phase information
      const phaseInfo = this.phases.get(phase.split('.')[0]); // Get main phase number
      if (phaseInfo) {
        phaseInfo.validationResults.push(result);

        if (validationStatus === ValidationStatus.SUCCESS) {
          phaseInfo.completedPrompts += 1;
        }
      }

      // Log validation - map status to expected values
      const mappedStatus =
        status === 'failed' ? 'error' : status === 'in_progress' ? 'warning' : status;
      logValidation(phase, mappedStatus, details, lessons || '', patterns || '');

      return result;
    };

    // Track performance if enabled
    if (this.config.enablePerformanceTracking) {
      return trackPerformanceSync(`validation_${phase}`, validationFunction, {
        category: 'validation',
        phase,
        status,
      });
    } else {
      return validationFunction();
    }
  }

  // Get validation results for a specific phase
  public getPhaseValidations(phase: string): ValidationResult[] {
    return this.validationHistory.filter(v => v.phase.startsWith(phase));
  }

  // Get phase information
  public getPhaseInfo(phase: string): PhaseInfo | undefined {
    return this.phases.get(phase);
  }

  // Get overall project progress
  public getProjectProgress(): ProjectProgress {
    const phases = Array.from(this.phases.values());
    const completedPhases = phases.filter(p => p.status === ValidationStatus.SUCCESS).length;
    const currentPhase = phases.find(p => p.status === ValidationStatus.IN_PROGRESS)?.phase || '0';

    const totalValidations = this.validationHistory.length;
    const successfulValidations = this.validationHistory.filter(
      v => v.status === ValidationStatus.SUCCESS
    ).length;

    const successRate = totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;

    const overallStatus =
      completedPhases === phases.length
        ? ValidationStatus.SUCCESS
        : currentPhase !== '0'
          ? ValidationStatus.IN_PROGRESS
          : ValidationStatus.PENDING;

    return {
      totalPhases: phases.length,
      completedPhases,
      currentPhase,
      overallStatus,
      phases: Object.fromEntries(this.phases),
      startTime: this.projectStartTime,
      lastUpdate: new Date().toISOString(),
      successRate,
      totalValidations,
    };
  }

  // Generate comprehensive progress report
  public generateProgressReport(): void {
    const progress = this.getProjectProgress();
    const recentValidations = this.validationHistory.slice(-10);
    const failedValidations = this.validationHistory.filter(
      v => v.status === ValidationStatus.FAILED
    );

    logInfo('Project Progress Report', {
      category: 'progress_report',
      progress,
      recentValidations,
      failedValidations: failedValidations.slice(-5),
      timestamp: new Date().toISOString(),
    });
  }

  // Get validation statistics
  public getValidationStats(): {
    total: number;
    successful: number;
    failed: number;
    inProgress: number;
    successRate: number;
    avgDuration: number;
  } {
    const total = this.validationHistory.length;
    const successful = this.validationHistory.filter(
      v => v.status === ValidationStatus.SUCCESS
    ).length;
    const failed = this.validationHistory.filter(v => v.status === ValidationStatus.FAILED).length;
    const inProgress = this.validationHistory.filter(
      v => v.status === ValidationStatus.IN_PROGRESS
    ).length;

    const withDuration = this.validationHistory.filter(v => v.duration !== undefined);
    const avgDuration =
      withDuration.length > 0
        ? withDuration.reduce((sum, v) => sum + (v.duration || 0), 0) / withDuration.length
        : 0;

    return {
      total,
      successful,
      failed,
      inProgress,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDuration,
    };
  }

  // Clear validation history
  public clearHistory(): void {
    this.validationHistory = [];
    this.phases.forEach(phase => {
      phase.validationResults = [];
    });
  }

  // Update configuration
  public updateConfig(updates: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...updates };

    // Restart auto-reporting if interval changed
    if (updates.reportingInterval && this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.startAutoReporting();
    }
  }

  // Get current configuration
  public getConfig(): ValidationConfig {
    return { ...this.config };
  }

  // Cleanup resources
  public destroy(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    this.phases.clear();
    this.validationHistory = [];
  }
}

// Create singleton validation tracker
const validationTracker = new ValidationTracker();

// Export convenience functions
export const recordValidation = (
  phase: string,
  status: 'success' | 'failed' | 'in_progress',
  details: string,
  lessons?: string,
  patterns?: string,
  metadata?: Record<string, unknown>
): ValidationResult =>
  validationTracker.recordValidation(phase, status, details, lessons, patterns, metadata);

export const startPhase = (phase: string): void => validationTracker.startPhase(phase);

export const completePhase = (phase: string): void => validationTracker.completePhase(phase);

export const getProjectProgress = (): ProjectProgress => validationTracker.getProjectProgress();

export const getPhaseValidations = (phase: string): ValidationResult[] =>
  validationTracker.getPhaseValidations(phase);

export const getValidationStats = () => validationTracker.getValidationStats();

export const generateProgressReport = (): void => validationTracker.generateProgressReport();

// Export validation tracker for advanced usage
export { validationTracker };

// Export types
export type { ValidationConfig };
