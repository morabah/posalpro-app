/**
 * 🚀 Phase 2: Component Lazy Loading Optimization Service
 *
 * Provides intelligent lazy loading for wizard steps and components
 * to improve performance and reduce initial bundle size.
 *
 * Component Traceability Matrix:
 * - User Stories: US-6.2, US-6.3, US-6.4
 * - Acceptance Criteria: AC-6.2.1, AC-6.3.1, AC-6.4.1
 * - Methods: preloadNextStep(), loadComponentDynamically(), cleanupUnusedComponents()
 * - Hypotheses: H9, H10, H12
 * - Test Cases: TC-H9-002, TC-H10-001, TC-H12-001
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ComponentType, lazy, LazyExoticComponent } from 'react';

export interface LazyLoadConfig {
  preloadDelay: number; // ms delay before preloading next components
  maxConcurrentLoads: number; // maximum simultaneous component loads
  enablePreloading: boolean; // whether to preload upcoming components
  enableCleanup: boolean; // whether to cleanup unused components
  memoryThreshold: number; // memory usage % threshold for cleanup
}

export interface ComponentLoadMetrics {
  componentName: string;
  loadTime: number;
  bundleSize: number;
  loadStartTime: number;
  loadEndTime: number;
  preloaded: boolean;
  success: boolean;
  error?: string;
}

export interface LazyLoadingMetrics {
  totalComponentsLoaded: number;
  averageLoadTime: number;
  preloadHitRate: number; // % of preloaded components that were actually used
  memorySavedKB: number;
  loadingErrors: number;
  cleanupOperations: number;
}

export class ComponentLazyLoading {
  private static instance: ComponentLazyLoading | null = null;
  private errorHandlingService: ErrorHandlingService;
  private loadedComponents: Map<string, LazyExoticComponent<ComponentType<any>>> = new Map();
  private preloadedComponents: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<LazyExoticComponent<ComponentType<any>>>> =
    new Map();
  private loadMetrics: ComponentLoadMetrics[] = [];
  private config: LazyLoadConfig;
  private activeLoads = 0;

  private constructor(config: Partial<LazyLoadConfig> = {}) {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.config = {
      preloadDelay: 2000, // 2 seconds
      maxConcurrentLoads: 3,
      enablePreloading: true,
      enableCleanup: true,
      memoryThreshold: 75, // 75% memory usage
      ...config,
    };
  }

  public static getInstance(config?: Partial<LazyLoadConfig>): ComponentLazyLoading {
    if (ComponentLazyLoading.instance === null) {
      ComponentLazyLoading.instance = new ComponentLazyLoading(config);
    }
    return ComponentLazyLoading.instance;
  }

  /**
   * 🔥 Core Method: Load component dynamically with performance tracking
   */
  public async loadComponentDynamically<T = any>(
    componentName: string,
    importFunction: () => Promise<{ default: ComponentType<T> }>
  ): Promise<LazyExoticComponent<ComponentType<T>>> {
    const loadStartTime = performance.now();

    try {
      // Check if component is already loaded
      if (this.loadedComponents.has(componentName)) {
        const component = this.loadedComponents.get(componentName) as LazyExoticComponent<
          ComponentType<T>
        >;
        this.recordLoadMetrics(componentName, loadStartTime, 0, true, true);
        return component;
      }

      // Check if component is currently loading
      if (this.loadingPromises.has(componentName)) {
        return this.loadingPromises.get(componentName) as Promise<
          LazyExoticComponent<ComponentType<T>>
        >;
      }

      // Enforce concurrent load limit
      if (this.activeLoads >= this.config.maxConcurrentLoads) {
        throw new Error(`Maximum concurrent loads (${this.config.maxConcurrentLoads}) exceeded`);
      }

      this.activeLoads++;

      // Create lazy component with error boundary
      const lazyComponent = lazy(async () => {
        try {
          const importedModule = await importFunction();
          const loadEndTime = performance.now();
          const loadTime = loadEndTime - loadStartTime;

          this.recordLoadMetrics(componentName, loadStartTime, loadTime, true, false);

          return importedModule;
        } catch (error) {
          const loadEndTime = performance.now();
          const loadTime = loadEndTime - loadStartTime;

          this.recordLoadMetrics(
            componentName,
            loadStartTime,
            loadTime,
            false,
            false,
            this.errorHandlingService.getUserFriendlyMessage(error)
          );

          this.errorHandlingService.processError(
            error,
            `Failed to load component: ${componentName}`,
            ErrorCodes.SYSTEM.COMPONENT_LOAD_FAILED,
            {
              component: 'ComponentLazyLoading',
              operation: 'loadComponentDynamically',
              componentName,
              loadTime: loadTime,
              userStories: ['US-6.2', 'US-6.3'],
              hypotheses: ['H9', 'H10'],
              timestamp: Date.now(),
            }
          );

          throw error;
        } finally {
          this.activeLoads--;
          this.loadingPromises.delete(componentName);
        }
      });

      // Store loading promise
      const loadingPromise = Promise.resolve(lazyComponent);
      this.loadingPromises.set(componentName, loadingPromise);

      // Store loaded component
      this.loadedComponents.set(componentName, lazyComponent);

      return lazyComponent;
    } catch (error) {
      this.activeLoads = Math.max(0, this.activeLoads - 1);
      this.loadingPromises.delete(componentName);

      this.errorHandlingService.processError(
        error,
        `Component lazy loading failed: ${componentName}`,
        ErrorCodes.SYSTEM.COMPONENT_LOAD_FAILED,
        {
          component: 'ComponentLazyLoading',
          operation: 'loadComponentDynamically',
          componentName,
          activeLoads: this.activeLoads,
          userStories: ['US-6.2', 'US-6.3'],
          hypotheses: ['H9', 'H10'],
          timestamp: Date.now(),
        }
      );

      throw error;
    }
  }

  /**
   * 🚀 Preload next step components for wizard optimization
   */
  public async preloadNextStep(
    currentStep: number,
    totalSteps: number,
    getStepComponent: (step: number) => () => Promise<{ default: ComponentType<any> }>
  ): Promise<void> {
    if (!this.config.enablePreloading || currentStep >= totalSteps) {
      return;
    }

    try {
      const nextStep = currentStep + 1;
      const componentName = `WizardStep${nextStep}`;

      // Don't preload if already loaded or preloaded
      if (this.loadedComponents.has(componentName) || this.preloadedComponents.has(componentName)) {
        return;
      }

      // Add delay to prevent interfering with current step rendering
      setTimeout(async () => {
        try {
          await this.loadComponentDynamically(componentName, getStepComponent(nextStep));
          this.preloadedComponents.add(componentName);

          console.log(`[ComponentLazyLoading] Preloaded step ${nextStep} component`);
        } catch (error) {
          // Preload failures shouldn't break the app
          console.warn(`[ComponentLazyLoading] Preload failed for step ${nextStep}:`, error);
        }
      }, this.config.preloadDelay);
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        `Failed to preload next step: ${currentStep + 1}`,
        ErrorCodes.SYSTEM.PRELOAD_FAILED,
        {
          component: 'ComponentLazyLoading',
          operation: 'preloadNextStep',
          currentStep,
          totalSteps,
          userStories: ['US-6.3', 'US-6.4'],
          hypotheses: ['H10', 'H12'],
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * 🧹 Cleanup unused components to free memory
   */
  public cleanupUnusedComponents(activeComponents: string[]): void {
    if (!this.config.enableCleanup) {
      return;
    }

    try {
      const cleanupStartTime = performance.now();
      let cleanupCount = 0;

      // Remove components not in active list
      for (const [componentName] of this.loadedComponents) {
        if (!activeComponents.includes(componentName)) {
          this.loadedComponents.delete(componentName);
          this.preloadedComponents.delete(componentName);
          cleanupCount++;
        }
      }

      const cleanupTime = performance.now() - cleanupStartTime;

      if (cleanupCount > 0) {
        console.log(
          `[ComponentLazyLoading] Cleaned up ${cleanupCount} unused components in ${cleanupTime.toFixed(2)}ms`
        );
      }
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to cleanup unused components',
        ErrorCodes.SYSTEM.CLEANUP_FAILED,
        {
          component: 'ComponentLazyLoading',
          operation: 'cleanupUnusedComponents',
          activeComponents,
          loadedComponentsCount: this.loadedComponents.size,
          userStories: ['US-6.4'],
          hypotheses: ['H12'],
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * 📊 Get comprehensive lazy loading metrics
   */
  public getMetrics(): LazyLoadingMetrics {
    const successfulLoads = this.loadMetrics.filter(m => m.success);
    const preloadedUsed = this.loadMetrics.filter(m => m.preloaded && m.success);

    return {
      totalComponentsLoaded: this.loadMetrics.length,
      averageLoadTime:
        successfulLoads.length > 0
          ? successfulLoads.reduce((sum, m) => sum + m.loadTime, 0) / successfulLoads.length
          : 0,
      preloadHitRate:
        this.preloadedComponents.size > 0
          ? (preloadedUsed.length / this.preloadedComponents.size) * 100
          : 0,
      memorySavedKB: this.estimateMemorySavings(),
      loadingErrors: this.loadMetrics.filter(m => !m.success).length,
      cleanupOperations: this.loadMetrics.filter(m => m.componentName.includes('cleanup')).length,
    };
  }

  /**
   * 🔧 Private: Record load metrics for analytics
   */
  private recordLoadMetrics(
    componentName: string,
    loadStartTime: number,
    loadTime: number,
    success: boolean,
    fromCache: boolean,
    error?: string
  ): void {
    const metric: ComponentLoadMetrics = {
      componentName,
      loadTime,
      bundleSize: this.estimateBundleSize(componentName),
      loadStartTime,
      loadEndTime: loadStartTime + loadTime,
      preloaded: this.preloadedComponents.has(componentName),
      success,
      error,
    };

    this.loadMetrics.push(metric);

    // Keep only last 100 metrics to prevent memory bloat
    if (this.loadMetrics.length > 100) {
      this.loadMetrics = this.loadMetrics.slice(-100);
    }
  }

  /**
   * 🔧 Private: Estimate bundle size (simplified calculation)
   */
  private estimateBundleSize(componentName: string): number {
    // Simplified estimation - in real implementation, this would use webpack stats
    const baseSizes: Record<string, number> = {
      WizardStep1: 15000, // 15KB
      WizardStep2: 18000, // 18KB
      WizardStep3: 22000, // 22KB
      WizardStep4: 20000, // 20KB
      WizardStep5: 25000, // 25KB
      WizardStep6: 30000, // 30KB
    };

    return baseSizes[componentName] || 15000; // Default 15KB
  }

  /**
   * 🔧 Private: Estimate memory savings from lazy loading
   */
  private estimateMemorySavings(): number {
    const totalPossibleSize = 150000; // 150KB if all components loaded at once
    const actualLoadedSize = Array.from(this.loadedComponents.keys()).reduce(
      (sum, name) => sum + this.estimateBundleSize(name),
      0
    );

    return Math.max(0, (totalPossibleSize - actualLoadedSize) / 1024); // Return in KB
  }

  /**
   * 🧪 Reset for testing
   */
  public reset(): void {
    this.loadedComponents.clear();
    this.preloadedComponents.clear();
    this.loadingPromises.clear();
    this.loadMetrics = [];
    this.activeLoads = 0;
  }
}
