import { logger } from '@/utils/logger';
/**
 * PosalPro MVP2 - Real-time Dashboard Infrastructure
 * WebSocket-based real-time data synchronization and event management
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

import { UserType } from '@/types';
import type { ActivityFeedItem, DashboardData, Deadline, Notification, TeamMember } from './types';

// Component Traceability Matrix
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.4'],
  acceptanceCriteria: [
    'AC-4.1.2', // Real-time deadline updates
    'AC-4.3.2', // Live collaboration indicators
    'AC-2.4.1', // Real-time notifications
  ],
  methods: [
    'establishWebSocketConnection()',
    'handleRealTimeEvents()',
    'synchronizeDataUpdates()',
    'manageConnectionResilience()',
    'trackRealTimeMetrics()',
  ],
  hypotheses: ['H4', 'H8', 'H9'],
  testCases: ['TC-H4-002', 'TC-H8-001', 'TC-REALTIME-001'],
};

// Real-time event types
export enum RealtimeEventType {
  // Dashboard data updates
  DASHBOARD_UPDATE = 'dashboard_update',
  PROPOSAL_UPDATE = 'proposal_update',
  ACTIVITY_UPDATE = 'activity_update',
  DEADLINE_UPDATE = 'deadline_update',
  TEAM_UPDATE = 'team_update',
  NOTIFICATION_UPDATE = 'notification_update',

  // User interactions
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  USER_TYPING = 'user_typing',
  USER_VIEWING = 'user_viewing',

  // System events
  CONNECTION_STATUS = 'connection_status',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat',

  // Collaboration events
  COLLABORATIVE_EDIT = 'collaborative_edit',
  CURSOR_POSITION = 'cursor_position',
  SELECTION_CHANGE = 'selection_change',
}

// Real-time event data structures
export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  data: T;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectionConfig {
  url: string;
  protocols?: string[];
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  timeout?: number;
  auth?: {
    token?: string;
    userId?: string;
    userRole?: UserType;
  };
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  reconnectAttempts: number;
  lastConnected: Date | null;
  latency: number;
  error: string | null;
}

export interface RealtimeMetrics {
  connectionUptime: number;
  messagesReceived: number;
  messagesSent: number;
  averageLatency: number;
  reconnectionCount: number;
  errorCount: number;
  lastHeartbeat: Date | null;
}

// Event subscription interface
export interface EventSubscription {
  id: string;
  eventType: RealtimeEventType;
  callback: (event: RealtimeEvent) => void;
  filter?: (event: RealtimeEvent) => boolean;
  once?: boolean;
}

/**
 * Real-time WebSocket Manager
 */
export class RealtimeManager {
  private static instance: RealtimeManager | null;
  private socket: WebSocket | null = null;
  private config: ConnectionConfig;
  private state: ConnectionState;
  private metrics: RealtimeMetrics;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private messageQueue: RealtimeEvent[] = [];
  private isDestroyed = false;

  constructor(config: ConnectionConfig) {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      timeout: 10000,
      ...config,
    };

    this.state = {
      status: 'disconnected',
      reconnectAttempts: 0,
      lastConnected: null,
      latency: 0,
      error: null,
    };

