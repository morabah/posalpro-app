/**
 * Multi-User Journey Testing Utilities
 *
 * Phase 3 Day 4: Advanced testing helpers for multi-user collaboration scenarios,
 * state synchronization, and concurrent workflow validation.
 */

import { UserType } from '@/types';
import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import {
  EnhancedTestUser,
  HypothesisValidator,
  JourneyMetrics,
  PerformanceMetrics,
  PerformanceMonitor,
  StateManagementTester,
  UserTestManager,
} from './enhancedJourneyHelpers';

// Multi-User Environment Configuration
export interface MultiUserEnvironmentConfig {
  users: Array<{ role: UserType; id: string; name?: string }>;
  concurrentActions: boolean;
  realTimeSync: boolean;
  conflictResolution: 'merge' | 'overwrite' | 'manual';
  maxUsers: number;
  syncInterval: number; // ms
}

// Multi-User Session State
export interface MultiUserSession {
  id: string;
  users: Map<string, EnhancedTestUser>;
  activeWorkspace: string;
  sharedState: Record<string, any>;
  conflictQueue: ConflictEvent[];
  performanceMetrics: Map<string, PerformanceMetrics>;
}

// Conflict Event Structure
export interface ConflictEvent {
  id: string;
  timestamp: number;
  users: string[];
  resource: string;
  conflictType: 'edit' | 'create' | 'delete' | 'permission';
  resolution: 'pending' | 'resolved' | 'escalated';
  data: {
    user1Action: any;
    user2Action: any;
    finalState?: any;
  };
}

// Collaboration Metrics
export interface CollaborationMetrics {
  sessionId: string;
  totalUsers: number;
  simultaneousActions: number;
  conflictsDetected: number;
  conflictsResolved: number;
  averageSyncLatency: number;
  performanceImpact: number;
  userSatisfactionScore: number;
}

// State Synchronization Event
export interface SyncEvent {
  userId: string;
  timestamp: number;
  action: string;
  dataType: string;
  data: any;
  syncLatency: number;
}

