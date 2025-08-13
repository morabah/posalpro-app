/**
 * Secure Session Management
 * Addresses session security vulnerabilities with encrypted storage and concurrent session limits
 */

import { logger } from '@/utils/logger';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

interface SecureSession {
  userId: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  lastAccessed: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

interface SessionOptions {
  maxConcurrentSessions: number;
  sessionTimeout: number; // in milliseconds
  encryptionKey: string;
}

export class SecureSessionManager {
  private static instance: SecureSessionManager;
  private sessions: Map<string, string> = new Map(); // sessionId -> encrypted session data
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> Set of sessionIds
  private options: SessionOptions;
  private readonly algorithm = 'aes-256-gcm';

  private constructor(options: SessionOptions) {
    this.options = options;
    this.startCleanupInterval();
  }

  public static getInstance(options?: SessionOptions): SecureSessionManager {
    if (!SecureSessionManager.instance) {
      if (!options) {
        throw new Error('SessionOptions required for first initialization');
      }
      SecureSessionManager.instance = new SecureSessionManager(options);
    }
    return SecureSessionManager.instance;
  }

  /**
   * Create a new secure session
   */
  public async createSession(
    userId: string,
    roles: string[],
    permissions: string[],
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    // Check concurrent session limit
    const userSessionIds = this.userSessions.get(userId) || new Set();

    if (userSessionIds.size >= this.options.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSessionId = Array.from(userSessionIds)[0];
      await this.invalidateSession(oldestSessionId);
      logger.info('[Session] Removed oldest session due to limit', { userId, oldestSessionId });
    }

    // Generate secure session ID
    const sessionId = this.generateSecureSessionId(userId);

    const session: SecureSession = {
      userId,
      sessionId,
      roles,
      permissions,
      createdAt: new Date(),
      lastAccessed: new Date(),
      ipAddress,
      userAgent,
      isActive: true,
    };

    // Encrypt and store session
    const encryptedSession = this.encryptSession(session);
    this.sessions.set(sessionId, encryptedSession);

    // Update user session tracking
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);

    logger.info('[Session] Created secure session', {
      userId,
      sessionId: sessionId.substring(0, 8) + '...',
      concurrentSessions: this.userSessions.get(userId)!.size,
    });

    return sessionId;
  }

  /**
   * Validate and retrieve session
   */
  public async validateSession(sessionId: string): Promise<SecureSession | null> {
    const encryptedSession = this.sessions.get(sessionId);
    if (!encryptedSession) {
      return null;
    }

    try {
      const session = this.decryptSession(encryptedSession);

      // Check if session is expired
      const now = new Date();
      const sessionAge = now.getTime() - session.lastAccessed.getTime();

      if (sessionAge > this.options.sessionTimeout) {
        await this.invalidateSession(sessionId);
        logger.info('[Session] Session expired', { sessionId: sessionId.substring(0, 8) + '...' });
        return null;
      }

      // Update last accessed time
      session.lastAccessed = now;
      const updatedEncryptedSession = this.encryptSession(session);
      this.sessions.set(sessionId, updatedEncryptedSession);

      return session;
    } catch (error) {
      logger.error('[Session] Failed to decrypt session', {
        sessionId: sessionId.substring(0, 8) + '...',
        error,
      });
      await this.invalidateSession(sessionId);
      return null;
    }
  }