    this.metrics = {
      connectionUptime: 0,
      messagesReceived: 0,
      messagesSent: 0,
      averageLatency: 0,
      reconnectionCount: 0,
      errorCount: 0,
      lastHeartbeat: null,
    };
  }

  public static getInstance(config?: ConnectionConfig): RealtimeManager {
    if (!RealtimeManager.instance) {
      if (!config) {
        throw new Error('RealtimeManager not initialized. Provide config on first call.');
      }
      RealtimeManager.instance = new RealtimeManager(config);
    }
    return RealtimeManager.instance;
  }

  /**
   * Establish WebSocket connection
   */
  async connect(): Promise<boolean> {
    if (this.isDestroyed) {
      logger.warn('RealtimeManager has been destroyed');
      return false;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      logger.info('WebSocket already connected');
      return true;
    }

    try {
      this.updateState({ status: 'connecting', error: null });

      logger.info('Establishing WebSocket connection:', this.config.url);

      const connectPromise = new Promise<boolean>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.timeout);

        this.socket = new WebSocket(this.config.url, this.config.protocols);

        this.socket.onopen = () => {
          clearTimeout(timeoutId);
          this.handleConnectionOpen();
          resolve(true);
        };

        this.socket.onclose = event => {
          clearTimeout(timeoutId);
          this.handleConnectionClose(event);
          if (this.state.status === 'connecting') {
            reject(new Error(`Connection failed: ${event.reason || 'Unknown reason'}`));
          }
        };

        this.socket.onerror = event => {
          clearTimeout(timeoutId);
          this.handleConnectionError(event);
          reject(new Error('WebSocket connection error'));
        };

        this.socket.onmessage = event => {
          this.handleMessage(event);
        };
      });

      return await connectPromise;
    } catch (error) {
      this.handleConnectionError(error);
      return false;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }

    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
    }

    this.updateState({ status: 'disconnected' });
    this.messageQueue = [];
  }

  /**
   * Destroy the manager instance
   */
  destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    this.subscriptions.clear();
    RealtimeManager.instance = null;
  }

  /**
   * Send real-time event
   */
  send<T>(eventType: RealtimeEventType, data: T, metadata?: Record<string, unknown>): boolean {
    const event: RealtimeEvent<T> = {
      type: eventType,
      data,
      timestamp: Date.now(),
      userId: this.config.auth?.userId,
      sessionId: this.generateSessionId(),
      metadata,
    };

    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify(event);
        this.socket.send(message);
        this.metrics.messagesSent++;
        logger.info('Sent real-time event: ' + eventType, data);
        return true;
      } catch (error) {
        logger.error('Failed to send real-time event:', error);
        this.queueMessage(event);
        return false;
      }
    } else {
      // Queue message for when connection is restored
      this.queueMessage(event);
      return false;
    }
  }

  /**
   * Subscribe to real-time events
   */
  subscribe<T = unknown>(
    eventType: RealtimeEventType,
    callback: (event: RealtimeEvent<T>) => void,
    options?: {
      filter?: (event: RealtimeEvent<T>) => boolean;
      once?: boolean;
    }
  ): string {
    const subscription: EventSubscription = {
      id: this.generateSubscriptionId(),
      eventType,
      callback: callback as unknown as (event: RealtimeEvent) => void,
      filter: options?.filter ? ((options.filter as unknown) as (event: RealtimeEvent) => boolean) : undefined,
      once: options?.once,
    };

    this.subscriptions.set(subscription.id, subscription);
    logger.info(`Subscribed to ${eventType} events:`, subscription.id);

    return subscription.id;
  }

  /**
   * Unsubscribe from real-time events
   */
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      logger.info('Unsubscribed from events:', subscriptionId);
    }
    return removed;
  }

  /**
   * Get connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Get connection metrics
   */
  getMetrics(): RealtimeMetrics {
    return { ...this.metrics };
  }

  /**
   * Handle connection open
   */
  private handleConnectionOpen(): void {
    logger.info('WebSocket connection established');

    this.updateState({
      status: 'connected',
      reconnectAttempts: 0,
      lastConnected: new Date(),
      error: null,
    });

    // Start heartbeat
    this.startHeartbeat();

    // Send authentication if configured
    if (this.config.auth) {
      this.send(RealtimeEventType.CONNECTION_STATUS, {
        action: 'authenticate',
        auth: this.config.auth,
      });
    }

    // Send queued messages
    this.flushMessageQueue();

    // Emit connection event
    this.emit(RealtimeEventType.CONNECTION_STATUS, {
      status: 'connected',
      timestamp: Date.now(),
    });
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(event: CloseEvent): void {
    logger.info('WebSocket connection closed: ' + event.code + ' - ' + event.reason);

    this.stopHeartbeat();
    this.updateState({ status: 'disconnected' });

    // Emit disconnection event
    this.emit(RealtimeEventType.CONNECTION_STATUS, {
      status: 'disconnected',
      code: event.code,
      reason: event.reason,
      timestamp: Date.now(),
    });

    // Auto-reconnect if enabled and not a normal closure
    if (this.config.autoReconnect && event.code !== 1000 && !this.isDestroyed) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.state.error = errorMessage;
    this.metrics.errorCount++;
    logger.error('WebSocket connection error:', error);
    this.scheduleReconnect();
    this.emit(RealtimeEventType.ERROR, {
      error: errorMessage,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      if (typeof event.data !== 'string') {
        logger.error('Unexpected non-string WebSocket message data');
        this.metrics.errorCount++;
        return;
      }
      const parsed: unknown = JSON.parse(event.data);
      const realtimeEvent = parsed as RealtimeEvent<Record<string, unknown>>;
      this.metrics.messagesReceived++;

      // Update latency if this is a heartbeat response
      if (realtimeEvent.type === RealtimeEventType.HEARTBEAT) {
        const sentAtVal = realtimeEvent.metadata?.sentAt;
        if (typeof sentAtVal === 'number') {
          const latency = Date.now() - sentAtVal;
          this.updateLatency(latency);
        }
      }

      const dataPreview = (() => {
        try { return JSON.stringify(realtimeEvent.data); } catch { return '[unserializable]'; }
      })();
      logger.info(`Received real-time event: ${realtimeEvent.type} ${dataPreview}`);

      // Emit to subscribers
      this.emit(realtimeEvent.type, realtimeEvent.data, realtimeEvent);
    } catch (error) {
      logger.error('Failed to parse real-time message:', error);
      this.metrics.errorCount++;
    }
  }

  /**
   * Emit event to subscribers
   */
  private emit<T>(eventType: RealtimeEventType, data: T, originalEvent?: RealtimeEvent<T>): void {
    const event: RealtimeEvent<T> = originalEvent ?? {
      type: eventType,
      data,
      timestamp: Date.now(),
    };

    const subscriptionsToRemove: string[] = [];

    for (const [id, subscription] of this.subscriptions) {
      if (subscription.eventType === eventType) {
        // Apply filter if present
        if (subscription.filter && !subscription.filter(event)) {
          continue;
        }

        try {
          subscription.callback(event);
        } catch (error) {
          logger.error('Error in event subscription callback:', error);
        }

        // Remove one-time subscriptions
        if (subscription.once) {
          subscriptionsToRemove.push(id);
        }
      }
    }

    // Clean up one-time subscriptions
    subscriptionsToRemove.forEach(id => this.subscriptions.delete(id));
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (
      this.state.reconnectAttempts >= (this.config.maxReconnectAttempts || 10) ||
      this.isDestroyed
    ) {
      logger.info('Max reconnection attempts reached');
      this.updateState({ status: 'error', error: 'Max reconnection attempts reached' });
      return;
    }

    this.updateState({
      status: 'reconnecting',
      reconnectAttempts: this.state.reconnectAttempts + 1,
    });

    const delay = this.config.reconnectInterval! * Math.pow(1.5, this.state.reconnectAttempts);
    logger.info(`Scheduling reconnection attempt ${this.state.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeoutId = setTimeout(async () => {
      this.metrics.reconnectionCount++;
      const connected = await this.connect();
      if (!connected && !this.isDestroyed) {
        this.scheduleReconnect();
      }
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    if (!this.config.heartbeatInterval) return;

    this.heartbeatIntervalId = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send(
          RealtimeEventType.HEARTBEAT,
          {
            timestamp: Date.now(),
          },
          { sentAt: Date.now() }
        );
        this.metrics.lastHeartbeat = new Date();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(event: RealtimeEvent): void {
    this.messageQueue.push(event);

    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  /**
   * Send all queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const event = this.messageQueue.shift()!;
      try {
        this.socket.send(JSON.stringify(event));
        this.metrics.messagesSent++;
      } catch (error) {
        logger.error('Failed to send queued message:', error);
        // Re-queue if send fails
        this.messageQueue.unshift(event);
        break;
      }
    }
  }

  /**
   * Update connection state
   */
  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Update latency metrics
   */
  private updateLatency(latency: number): void {
    this.state.latency = latency;
    this.metrics.averageLatency = this.metrics.averageLatency * 0.9 + latency * 0.1; // Exponential moving average
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Dashboard Real-time Synchronizer
 */
export class DashboardRealtimeSync {
  private realtimeManager: RealtimeManager;
  private subscriptionIds: string[] = [];
  private updateCallbacks: Map<string, (data: unknown) => void> = new Map();

  constructor(realtimeManager: RealtimeManager) {
    this.realtimeManager = realtimeManager;
    this.setupEventSubscriptions();
  }

  /**
   * Setup real-time event subscriptions for dashboard data
   */
  private setupEventSubscriptions(): void {
    // Dashboard data updates
    this.subscriptionIds.push(
      this.realtimeManager.subscribe<Partial<DashboardData>>(RealtimeEventType.DASHBOARD_UPDATE, event =>
        this.handleDashboardUpdate(event.data)
      )
    );

    // Proposal updates
    this.subscriptionIds.push(
      this.realtimeManager.subscribe<unknown>(RealtimeEventType.PROPOSAL_UPDATE, event =>
        this.handleProposalUpdate(event.data)
      )
    );

    // Activity feed updates
    this.subscriptionIds.push(
      this.realtimeManager.subscribe<ActivityFeedItem[]>(RealtimeEventType.ACTIVITY_UPDATE, event =>
        this.handleActivityUpdate(event.data)
      )
    );

    // Deadline updates
    this.subscriptionIds.push(
      this.realtimeManager.subscribe<Deadline[]>(RealtimeEventType.DEADLINE_UPDATE, event =>
        this.handleDeadlineUpdate(event.data)
      )
    );

    // Team status updates
    this.subscriptionIds.push(
      this.realtimeManager.subscribe<TeamMember[]>(RealtimeEventType.TEAM_UPDATE, event =>
        this.handleTeamUpdate(event.data)
      )
    );

    // Notification updates
    this.subscriptionIds.push(
      this.realtimeManager.subscribe<Notification[]>(RealtimeEventType.NOTIFICATION_UPDATE, event =>
        this.handleNotificationUpdate(event.data)
      )
    );
  }

  /**
   * Register callback for specific data updates
   */
  onDataUpdate(section: string, callback: (data: unknown) => void): void {
    this.updateCallbacks.set(section, callback);
  }

  /**
   * Unregister callback
   */
  offDataUpdate(section: string): void {
    this.updateCallbacks.delete(section);
  }

  /**
   * Handle dashboard data updates
   */
  private handleDashboardUpdate(data: Partial<DashboardData>): void {
    logger.info('Real-time dashboard update received:', data);
    const callback = this.updateCallbacks.get('dashboard');
    callback?.(data);
  }

  /**
   * Handle proposal updates
   */
  private handleProposalUpdate(data: unknown): void {
    logger.info('Real-time proposal update received:', data);
    const callback = this.updateCallbacks.get('proposals');
    callback?.(data);
  }

  /**
   * Handle activity feed updates
   */
  private handleActivityUpdate(data: ActivityFeedItem[]): void {
    logger.info('Real-time activity update received:', data);
    const callback = this.updateCallbacks.get('activities');
    callback?.(data);
  }

  /**
   * Handle deadline updates
   */
  private handleDeadlineUpdate(data: Deadline[]): void {
    logger.info('Real-time deadline update received:', data);
    const callback = this.updateCallbacks.get('deadlines');
    callback?.(data);
  }

  /**
   * Handle team status updates
   */
  private handleTeamUpdate(data: TeamMember[]): void {
    logger.info('Real-time team update received:', data);
    const callback = this.updateCallbacks.get('team');
    callback?.(data);
  }

  /**
   * Handle notification updates
   */
  private handleNotificationUpdate(data: Notification[]): void {
    logger.info('Real-time notification update received:', data);
    const callback = this.updateCallbacks.get('notifications');
    callback?.(data);
  }

  /**
   * Cleanup subscriptions
   */
  destroy(): void {
    this.subscriptionIds.forEach(id => {
      this.realtimeManager.unsubscribe(id);
    });
    this.subscriptionIds = [];
    this.updateCallbacks.clear();
  }
}

// Utility functions for real-time setup
export function createRealtimeManager(config: ConnectionConfig): RealtimeManager {
  return RealtimeManager.getInstance(config);
}

export function createDashboardSync(manager: RealtimeManager): DashboardRealtimeSync {
  return new DashboardRealtimeSync(manager);
}

// Default configuration
export const DEFAULT_REALTIME_CONFIG: Partial<ConnectionConfig> = {
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  timeout: 10000,
};

// Types are already exported as interfaces above
