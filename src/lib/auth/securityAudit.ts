/**
 * Security Audit and Monitoring System
 * Real-time security event detection and comprehensive audit logging
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

// Define proper types for Prisma query results
type SecurityEventSelect = {
  type: SecurityEventType;
  riskLevel: RiskLevel;
};

type SecurityEventGroupBy = {
  riskLevel: RiskLevel;
  _count: { id: number };
};

// Define enums locally since they might not be available from @prisma/client
export enum AuditCategory {
  DATA = 'DATA',
  ACCESS = 'ACCESS',
  CONFIGURATION = 'CONFIGURATION',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SecurityEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_ACCESS = 'DATA_ACCESS',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  action?: string;
  riskLevel: RiskLevel;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface AuditEvent {
  userId?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId: string;
  changes: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  severity: AuditSeverity;
  category: AuditCategory;
  metadata?: Record<string, unknown>;
}

export interface SecurityAlert {
  eventId: string;
  alertType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  recommendations: string[];
  timestamp: Date;
}

export class SecurityAuditManager {
  private static instance: SecurityAuditManager;
  // Simple in-process async queue to avoid blocking request latency
  private auditQueue: Array<() => Promise<void>> = [];
  private processing = false;
  private maxBatch = 25;
  private flushIntervalMs = 250; // small delay to coalesce bursts
  private alertThresholds = {
    failedLogins: { count: 5, timeWindow: 15 * 60 * 1000 }, // 5 failures in 15 minutes
    permissionDenials: { count: 10, timeWindow: 5 * 60 * 1000 }, // 10 denials in 5 minutes
    suspiciousActivity: { count: 3, timeWindow: 10 * 60 * 1000 }, // 3 suspicious events in 10 minutes
  };

  public static getInstance(): SecurityAuditManager {
    if (!SecurityAuditManager.instance) {
      SecurityAuditManager.instance = new SecurityAuditManager();
    }
    return SecurityAuditManager.instance;
  }

  /**
   * Enqueue a write operation and process asynchronously.
   * Never await this from request path unless explicitly needed.
   */
  private enqueue(task: () => Promise<void>): void {
    this.auditQueue.push(task);
    if (!this.processing) {
      this.processing = true;
      // Schedule processing on next tick with small delay to batch
      setTimeout(() => {
        void this.processQueue();
      }, this.flushIntervalMs);
    }
  }

  private async processQueue(): Promise<void> {
    try {
      while (this.auditQueue.length > 0) {
        const batch = this.auditQueue.splice(0, this.maxBatch);
        // Execute batch sequentially to keep DB pressure predictable
        for (const task of batch) {
          try {
            await task();
          } catch (error) {
            logger.error('[Audit Queue] Task failed', { error });
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Log security event and check for threats
   */
  public async logSecurityEvent(event: SecurityEvent): Promise<void> {
    this.enqueue(async () => {
      try {
        const securityEvent = await prisma.securityEvent.create({
          data: {
            type: event.type,
            userId: event.userId,
            ipAddress: event.ipAddress,
            riskLevel: event.riskLevel,
            details: JSON.stringify({
              ...(event.details || {}),
              userAgent: event.userAgent,
              resource: event.resource,
              action: event.action,
            }) as unknown as any,
            timestamp: event.timestamp,
            status: 'DETECTED',
          },
        });

        await this.analyzeSecurityThreat(securityEvent.id, event);

        logger.info('[Security] Event logged', {
          eventId: securityEvent.id,
          type: event.type,
          riskLevel: event.riskLevel,
          userId: event.userId,
        });
      } catch (error) {
        logger.error('[Security] Failed to log security event', { event, error });
      }
    });
  }

  /**
   * Log audit event
   */
  public async logAuditEvent(event: AuditEvent): Promise<void> {
    this.enqueue(async () => {
      try {
        await prisma.auditLog.create({
          data: {
            actorId: event.userId ?? undefined,
            action: event.action,
            model: event.entity, // Use model instead of entity
            targetId: event.entityId, // Use targetId instead of entityId
            diff: event.changes as unknown as any,
            ip: event.ipAddress, // Use ip instead of ipAddress
          },
        });

        logger.info('[Audit] Event logged', {
          action: event.action,
          entity: event.entity,
          severity: event.severity,
          userId: event.userId,
        });
      } catch (error) {
        logger.error('[Audit] Failed to log audit event', { event, error });
      }
    });
  }

  /**
   * Analyze security threats and generate alerts
   */
  private async analyzeSecurityThreat(eventId: string, event: SecurityEvent): Promise<void> {
    const alerts: SecurityAlert[] = [];

    // Check for failed login attempts
    if (event.type === SecurityEventType.LOGIN_ATTEMPT && event.details.success === false) {
      const recentFailures = await this.getRecentSecurityEvents(
        SecurityEventType.LOGIN_ATTEMPT,
        event.ipAddress,
        this.alertThresholds.failedLogins.timeWindow
      );

      if (recentFailures.length >= this.alertThresholds.failedLogins.count) {
        alerts.push({
          eventId,
          alertType: 'BRUTE_FORCE_ATTACK',
          severity: 'HIGH',
          message: `Multiple failed login attempts detected from IP ${event.ipAddress}`,
          recommendations: [
            'Consider blocking IP address temporarily',
            'Notify user if account is legitimate',
            'Review authentication logs for patterns',
          ],
          timestamp: new Date(),
        });
      }
    }

    // Check for permission denial patterns
    if (event.type === SecurityEventType.PERMISSION_DENIED) {
      const recentDenials = await this.getRecentSecurityEvents(
        SecurityEventType.PERMISSION_DENIED,
        event.userId,
        this.alertThresholds.permissionDenials.timeWindow
      );

      if (recentDenials.length >= this.alertThresholds.permissionDenials.count) {
        alerts.push({
          eventId,
          alertType: 'PRIVILEGE_ESCALATION_ATTEMPT',
          severity: 'MEDIUM',
          message: `Multiple permission denials for user ${event.userId}`,
          recommendations: [
            'Review user permissions and role assignments',
            'Check if user account is compromised',
            'Monitor user activity closely',
          ],
          timestamp: new Date(),
        });
      }
    }

    // Check for suspicious activity patterns
    if (event.riskLevel === RiskLevel.HIGH || event.riskLevel === RiskLevel.CRITICAL) {
      const recentSuspicious = await this.getRecentSecurityEvents(
        undefined,
        event.userId || event.ipAddress,
        this.alertThresholds.suspiciousActivity.timeWindow,
        [RiskLevel.HIGH, RiskLevel.CRITICAL]
      );

      if (recentSuspicious.length >= this.alertThresholds.suspiciousActivity.count) {
        alerts.push({
          eventId,
          alertType: 'SUSPICIOUS_ACTIVITY_PATTERN',
          severity: 'CRITICAL',
          message: `Pattern of suspicious activity detected`,
          recommendations: [
            'Investigate user account immediately',
            'Consider temporary account suspension',
            'Review all recent user actions',
            'Check for data exfiltration attempts',
          ],
          timestamp: new Date(),
        });
      }
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processSecurityAlert(alert);
    }
  }

  /**
   * Get recent security events for analysis
   */
  private async getRecentSecurityEvents(
    type?: SecurityEventType,
    identifier?: string,
    timeWindow?: number,
    riskLevels?: RiskLevel[]
  ): Promise<any[]> {
    const whereClause: any = {};

    if (type) {
      whereClause.type = type;
    }

    if (identifier) {
      whereClause.OR = [{ userId: identifier }, { ipAddress: identifier }];
    }

    if (timeWindow) {
      whereClause.timestamp = {
        gte: new Date(Date.now() - timeWindow),
      };
    }

    if (riskLevels) {
      whereClause.riskLevel = {
        in: riskLevels,
      };
    }

    return await prisma.securityEvent.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Process security alert
   */
  private async processSecurityAlert(alert: SecurityAlert): Promise<void> {
    try {
      // Log the alert
      logger.warn('[Security Alert]', alert);

      // Store alert in database (if you have an alerts table)
      // await prisma.securityAlert.create({ data: alert });

      // Send notifications based on severity
      if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
        await this.sendSecurityNotification(alert);
      }

      // Auto-respond to certain threat types
      await this.autoRespondToThreat(alert);
    } catch (error) {
      logger.error('[Security] Failed to process alert', { alert, error });
    }
  }

  /**
   * Send security notification
   */
  private async sendSecurityNotification(alert: SecurityAlert): Promise<void> {
    // In a real implementation, this would send notifications to security team
    logger.error('[SECURITY NOTIFICATION]', {
      type: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      recommendations: alert.recommendations,
      timestamp: alert.timestamp,
    });

    // Could integrate with:
    // - Email notifications
    // - Slack/Teams alerts
    // - SMS for critical alerts
    // - Security dashboard updates
  }

  /**
   * Auto-respond to security threats
   */
  private async autoRespondToThreat(alert: SecurityAlert): Promise<void> {
    switch (alert.alertType) {
      case 'BRUTE_FORCE_ATTACK':
        // Could implement IP blocking
        logger.info('[Security] Auto-response: Brute force detected', { alert });
        break;

      case 'PRIVILEGE_ESCALATION_ATTEMPT':
        // Could implement user monitoring
        logger.info('[Security] Auto-response: Privilege escalation detected', { alert });
        break;

      case 'SUSPICIOUS_ACTIVITY_PATTERN':
        // Could implement account flagging
        logger.info('[Security] Auto-response: Suspicious activity detected', { alert });
        break;
    }
  }

  /**
   * Log permission check
   */
  public async logPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    reason: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    if (!granted) {
      await this.logSecurityEvent({
        type: SecurityEventType.PERMISSION_DENIED,
        userId,
        ipAddress,
        userAgent,
        resource,
        action,
        riskLevel: RiskLevel.MEDIUM,
        details: {
          reason,
          resource,
          action,
        },
        timestamp: new Date(),
      });
    }

    await this.logAuditEvent({
      userId,
      action: `permission_check_${action}`,
      entity: resource,
      entityId: 'N/A',
      changes: {
        granted,
        reason,
        resource,
        action,
      },
      ipAddress,
      userAgent,
      severity: granted ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      category: AuditCategory.ACCESS,
    });
  }

  /**
   * Log login attempt
   */
  public async logLoginAttempt(
    email: string,
    success: boolean,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    failureReason?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.LOGIN_ATTEMPT,
      userId,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      riskLevel: success ? RiskLevel.LOW : RiskLevel.MEDIUM,
      details: {
        email,
        success,
        failureReason,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Log data access
   */
  public async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    sensitive: boolean = false
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.DATA_ACCESS,
      userId,
      ipAddress,
      userAgent,
      resource,
      action,
      riskLevel: sensitive ? RiskLevel.MEDIUM : RiskLevel.LOW,
      details: {
        resourceId,
        sensitive,
      },
      timestamp: new Date(),
    });

    await this.logAuditEvent({
      userId,
      action: `data_access_${action}`,
      entity: resource,
      entityId: resourceId,
      changes: {
        action,
        sensitive,
      },
      ipAddress,
      userAgent,
      severity: sensitive ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
      category: AuditCategory.DATA,
    });
  }

  /**
   * Get security dashboard metrics
   */
  public async getSecurityMetrics(timeRange: number = 24 * 60 * 60 * 1000): Promise<{
    totalEvents: number;
    riskDistribution: Record<RiskLevel, number>;
    topThreats: Array<{ type: SecurityEventType; count: number }>;
    recentAlerts: number;
  }> {
    const since = new Date(Date.now() - timeRange);

    const [events, riskDistribution] = await Promise.all([
      prisma.securityEvent.findMany({
        where: { timestamp: { gte: since } },
        select: { type: true, riskLevel: true },
      }),
      prisma.securityEvent.groupBy({
        by: ['riskLevel'],
        where: { timestamp: { gte: since } },
        _count: true,
      }),
    ]);

    // Use any[] for Prisma query results due to complex enum type mismatches
    // between local enums and Prisma-generated enums. This is a necessary compromise
    // to maintain type safety while avoiding major refactoring of the enum system.
    const threatCounts = (events as any[]).reduce(
      (acc: Record<string, number>, event: any) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topThreats = Object.entries(threatCounts)
      .map(([type, count]) => ({ type: type as SecurityEventType, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const riskDist = (riskDistribution as any[]).reduce(
      (acc: Record<RiskLevel, number>, item: any) => {
        acc[item.riskLevel as RiskLevel] = item._count;
        return acc;
      },
      {} as Record<RiskLevel, number>
    );

    return {
      totalEvents: events.length,
      riskDistribution: riskDist,
      topThreats,
      recentAlerts: (events as any[]).filter(
        (e: any) => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL'
      ).length,
    };
  }
}

// Export singleton instance
export const securityAuditManager = SecurityAuditManager.getInstance();