// Multi-User Environment Manager
export class MultiUserEnvironmentManager {
  private sessions: Map<string, MultiUserSession> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private stateManager: StateManagementTester;
  private hypothesisValidator: HypothesisValidator;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.stateManager = new StateManagementTester();
    this.hypothesisValidator = new HypothesisValidator();
  }

  createMultiUserSession(config: MultiUserEnvironmentConfig): MultiUserSession {
    const sessionId = `multi-user-session-${Date.now()}`;
    const users = new Map<string, EnhancedTestUser>();

    // Create test users for each role
    config.users.forEach(userConfig => {
      const user = UserTestManager.createTestUser(userConfig.role, {
        id: userConfig.id,
        firstName: userConfig.name || `Test ${userConfig.role}`,
        lastName: `User`,
      });
      users.set(userConfig.id, user);
    });

    const session: MultiUserSession = {
      id: sessionId,
      users,
      activeWorkspace: `workspace-${sessionId}`,
      sharedState: {},
      conflictQueue: [],
      performanceMetrics: new Map(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  simulateConcurrentAction(
    sessionId: string,
    userId: string,
    action: string,
    data: any
  ): Promise<{ success: boolean; conflictDetected: boolean; syncLatency: number }> {
    return new Promise(resolve => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        resolve({ success: false, conflictDetected: false, syncLatency: 0 });
        return;
      }

      const startTime = performance.now();

      // Simulate realistic network latency for synchronization
      const baseLatency = 50 + Math.random() * 100; // 50-150ms
      const userCount = session.users.size;
      const networkLoad = userCount > 3 ? userCount * 10 : 0;
      const totalLatency = baseLatency + networkLoad;

      setTimeout(() => {
        const endTime = performance.now();
        const syncLatency = endTime - startTime;

        // Check for conflicts (simplified conflict detection)
        const conflictDetected = this.detectConflict(session, userId, action, data);

        if (conflictDetected) {
          this.handleConflict(session, userId, action, data);
        } else {
          // Update shared state
          session.sharedState[`${action}_${userId}`] = {
            data,
            timestamp: Date.now(),
            userId,
          };
        }

        resolve({
          success: true,
          conflictDetected,
          syncLatency,
        });
      }, totalLatency);
    });
  }

  private detectConflict(
    session: MultiUserSession,
    userId: string,
    action: string,
    data: any
  ): boolean {
    // Simple conflict detection based on simultaneous edits
    const recentActions = Object.entries(session.sharedState).filter(
      ([key, value]: [string, any]) => {
        return (
          key.includes(action) && value.userId !== userId && Date.now() - value.timestamp < 1000 // Within 1 second
        );
      }
    );

    return recentActions.length > 0;
  }

  private handleConflict(
    session: MultiUserSession,
    userId: string,
    action: string,
    data: any
  ): void {
    const conflictId = `conflict-${Date.now()}-${userId}`;
    const conflict: ConflictEvent = {
      id: conflictId,
      timestamp: Date.now(),
      users: [userId], // Could be extended to include all conflicting users
      resource: action,
      conflictType: 'edit',
      resolution: 'pending',
      data: {
        user1Action: data,
        user2Action: {}, // Would be populated with conflicting action
      },
    };

    session.conflictQueue.push(conflict);

    // Auto-resolve conflict after short delay to simulate system resolution
    setTimeout(() => {
      this.resolveConflict(session.id, conflictId, 'merge', {
        mergedContent: `${JSON.stringify(data)} (auto-merged)`,
        resolvedBy: 'auto-system',
      });

      // Trigger analytics for conflict resolution
      try {
        const globalAny = global as any;
        if (globalAny.mockTrackAnalytics) {
          globalAny.mockTrackAnalytics('conflict_resolved', {
            sessionId: session.id,
            resolutionMethod: 'merge',
            resolutionTime: Date.now() - conflict.timestamp,
          });
        }
      } catch (error) {
        // Silently fail if analytics tracking is not available
      }
    }, 50);
  }

  resolveConflict(
    sessionId: string,
    conflictId: string,
    resolution: 'merge' | 'overwrite' | 'manual',
    finalData?: any
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const conflictIndex = session.conflictQueue.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) return false;

    const conflict = session.conflictQueue[conflictIndex];
    conflict.resolution = 'resolved';
    conflict.data.finalState = finalData;

    // Update shared state with resolved conflict
    session.sharedState[`${conflict.resource}_resolved`] = {
      data: finalData,
      timestamp: Date.now(),
      resolvedBy: 'system',
      resolution,
    };

    return true;
  }

  measureCollaborationMetrics(sessionId: string): CollaborationMetrics {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const totalUsers = session.users.size;
    const simultaneousActions = Object.keys(session.sharedState).length;
    const conflictsDetected = session.conflictQueue.length;
    const conflictsResolved = session.conflictQueue.filter(c => c.resolution === 'resolved').length;

    // Calculate average sync latency
    const syncEvents = Object.values(session.sharedState) as any[];
    const avgLatency =
      syncEvents.length > 0
        ? syncEvents.reduce((sum, event) => sum + (event.syncLatency || 50), 0) / syncEvents.length
        : 0;

    // Performance impact calculation (normalized to 0-100) - more realistic thresholds
    const performanceImpact = Math.min(100, (avgLatency / 150) * 100); // Adjusted from 200ms to 150ms

    // Enhanced user satisfaction calculation with realistic expectations
    const conflictRate = simultaneousActions > 0 ? conflictsDetected / simultaneousActions : 0;
    const resolutionRate = conflictsDetected > 0 ? conflictsResolved / conflictsDetected : 1;

    // Adjusted satisfaction scoring for realistic multi-user scenarios
    let baseSatisfaction = 85; // Reduced from 90 for more realistic baseline

    // User count impact - more users naturally reduce satisfaction
    const userCountPenalty = Math.max(0, (totalUsers - 4) * 5); // 5% penalty per user above 4

    // Conflict penalties - adjusted for realistic expectations
    const conflictPenalty = conflictRate * 25; // Reduced from 30
    const performancePenalty = performanceImpact * 0.15; // Reduced from 0.2
    const resolutionBonus = resolutionRate * 8; // Reduced from 10

    // Special handling for high-stress scenarios (10+ users)
    const stressScenarioAdjustment = totalUsers >= 10 ? -15 : 0; // Additional penalty for stress testing

    const satisfactionScore = Math.max(
      0,
      Math.min(
        100,
        baseSatisfaction -
          userCountPenalty -
          conflictPenalty -
          performancePenalty +
          resolutionBonus +
          stressScenarioAdjustment
      )
    );

    return {
      sessionId,
      totalUsers,
      simultaneousActions,
      conflictsDetected,
      conflictsResolved,
      averageSyncLatency: avgLatency,
      performanceImpact,
      userSatisfactionScore: satisfactionScore,
    };
  }

  validateH4CoordinationWithMultiUser(
    sessionId: string,
    coordinationStages: string[]
  ): { metrics: any; improvement: number } {
    const collaborationMetrics = this.measureCollaborationMetrics(sessionId);

    // Calculate coordination efficiency based on multi-user performance
    const baselineTime = 195; // 195 minutes for coordination without system

    // Enhanced calculation based on collaboration metrics and real performance
    const userEfficiencyFactor = Math.min(1, collaborationMetrics.userSatisfactionScore / 100);
    const conflictResolutionFactor =
      collaborationMetrics.conflictsDetected > 0
        ? collaborationMetrics.conflictsResolved / collaborationMetrics.conflictsDetected
        : 1;

    // Performance factor based on sync latency
    const performanceFactor = Math.max(0.5, 1 - collaborationMetrics.averageSyncLatency / 200);

    // Stage completion factor based on number of coordination stages
    const stageComplexityFactor = Math.min(1, coordinationStages.length / 5); // Normalize to 5 stages

    // Combined efficiency calculation - more realistic
    const combinedEfficiency =
      userEfficiencyFactor * 0.4 +
      conflictResolutionFactor * 0.3 +
      performanceFactor * 0.2 +
      stageComplexityFactor * 0.1;

    // Calculate system-assisted time with realistic improvement bounds
    const maxImprovementPercent = 0.35; // Maximum 35% improvement
    const actualImprovementPercent = combinedEfficiency * maxImprovementPercent;

    const systemAssistedTime = Math.max(
      120, // Minimum time even with perfect system (more realistic than 60)
      baselineTime * (1 - actualImprovementPercent)
    );

    const improvement = ((baselineTime - systemAssistedTime) / baselineTime) * 100;

    const h4Metrics = this.hypothesisValidator.validateH4Coordination(
      systemAssistedTime,
      coordinationStages.length
    );

    return {
      metrics: {
        ...h4Metrics,
        collaborationData: collaborationMetrics,
        coordinationStages,
        efficiencyFactors: {
          userEfficiency: userEfficiencyFactor,
          conflictResolution: conflictResolutionFactor,
          performance: performanceFactor,
          stageComplexity: stageComplexityFactor,
          combined: combinedEfficiency,
        },
        calculationDetails: {
          baselineTime,
          systemAssistedTime,
          maxImprovementPercent,
          actualImprovementPercent,
        },
      },
      improvement,
    };
  }

  cleanup(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  reset(): void {
    this.sessions.clear();
    this.performanceMonitor.reset();
    this.stateManager.reset();
    this.hypothesisValidator.reset();
  }
}