  /**
   * Invalidate a specific session
   */
  public async invalidateSession(sessionId: string): Promise<void> {
    const encryptedSession = this.sessions.get(sessionId);
    if (!encryptedSession) {
      return;
    }

    try {
      const session = this.decryptSession(encryptedSession);

      // Remove from sessions map
      this.sessions.delete(sessionId);

      // Remove from user sessions tracking
      const userSessionIds = this.userSessions.get(session.userId);
      if (userSessionIds) {
        userSessionIds.delete(sessionId);
        if (userSessionIds.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }

      logger.info('[Session] Invalidated session', {
        userId: session.userId,
        sessionId: sessionId.substring(0, 8) + '...',
      });
    } catch (error) {
      // If we can't decrypt, just remove it
      this.sessions.delete(sessionId);
      logger.warn('[Session] Removed corrupted session', {
        sessionId: sessionId.substring(0, 8) + '...',
      });
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  public async invalidateUserSessions(userId: string): Promise<void> {
    const userSessionIds = this.userSessions.get(userId);
    if (!userSessionIds) {
      return;
    }

    const sessionIds = Array.from(userSessionIds);
    for (const sessionId of sessionIds) {
      await this.invalidateSession(sessionId);
    }

    logger.info('[Session] Invalidated all user sessions', { userId, count: sessionIds.length });
  }

  /**
   * Get active sessions for a user
   */
  public async getUserSessions(userId: string): Promise<SecureSession[]> {
    const userSessionIds = this.userSessions.get(userId);
    if (!userSessionIds) {
      return [];
    }

    const sessions: SecureSession[] = [];
    for (const sessionId of userSessionIds) {
      const session = await this.validateSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Update session permissions (e.g., when roles change)
   */
  public async updateSessionPermissions(
    userId: string,
    newRoles: string[],
    newPermissions: string[]
  ): Promise<void> {
    const userSessionIds = this.userSessions.get(userId);
    if (!userSessionIds) {
      return;
    }

    for (const sessionId of userSessionIds) {
      const encryptedSession = this.sessions.get(sessionId);
      if (encryptedSession) {
        try {
          const session = this.decryptSession(encryptedSession);
          session.roles = newRoles;
          session.permissions = newPermissions;

          const updatedEncryptedSession = this.encryptSession(session);
          this.sessions.set(sessionId, updatedEncryptedSession);
        } catch (error) {
          logger.error('[Session] Failed to update session permissions', { sessionId, error });
          await this.invalidateSession(sessionId);
        }
      }
    }

    logger.info('[Session] Updated permissions for user sessions', {
      userId,
      sessionCount: userSessionIds.size,
    });
  }

  /**
   * Generate secure session ID
   */
  private generateSecureSessionId(userId: string): string {
    const timestamp = Date.now().toString();
    const randomData = randomBytes(16).toString('hex');
    const userHash = createHash('sha256').update(userId).digest('hex').substring(0, 8);

    return `${userHash}_${timestamp}_${randomData}`;
  }

  /**
   * Encrypt session data
   */
  private encryptSession(session: SecureSession): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(
      this.algorithm,
      Buffer.from(this.options.encryptionKey, 'hex'),
      iv
    );

    const sessionData = JSON.stringify(session);
    let encrypted = cipher.update(sessionData, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt session data
   */
  private decryptSession(encryptedData: string): SecureSession {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(
      this.algorithm,
      Buffer.from(this.options.encryptionKey, 'hex'),
      iv
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const parsed: unknown = JSON.parse(decrypted);
    // Narrow unknown to SecureSession with minimal runtime checks
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Decrypted session has invalid format');
    }
    const s = parsed as Partial<SecureSession>;
    if (
      typeof s.userId !== 'string' ||
      typeof s.sessionId !== 'string' ||
      !Array.isArray(s.roles) ||
      !Array.isArray(s.permissions) ||
      typeof s.ipAddress !== 'string' ||
      typeof s.userAgent !== 'string'
    ) {
      throw new Error('Decrypted session missing required fields');
    }
    // Coerce date fields
    const createdAt = s.createdAt instanceof Date ? s.createdAt : new Date(String(s.createdAt));
    const lastAccessed =
      s.lastAccessed instanceof Date ? s.lastAccessed : new Date(String(s.lastAccessed));
    return {
      userId: s.userId,
      sessionId: s.sessionId,
      roles: s.roles as string[],
      permissions: s.permissions as string[],
      createdAt,
      lastAccessed,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      isActive: Boolean(s.isActive),
    };
  }

  /**
   * Start cleanup interval for expired sessions
   */
  private startCleanupInterval(): void {
    setInterval(
      async () => {
        const now = new Date();
        const expiredSessions: string[] = [];

        for (const [sessionId, encryptedSession] of this.sessions.entries()) {
          try {
            const session = this.decryptSession(encryptedSession);
            const sessionAge = now.getTime() - session.lastAccessed.getTime();

            if (sessionAge > this.options.sessionTimeout) {
              expiredSessions.push(sessionId);
            }
          } catch (error) {
            // If we can't decrypt, it's corrupted - mark for removal
            expiredSessions.push(sessionId);
          }
        }

        for (const sessionId of expiredSessions) {
          await this.invalidateSession(sessionId);
        }

        if (expiredSessions.length > 0) {
          logger.info('[Session] Cleanup completed', { expiredCount: expiredSessions.length });
        }
      },
      5 * 60 * 1000
    ); // Run every 5 minutes
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): {
    totalSessions: number;
    activeUsers: number;
    averageSessionsPerUser: number;
  } {
    return {
      totalSessions: this.sessions.size,
      activeUsers: this.userSessions.size,
      averageSessionsPerUser:
        this.userSessions.size > 0 ? this.sessions.size / this.userSessions.size : 0,
    };
  }
}

// Default configuration
export const defaultSessionOptions: SessionOptions = {
  maxConcurrentSessions: 3,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  encryptionKey:
    process.env.SESSION_ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

// Export singleton instance
export const secureSessionManager = SecureSessionManager.getInstance(defaultSessionOptions);
