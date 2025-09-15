/**
 * Security Audit Persistence Tests
 * Verifies audit logs are persisted to database and retention policy works
 */

import { SecurityAuditManager } from '@/lib/security/audit';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    securityAuditLog: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

describe('Security Audit Persistence Tests', () => {
  let auditManager: SecurityAuditManager;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get fresh instance for each test
    auditManager = SecurityAuditManager.getInstance({
      enableAudit: true,
      batchSize: 5,
      flushInterval: 1000,
      retentionDays: 30,
    });
  });

  afterEach(() => {
    auditManager.stopFlushTimer();
  });

  describe('Audit Log Storage', () => {
    it('should store audit logs to database when batch size is reached', async () => {
      const mockLogs = [
        {
          userId: 'user-1',
          resource: 'admin/users',
          action: 'read',
          scope: 'ALL',
          success: true,
          timestamp: new Date().toISOString(),
          metadata: { ip: '192.168.1.1' },
        },
        {
          userId: 'user-2',
          resource: 'admin/users',
          action: 'create',
          scope: 'ALL',
          success: false,
          timestamp: new Date().toISOString(),
          error: 'Insufficient permissions',
        },
      ];

      mockPrisma.securityAuditLog.createMany.mockResolvedValue({ count: 2 });

      // Log enough entries to trigger batch flush
      for (let i = 0; i < 5; i++) {
        auditManager.logAccess(mockLogs[0]);
      }

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockPrisma.securityAuditLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            resource: 'admin/users',
            action: 'read',
            scope: 'ALL',
            success: true,
            ip: '192.168.1.1',
          }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should handle database storage errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      mockPrisma.securityAuditLog.createMany.mockRejectedValue(mockError);

      const auditLog = {
        userId: 'user-1',
        resource: 'admin/users',
        action: 'read',
        scope: 'ALL',
        success: true,
        timestamp: new Date().toISOString(),
      };

      // Log enough entries to trigger batch flush
      for (let i = 0; i < 5; i++) {
        auditManager.logAccess(auditLog);
      }

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not throw error, logs should be restored to queue
      expect(mockPrisma.securityAuditLog.createMany).toHaveBeenCalled();
    });

    it('should transform audit log metadata correctly', async () => {
      const auditLog = {
        userId: 'user-1',
        resource: 'admin/users',
        action: 'read',
        scope: 'ALL',
        success: true,
        timestamp: new Date().toISOString(),
        metadata: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          customField: 'test',
        },
      };

      mockPrisma.securityAuditLog.createMany.mockResolvedValue({ count: 1 });

      // Log enough entries to trigger batch flush
      for (let i = 0; i < 5; i++) {
        auditManager.logAccess(auditLog);
      }

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockPrisma.securityAuditLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            resource: 'admin/users',
            action: 'read',
            scope: 'ALL',
            success: true,
            timestamp: expect.any(Date),
            metadata: {
              ip: '192.168.1.1',
              userAgent: 'Mozilla/5.0',
              customField: 'test',
            },
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          }),
        ]),
        skipDuplicates: true,
      });
    });
  });

  describe('Audit Log Retrieval', () => {
    it('should retrieve user audit logs from database', async () => {
      const mockDbLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          resource: 'admin/users',
          action: 'read',
          scope: 'ALL',
          success: true,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          error: null,
          metadata: { ip: '192.168.1.1' },
          ip: '192.168.1.1',
          userAgent: null,
        },
        {
          id: 'log-2',
          userId: 'user-1',
          resource: 'admin/users',
          action: 'create',
          scope: 'ALL',
          success: false,
          timestamp: new Date('2024-01-01T11:00:00Z'),
          error: 'Insufficient permissions',
          metadata: null,
          ip: null,
          userAgent: null,
        },
      ];

      mockPrisma.securityAuditLog.findMany.mockResolvedValue(mockDbLogs);

      const result = await auditManager.getUserAuditLogs('user-1', 10);

      expect(mockPrisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        userId: 'user-1',
        resource: 'admin/users',
        action: 'read',
        scope: 'ALL',
        success: true,
        timestamp: '2024-01-01T10:00:00.000Z',
        metadata: { ip: '192.168.1.1' },
      });
    });

    it('should retrieve resource audit logs from database', async () => {
      const mockDbLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          resource: 'admin/users',
          action: 'read',
          scope: 'ALL',
          success: true,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          error: null,
          metadata: null,
          ip: null,
          userAgent: null,
        },
      ];

      mockPrisma.securityAuditLog.findMany.mockResolvedValue(mockDbLogs);

      const result = await auditManager.getResourceAuditLogs('admin/users', 5);

      expect(mockPrisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: { resource: 'admin/users' },
        orderBy: { timestamp: 'desc' },
        take: 5,
      });

      expect(result).toHaveLength(1);
      expect(result[0].resource).toBe('admin/users');
    });

    it('should handle database retrieval errors gracefully', async () => {
      const mockError = new Error('Database query failed');
      mockPrisma.securityAuditLog.findMany.mockRejectedValue(mockError);

      const result = await auditManager.getUserAuditLogs('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('Audit Statistics', () => {
    it('should retrieve audit statistics from database', async () => {
      const mockStats = {
        totalLogs: 100,
        successCount: 85,
        failureCount: 15,
        recentLogs: [
          {
            id: 'log-1',
            userId: 'user-1',
            resource: 'admin/users',
            action: 'read',
            scope: 'ALL',
            success: true,
            timestamp: new Date('2024-01-01T10:00:00Z'),
            error: null,
            metadata: null,
            ip: null,
            userAgent: null,
          },
        ],
      };

      mockPrisma.securityAuditLog.count
        .mockResolvedValueOnce(100) // totalLogs
        .mockResolvedValueOnce(85)  // successCount
        .mockResolvedValueOnce(15); // failureCount
      mockPrisma.securityAuditLog.findMany.mockResolvedValue(mockStats.recentLogs);

      const result = await auditManager.getAuditStats();

      expect(result).toEqual({
        totalLogs: 100,
        successCount: 85,
        failureCount: 15,
        recentActivity: [
          {
            userId: 'user-1',
            resource: 'admin/users',
            action: 'read',
            scope: 'ALL',
            success: true,
            timestamp: '2024-01-01T10:00:00.000Z',
          },
        ],
      });
    });

    it('should handle database statistics errors gracefully', async () => {
      const mockError = new Error('Database query failed');
      mockPrisma.securityAuditLog.count.mockRejectedValue(mockError);

      const result = await auditManager.getAuditStats();

      expect(result).toEqual({
        totalLogs: 0,
        successCount: 0,
        failureCount: 0,
        recentActivity: [],
      });
    });
  });

  describe('Retention Policy', () => {
    it('should delete old audit logs based on retention policy', async () => {
      const mockDeleteResult = { count: 25 };
      mockPrisma.securityAuditLog.deleteMany.mockResolvedValue(mockDeleteResult);

      await auditManager.clearOldAuditLogs();

      const expectedCutoffDate = new Date();
      expectedCutoffDate.setDate(expectedCutoffDate.getDate() - 30);

      expect(mockPrisma.securityAuditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date),
          },
        },
      });

      // Verify the cutoff date is approximately correct (within 1 second)
      const actualCall = mockPrisma.securityAuditLog.deleteMany.mock.calls[0][0];
      const actualCutoffDate = actualCall.where.timestamp.lt;
      const timeDiff = Math.abs(actualCutoffDate.getTime() - expectedCutoffDate.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should handle retention policy deletion errors gracefully', async () => {
      const mockError = new Error('Database deletion failed');
      mockPrisma.securityAuditLog.deleteMany.mockRejectedValue(mockError);

      // Should not throw error
      await expect(auditManager.clearOldAuditLogs()).resolves.not.toThrow();
    });
  });

  describe('Data Modification Logging', () => {
    it('should log data modification operations', async () => {
      mockPrisma.securityAuditLog.createMany.mockResolvedValue({ count: 1 });

      auditManager.logDataModification(
        'user-1',
        'products',
        'create',
        'product-123',
        { name: 'New Product', price: 99.99 }
      );

      // Log enough entries to trigger batch flush
      for (let i = 0; i < 4; i++) {
        auditManager.logDataModification(
          'user-1',
          'products',
          'create',
          'product-123',
          { name: 'New Product', price: 99.99 }
        );
      }

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockPrisma.securityAuditLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            resource: 'products',
            action: 'create',
            scope: 'OWN',
            success: true,
            metadata: expect.objectContaining({
              resourceId: 'product-123',
              changes: { name: 'New Product', price: 99.99 },
              operationType: 'data_modification',
            }),
          }),
        ]),
        skipDuplicates: true,
      });
    });
  });

  describe('Permission Check Logging', () => {
    it('should log permission check results', async () => {
      mockPrisma.securityAuditLog.createMany.mockResolvedValue({ count: 1 });

      auditManager.logPermissionCheck(
        'user-1',
        'admin/users',
        'read',
        'ALL',
        false,
        ['admin:users:read']
      );

      // Log enough entries to trigger batch flush
      for (let i = 0; i < 4; i++) {
        auditManager.logPermissionCheck(
          'user-1',
          'admin/users',
          'read',
          'ALL',
          false,
          ['admin:users:read']
        );
      }

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockPrisma.securityAuditLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            resource: 'admin/users',
            action: 'read',
            scope: 'ALL',
            success: false,
            metadata: expect.objectContaining({
              requiredPermissions: ['admin:users:read'],
              operationType: 'permission_check',
            }),
          }),
        ]),
        skipDuplicates: true,
      });
    });
  });

  describe('Session Event Logging', () => {
    it('should log session events', async () => {
      mockPrisma.securityAuditLog.createMany.mockResolvedValue({ count: 1 });

      auditManager.logSessionEvent('user-1', 'login', {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      // Log enough entries to trigger batch flush
      for (let i = 0; i < 4; i++) {
        auditManager.logSessionEvent('user-1', 'login', {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        });
      }

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockPrisma.securityAuditLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            resource: 'session',
            action: 'login',
            scope: 'OWN',
            success: true,
            metadata: expect.objectContaining({
              ip: '192.168.1.1',
              userAgent: 'Mozilla/5.0',
              operationType: 'session_event',
            }),
          }),
        ]),
        skipDuplicates: true,
      });
    });
  });
});
