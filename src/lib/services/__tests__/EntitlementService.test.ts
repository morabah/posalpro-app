/** @jest-environment node */
import { EntitlementService } from '../EntitlementService';

// Mock Prisma to avoid database dependencies in tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    entitlement: {
      findMany: jest.fn(),
    },
  },
}));

// Mock Redis cache
jest.mock('@/lib/redis', () => ({
  __esModule: true,
  getCache: jest.fn(),
  setCache: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getCache, setCache } from '@/lib/redis';

describe('EntitlementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to default behavior
    (getCache as jest.Mock).mockResolvedValue(null);
    (setCache as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Basic Functionality', () => {
    it('getEntitlements returns map', async () => {
      const mockEntitlements = [
        { key: 'feature.a', value: null },
        { key: 'feature.b', value: 'on' },
      ];

      (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);
      (getCache as jest.Mock).mockResolvedValue(null);

      const map = await EntitlementService.getEntitlements('t1');

      expect(map['feature.a']).toBe(true);
      expect(map['feature.b']).toBe('on');
      expect(prisma.entitlement.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't1', enabled: true },
        select: { key: true, value: true },
      });
    });

    it('hasEntitlement works', async () => {
      const mockEntitlements = [
        { key: 'feature.a', value: null },
        { key: 'feature.b', value: 'on' },
      ];

      (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);
      (getCache as jest.Mock).mockResolvedValue(null);

      expect(await EntitlementService.hasEntitlement('t1', 'feature.a')).toBe(true);
      expect(await EntitlementService.hasEntitlement('t1', 'feature.c')).toBe(false);
    });

    it('hasEntitlements requires all', async () => {
      const mockEntitlements = [
        { key: 'feature.a', value: null },
        { key: 'feature.b', value: 'on' },
      ];

      (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);
      (getCache as jest.Mock).mockResolvedValue(null);

      expect(await EntitlementService.hasEntitlements('t1', ['feature.a', 'feature.b'])).toBe(true);
      expect(await EntitlementService.hasEntitlements('t1', ['feature.a', 'missing'])).toBe(false);
    });
  });

  describe('EntitlementService Edge Cases', () => {
    describe('Cache behavior', () => {
      it('should return cached entitlements when available', async () => {
        const cachedEntitlements = { 'feature.cached': 'cached_value' };
        (getCache as jest.Mock).mockResolvedValue(cachedEntitlements);

        const result = await EntitlementService.getEntitlements('cached-tenant');

        expect(result).toEqual(cachedEntitlements);
        expect(prisma.entitlement.findMany).not.toHaveBeenCalled();
        expect(setCache).not.toHaveBeenCalled();
      });

      it('should cache entitlements after database fetch', async () => {
        const mockEntitlements = [{ key: 'feature.db', value: 'db_value' }];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        await EntitlementService.getEntitlements('cache-test-tenant');

        expect(setCache).toHaveBeenCalledWith(
          'entitlements:cache-test-tenant',
          { 'feature.db': 'db_value' },
          60
        );
      });
    });

    describe('Empty and null values', () => {
      it('should handle empty tenant ID', async () => {
        const result = await EntitlementService.getEntitlements('');
        expect(result).toEqual({});
        expect(prisma.entitlement.findMany).not.toHaveBeenCalled();
      });

      it('should handle null tenant ID', async () => {
        const result = await EntitlementService.getEntitlements(null as any);
        expect(result).toEqual({});
        expect(prisma.entitlement.findMany).not.toHaveBeenCalled();
      });

      it('should handle undefined tenant ID', async () => {
        const result = await EntitlementService.getEntitlements(undefined as any);
        expect(result).toEqual({});
        expect(prisma.entitlement.findMany).not.toHaveBeenCalled();
      });

      it('should convert null values to true', async () => {
        const mockEntitlements = [
          { key: 'feature.null', value: null },
          { key: 'feature.undefined', value: undefined },
        ];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const result = await EntitlementService.getEntitlements('null-test-tenant');

        expect(result['feature.null']).toBe(true);
        expect(result['feature.undefined']).toBe(true);
      });
    });

    describe('Large entitlement sets', () => {
      it('should handle large number of entitlements', async () => {
        const largeEntitlementSet = Array.from({ length: 1000 }, (_, i) => ({
          key: `feature.${i}`,
          value: `value_${i}`,
        }));
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(largeEntitlementSet);

        const result = await EntitlementService.getEntitlements('large-tenant');

        expect(Object.keys(result)).toHaveLength(1000);
        expect(result['feature.0']).toBe('value_0');
        expect(result['feature.999']).toBe('value_999');
      });

      it('should handle hasEntitlements with large key arrays', async () => {
        const mockEntitlements = Array.from({ length: 100 }, (_, i) => ({
          key: `feature.${i}`,
          value: `value_${i}`,
        }));
        const largeKeyArray = Array.from({ length: 100 }, (_, i) => `feature.${i}`);

        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const result = await EntitlementService.hasEntitlements('large-keys-tenant', largeKeyArray);
        expect(result).toBe(true);
      });
    });

    describe('Special characters and edge cases', () => {
      it('should handle entitlements with special characters', async () => {
        const mockEntitlements = [
          { key: 'feature.with-dash', value: 'dash_value' },
          { key: 'feature.with_underscore', value: 'underscore_value' },
          { key: 'feature.with.dot', value: 'dot_value' },
          { key: 'feature.with spaces', value: 'space_value' },
        ];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const result = await EntitlementService.getEntitlements('special-chars-tenant');

        expect(result['feature.with-dash']).toBe('dash_value');
        expect(result['feature.with_underscore']).toBe('underscore_value');
        expect(result['feature.with.dot']).toBe('dot_value');
        expect(result['feature.with spaces']).toBe('space_value');
      });

      it('should handle empty entitlement arrays', async () => {
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue([]);

        const result = await EntitlementService.getEntitlements('empty-tenant');
        expect(result).toEqual({});
      });
    });
  });

  describe('EntitlementService Error Scenarios', () => {
    describe('Database connection failures', () => {
      it('should handle database connection errors in getEntitlements', async () => {
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockRejectedValue(
          new Error('Database connection failed')
        );

        await expect(EntitlementService.getEntitlements('db-error-tenant')).rejects.toThrow(
          'Database connection failed'
        );
      });

      it('should handle database errors in hasEntitlement', async () => {
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockRejectedValue(
          new Error('Database query failed')
        );

        await expect(
          EntitlementService.hasEntitlement('db-error-tenant', 'feature.test')
        ).rejects.toThrow('Database query failed');
      });

      it('should handle database errors in hasEntitlements', async () => {
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockRejectedValue(
          new Error('Database query failed')
        );

        await expect(
          EntitlementService.hasEntitlements('db-error-tenant', ['feature.test'])
        ).rejects.toThrow('Database query failed');
      });
    });

    describe('Cache failures', () => {
      it('should throw error when cache get fails', async () => {
        (getCache as jest.Mock).mockRejectedValue(new Error('Cache get failed'));

        await expect(EntitlementService.getEntitlements('cache-error-tenant')).rejects.toThrow(
          'Cache get failed'
        );
        expect(prisma.entitlement.findMany).not.toHaveBeenCalled();
      });

      it('should throw error when cache set fails', async () => {
        const mockEntitlements = [{ key: 'feature.cache-set-error', value: 'value' }];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);
        (setCache as jest.Mock).mockRejectedValue(new Error('Cache set failed'));

        await expect(EntitlementService.getEntitlements('cache-set-error-tenant')).rejects.toThrow(
          'Cache set failed'
        );
        expect(prisma.entitlement.findMany).toHaveBeenCalled();
      });
    });

    describe('Invalid input handling', () => {
      it('should handle hasEntitlements with null keys array', async () => {
        const result = await EntitlementService.hasEntitlements('test-tenant', null as any);
        expect(result).toBe(true);
      });

      it('should handle hasEntitlements with undefined keys array', async () => {
        const result = await EntitlementService.hasEntitlements('test-tenant', undefined as any);
        expect(result).toBe(true);
      });

      it('should handle hasEntitlements with empty keys array', async () => {
        const result = await EntitlementService.hasEntitlements('test-tenant', []);
        expect(result).toBe(true);
      });

      it('should handle hasEntitlement with null key', async () => {
        const mockEntitlements = [{ key: 'feature.valid', value: 'value' }];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const result = await EntitlementService.hasEntitlement('test-tenant', null as any);
        expect(result).toBe(false);
      });

      it('should handle hasEntitlement with undefined key', async () => {
        const mockEntitlements = [{ key: 'feature.valid', value: 'value' }];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const result = await EntitlementService.hasEntitlement('test-tenant', undefined as any);
        expect(result).toBe(false);
      });
    });

    describe('Data corruption scenarios', () => {
      it('should handle malformed entitlement data', async () => {
        const malformedEntitlements = [
          { key: null, value: 'value' }, // null key
          { key: 'feature.valid', value: 'value' },
          { key: '', value: 'empty_key_value' }, // empty key
        ];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(malformedEntitlements);

        const result = await EntitlementService.getEntitlements('malformed-tenant');

        expect(result['feature.valid']).toBe('value');
        expect(result['']).toBe('empty_key_value');
        // null key should be handled gracefully
      });

      it('should handle duplicate entitlement keys', async () => {
        const duplicateEntitlements = [
          { key: 'feature.duplicate', value: 'first_value' },
          { key: 'feature.duplicate', value: 'second_value' },
        ];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(duplicateEntitlements);

        const result = await EntitlementService.getEntitlements('duplicate-tenant');

        // Last value should win
        expect(result['feature.duplicate']).toBe('second_value');
      });
    });

    describe('Concurrent access scenarios', () => {
      it('should handle concurrent entitlement requests', async () => {
        const mockEntitlements = [{ key: 'feature.concurrent', value: 'value' }];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const promises = Array.from({ length: 10 }, () =>
          EntitlementService.getEntitlements('concurrent-tenant')
        );
        const results = await Promise.all(promises);

        results.forEach(result => {
          expect(result['feature.concurrent']).toBe('value');
        });
      });

      it('should handle concurrent hasEntitlement requests', async () => {
        const mockEntitlements = [{ key: 'feature.concurrent', value: 'value' }];
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const promises = Array.from({ length: 10 }, () =>
          EntitlementService.hasEntitlement('concurrent-tenant', 'feature.concurrent')
        );
        const results = await Promise.all(promises);

        results.forEach(result => {
          expect(result).toBe(true);
        });
      });
    });
  });

  describe('EntitlementService Performance Benchmarks', () => {
    describe('Entitlement retrieval performance', () => {
      it('should complete getEntitlements within 100ms for small datasets', async () => {
        const mockEntitlements = Array.from({ length: 10 }, (_, i) => ({
          key: `feature.${i}`,
          value: `value_${i}`,
        }));
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const startTime = performance.now();
        const result = await EntitlementService.getEntitlements('perf-small-tenant');
        const endTime = performance.now();

        const executionTime = endTime - startTime;

        expect(executionTime).toBeLessThan(100); // Should complete within 100ms
        expect(Object.keys(result)).toHaveLength(10);
      });

      it('should complete getEntitlements within 500ms for large datasets', async () => {
        const mockEntitlements = Array.from({ length: 1000 }, (_, i) => ({
          key: `feature.${i}`,
          value: `value_${i}`,
        }));
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const startTime = performance.now();
        const result = await EntitlementService.getEntitlements('perf-large-tenant');
        const endTime = performance.now();

        const executionTime = endTime - startTime;

        expect(executionTime).toBeLessThan(500); // Should complete within 500ms
        expect(Object.keys(result)).toHaveLength(1000);
      });

      it('should leverage cache for repeated requests', async () => {
        const mockEntitlements = [{ key: 'feature.cached', value: 'cached_value' }];
        (getCache as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(mockEntitlements);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        // First request - should hit database
        const startTime1 = performance.now();
        await EntitlementService.getEntitlements('cache-perf-tenant');
        const endTime1 = performance.now();

        // Second request - should hit cache
        const startTime2 = performance.now();
        await EntitlementService.getEntitlements('cache-perf-tenant');
        const endTime2 = performance.now();

        const dbTime = endTime1 - startTime1;
        const cacheTime = endTime2 - startTime2;

        expect(cacheTime).toBeLessThan(dbTime); // Cache should be faster
        expect(prisma.entitlement.findMany).toHaveBeenCalledTimes(1); // Only called once
      });
    });

    describe('Bulk entitlement checks performance', () => {
      it('should complete hasEntitlements within 200ms for large key arrays', async () => {
        const mockEntitlements = Array.from({ length: 100 }, (_, i) => ({
          key: `feature.${i}`,
          value: `value_${i}`,
        }));
        const largeKeyArray = Array.from({ length: 100 }, (_, i) => `feature.${i}`);

        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const startTime = performance.now();
        const result = await EntitlementService.hasEntitlements('bulk-perf-tenant', largeKeyArray);
        const endTime = performance.now();

        const executionTime = endTime - startTime;

        expect(executionTime).toBeLessThan(200); // Should complete within 200ms
        expect(result).toBe(true);
      });

      it('should handle bulk entitlement checks efficiently', async () => {
        const mockEntitlements = Array.from({ length: 50 }, (_, i) => ({
          key: `feature.${i}`,
          value: `value_${i}`,
        }));
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const tenantIds = Array.from({ length: 50 }, (_, i) => `bulk-tenant-${i}`);
        const keyArrays = tenantIds.map(() => Array.from({ length: 10 }, (_, i) => `feature.${i}`));

        const startTime = performance.now();
        const results = await Promise.all(
          tenantIds.map((tenantId, index) =>
            EntitlementService.hasEntitlements(tenantId, keyArrays[index])
          )
        );
        const endTime = performance.now();

        const executionTime = endTime - startTime;

        expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
        expect(results).toHaveLength(50);
        results.forEach(result => {
          expect(result).toBe(true);
        });
      });
    });

    describe('Memory usage benchmarks', () => {
      it('should not leak memory during repeated entitlement checks', async () => {
        const mockEntitlements = Array.from({ length: 100 }, (_, i) => ({
          key: `feature.${i}`,
          value: `value_${i}`,
        }));
        (getCache as jest.Mock).mockResolvedValue(null);
        (prisma.entitlement.findMany as jest.Mock).mockResolvedValue(mockEntitlements);

        const initialMemory = process.memoryUsage().heapUsed;

        // Perform 1000 entitlement checks
        for (let i = 0; i < 1000; i++) {
          await EntitlementService.getEntitlements(`memory-test-tenant-${i % 10}`);
        }

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        // Memory increase should be reasonable (less than 10MB)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      });
    });
  });
});