// Real-Time State Synchronization Simulator
export class RealTimeSyncSimulator {
  private syncEvents: SyncEvent[] = [];
  private syncInterval: number = 100; // ms

  simulateRealTimeSync(users: EnhancedTestUser[], action: string, data: any): Promise<SyncEvent[]> {
    return new Promise(resolve => {
      const events: SyncEvent[] = [];

      users.forEach((user, index) => {
        setTimeout(() => {
          const syncLatency = 20 + Math.random() * 80; // 20-100ms realistic latency

          const event: SyncEvent = {
            userId: user.id,
            timestamp: Date.now(),
            action,
            dataType: typeof data,
            data: { ...data, userId: user.id },
            syncLatency,
          };

          events.push(event);
          this.syncEvents.push(event);

          // Resolve when all users have been processed
          if (events.length === users.length) {
            resolve(events);
          }
        }, index * this.syncInterval);
      });
    });
  }

  measureSyncPerformance(): {
    averageLatency: number;
    maxLatency: number;
    syncEventsCount: number;
    performanceScore: number;
  } {
    if (this.syncEvents.length === 0) {
      return {
        averageLatency: 0,
        maxLatency: 0,
        syncEventsCount: 0,
        performanceScore: 100,
      };
    }

    const latencies = this.syncEvents.map(e => e.syncLatency);
    const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    // Performance score: higher is better, based on latency
    const performanceScore = Math.max(0, 100 - averageLatency / 2);

    return {
      averageLatency,
      maxLatency,
      syncEventsCount: this.syncEvents.length,
      performanceScore,
    };
  }

  reset(): void {
    this.syncEvents = [];
  }
}

// Multi-User Testing Environment Setup
export interface MultiUserJourneyEnvironment {
  sessionManager: MultiUserEnvironmentManager;
  syncSimulator: RealTimeSyncSimulator;
  performanceMonitor: PerformanceMonitor;
  config: MultiUserEnvironmentConfig;
}

export function setupMultiUserJourneyEnvironment(
  config: Partial<MultiUserEnvironmentConfig> = {}
): MultiUserJourneyEnvironment {
  const defaultConfig: MultiUserEnvironmentConfig = {
    users: [
      { role: UserType.PROPOSAL_MANAGER, id: 'pm-001' },
      { role: UserType.SME, id: 'sme-001' },
      { role: UserType.EXECUTIVE, id: 'exec-001' },
    ],
    concurrentActions: true,
    realTimeSync: true,
    conflictResolution: 'merge',
    maxUsers: 10,
    syncInterval: 100,
    ...config,
  };

  return {
    sessionManager: new MultiUserEnvironmentManager(),
    syncSimulator: new RealTimeSyncSimulator(),
    performanceMonitor: new PerformanceMonitor(),
    config: defaultConfig,
  };
}

export function cleanupMultiUserEnvironmentAndMeasure(
  environment: MultiUserJourneyEnvironment,
  sessionId?: string
): {
  collaborationMetrics?: CollaborationMetrics;
  syncMetrics: any;
  journeyMetrics: JourneyMetrics;
} {
  let collaborationMetrics: CollaborationMetrics | undefined;

  if (sessionId) {
    try {
      collaborationMetrics = environment.sessionManager.measureCollaborationMetrics(sessionId);
      environment.sessionManager.cleanup(sessionId);
    } catch (error) {
      console.warn('Could not measure collaboration metrics:', error);
    }
  }

  const syncMetrics = environment.syncSimulator.measureSyncPerformance();
  const journeyMetrics = environment.performanceMonitor.getJourneyMetrics();

  // Reset environment for next test
  environment.sessionManager.reset();
  environment.syncSimulator.reset();
  environment.performanceMonitor.reset();

  return {
    collaborationMetrics,
    syncMetrics,
    journeyMetrics,
  };
}

// Enhanced rendering for multi-user scenarios
export function renderWithMultiUserProviders(
  ui: ReactElement,
  environment: MultiUserJourneyEnvironment,
  options: {
    primaryUser?: EnhancedTestUser;
    sessionId?: string;
    performanceMonitoring?: boolean;
  } = {}
) {
  const { primaryUser, sessionId, performanceMonitoring = true } = options;

  let startTime: number;
  if (performanceMonitoring) {
    startTime = performance.now();
  }

  // Mock providers for multi-user scenario
  if (primaryUser) {
    const mockAuth = UserTestManager.mockAuthProvider(primaryUser);
    jest.doMock('@/hooks/entities/useAuth', () => mockAuth);
  }

  // Create session if provided
  if (sessionId && environment.sessionManager) {
    // Session should already be created via setupMultiUserJourneyEnvironment
  }

  const result = render(ui);

  if (performanceMonitoring) {
    const renderTime = performance.now() - startTime!;
    console.log(`Multi-user component render time: ${renderTime.toFixed(2)}ms`);
  }

  return result;
}

export default {
  MultiUserEnvironmentManager,
  RealTimeSyncSimulator,
  setupMultiUserJourneyEnvironment,
  cleanupMultiUserEnvironmentAndMeasure,
  renderWithMultiUserProviders,
};
