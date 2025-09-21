/**
 * Granular Role-Based Field Access Tests for Selective Hydration
 * Tests the enhanced selective hydration system with granular role and permission-based field filtering
 */

import { describe, expect, it } from '@jest/globals';
import { getPrismaSelect, parseFieldsParam } from '../selectiveHydration';

describe('Granular Role-Based Field Access', () => {
  describe('Field Role Mapping', () => {
    it('should allow Sales Manager to access performance fields', () => {
      const select = getPrismaSelect('user', ['performanceRating', 'skills', 'certifications'], {
        userRoles: ['Sales Manager'],
        userId: 'user-123',
      });

      expect(select).toHaveProperty('performanceRating');
      expect(select).toHaveProperty('skills');
      expect(select).toHaveProperty('certifications');
    });

    it('should deny Business Development Manager access to performance fields', () => {
      const select = getPrismaSelect('user', ['performanceRating', 'skills'], {
        userRoles: ['Business Development Manager'],
        userId: 'user-123',
      });

      expect(select).not.toHaveProperty('performanceRating');
      expect(select).not.toHaveProperty('skills');
    });

    it('should allow HR Manager to access employee fields', () => {
      const select = getPrismaSelect('user', ['employeeId', 'hireDate'], {
        userRoles: ['HR Manager'],
        userId: 'user-123',
      });

      expect(select).toHaveProperty('employeeId');
      expect(select).toHaveProperty('hireDate');
      // emergencyContact is restricted to administrators only
    });

    it('should deny Sales Manager access to HR fields', () => {
      const select = getPrismaSelect('user', ['employeeId', 'hireDate'], {
        userRoles: ['Sales Manager'],
        userId: 'user-123',
      });

      expect(select).not.toHaveProperty('employeeId');
      expect(select).not.toHaveProperty('hireDate');
    });

    it('should allow Security Administrator to access security fields', () => {
      const select = getPrismaSelect('user', ['mfaEnabled'], {
        userRoles: ['Security Administrator'],
        userId: 'user-123',
      });

      expect(select).toHaveProperty('mfaEnabled');
      // failedLoginAttempts and accountLockedUntil are restricted to System Administrator only
    });

    it('should deny regular users access to security fields', () => {
      const select = getPrismaSelect('user', ['failedLoginAttempts', 'mfaEnabled'], {
        userRoles: ['Business Development Manager'],
        userId: 'user-123',
      });

      expect(select).not.toHaveProperty('failedLoginAttempts');
      expect(select).not.toHaveProperty('mfaEnabled');
    });
  });

  describe('Field Permission Mapping', () => {
    it('should allow users with HR permissions to access sensitive fields', () => {
      const select = getPrismaSelect('user', ['salary', 'performanceReviews'], {
        userRoles: ['Business Development Manager'],
        userPermissions: ['hr:read_sensitive', 'hr:read_performance'],
        userId: 'user-123',
      });

      expect(select).toHaveProperty('salary');
      expect(select).toHaveProperty('performanceReviews');
    });

    it('should deny access without required permissions', () => {
      const select = getPrismaSelect('user', ['salary', 'disciplinaryActions'], {
        userRoles: ['Business Development Manager'],
        userPermissions: ['basic:read'], // Missing required permissions
        userId: 'user-123',
      });

      expect(select).not.toHaveProperty('salary');
      expect(select).not.toHaveProperty('disciplinaryActions');
    });

    it('should allow admin permissions to override field restrictions', () => {
      const select = getPrismaSelect('user', ['salary', 'disciplinaryActions'], {
        userRoles: ['Business Development Manager'],
        userPermissions: ['admin:full_access'],
        userId: 'user-123',
      });

      expect(select).toHaveProperty('salary');
      expect(select).toHaveProperty('disciplinaryActions');
    });
  });

  describe('Multiple Role Support', () => {
    it('should allow access when user has multiple roles including required one', () => {
      const select = getPrismaSelect('user', ['performanceRating', 'employeeId'], {
        userRoles: ['Business Development Manager', 'Sales Manager', 'HR Manager'],
        userId: 'user-123',
      });

      expect(select).toHaveProperty('performanceRating'); // Sales Manager role
      expect(select).toHaveProperty('employeeId'); // HR Manager role
    });

    it('should combine role and permission requirements', () => {
      const select = getPrismaSelect('user', ['performanceRating', 'salary'], {
        userRoles: ['Sales Manager'],
        userPermissions: ['hr:read_sensitive'],
        userId: 'user-123',
      });

      expect(select).toHaveProperty('performanceRating'); // Role-based access
      expect(select).toHaveProperty('salary'); // Permission-based access
    });
  });

  describe('Legacy Compatibility', () => {
    it('should support legacy minRole requirement', () => {
      const select = getPrismaSelect('user', ['id', 'name', 'email'], {
        userRoles: ['Business Development Manager'],
        userId: 'user-123',
      });

      // Basic fields should still be accessible with the minimum role
      expect(select).toHaveProperty('id');
      expect(select).toHaveProperty('name');
      expect(select).toHaveProperty('email');
    });

    it('should deny access below minimum role', () => {
      const select = getPrismaSelect('user', ['id', 'name', 'email'], {
        userRoles: ['Viewer'], // Below minimum role
        userId: 'user-123',
      });

      // Should deny access due to minRole requirement
      expect(select).not.toHaveProperty('id');
      expect(select).not.toHaveProperty('name');
      expect(select).not.toHaveProperty('email');
    });
  });

  describe('Restricted Fields (Legacy Support)', () => {
    it('should allow admin roles to access restricted fields', () => {
      const select = getPrismaSelect('user', ['password', 'failedLoginAttempts'], {
        userRoles: ['System Administrator'],
        userId: 'user-123',
      });

      expect(select).toHaveProperty('password');
      expect(select).toHaveProperty('failedLoginAttempts');
    });

    it('should deny non-admin access to restricted fields', () => {
      const select = getPrismaSelect('user', ['password'], {
        userRoles: ['Business Development Manager'],
        userId: 'user-123',
      });

      expect(select).not.toHaveProperty('password');
    });
  });

  describe('Self-Access-Only Fields', () => {
    it('should allow users to access their own sensitive data', () => {
      const select = getPrismaSelect('user', ['analyticsProfile', 'preferences'], {
        userRoles: ['Business Development Manager'],
        userId: 'user-123',
        targetUserId: 'user-123', // Accessing own data
      });

      expect(select).toHaveProperty('analyticsProfile');
      expect(select).toHaveProperty('preferences');
    });

    it('should deny access to other users sensitive data without admin role', () => {
      const select = getPrismaSelect('user', ['analyticsProfile', 'preferences'], {
        userRoles: ['Business Development Manager'],
        userId: 'user-123',
        targetUserId: 'user-456', // Accessing different user's data
      });

      expect(select).not.toHaveProperty('analyticsProfile');
      expect(select).not.toHaveProperty('preferences');
    });

    it('should allow admin access to any users sensitive data', () => {
      const select = getPrismaSelect('user', ['analyticsProfile', 'preferences'], {
        userRoles: ['System Administrator'],
        userId: 'user-123',
        targetUserId: 'user-456', // Admin accessing different user's data
      });

      expect(select).toHaveProperty('analyticsProfile');
      expect(select).toHaveProperty('preferences');
    });
  });

  describe('Parse Fields Parameter Integration', () => {
    it('should integrate granular role checking with field parsing', () => {
      const { select, optimizationMetrics } = parseFieldsParam(
        'performanceRating,skills,employeeId',
        'user',
        {
          userRoles: ['Sales Manager', 'HR Manager'],
          userPermissions: ['hr:read_sensitive'],
          userId: 'user-123',
        }
      );

      expect(select).toHaveProperty('performanceRating'); // Sales Manager role
      expect(select).toHaveProperty('employeeId'); // HR Manager role
      expect(select).toHaveProperty('skills'); // Allowed via permissions

      expect(optimizationMetrics.requestedFieldCount).toBe(3);
      expect(optimizationMetrics.processedFields).toBe(3); // All requested fields processed
    });

    it('should handle mixed accessible and inaccessible fields', () => {
      const { select } = parseFieldsParam(
        'performanceRating,failedLoginAttempts,employeeId',
        'user',
        {
          userRoles: ['Sales Manager'], // Has Sales Manager but not Security Admin
          userId: 'user-123',
        }
      );

      expect(select).toHaveProperty('performanceRating'); // Accessible via Sales Manager role
      expect(select).not.toHaveProperty('employeeId'); // Requires HR Manager role (not present)
      expect(select).not.toHaveProperty('failedLoginAttempts'); // Requires Security Admin role
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complex role combinations correctly', () => {
      const select = getPrismaSelect(
        'user',
        [
          'performanceRating', // Sales Manager
          'employeeId', // HR Manager
          'failedLoginAttempts', // Security Admin
          'salary', // hr:read_sensitive permission
          'analyticsProfile', // Self-access only
          'password', // Restricted field (admin only)
        ],
        {
          userRoles: ['Sales Manager', 'Security Administrator'],
          userPermissions: ['hr:read_sensitive', 'admin:full_access'],
          userId: 'user-123',
          targetUserId: 'user-456', // Accessing different user's data
        }
      );

      // Should include fields accessible via user's roles/permissions
      expect(select).toHaveProperty('performanceRating'); // Sales Manager role
      expect(select).not.toHaveProperty('failedLoginAttempts'); // Restricted to System Administrator only
      expect(select).toHaveProperty('salary'); // hr:read_sensitive permission
      expect(select).not.toHaveProperty('password'); // Restricted to System Administrator role only

      // Should exclude fields not accessible via user's roles/permissions
      expect(select).not.toHaveProperty('employeeId'); // No HR Manager role
      expect(select).not.toHaveProperty('analyticsProfile'); // Not accessing own data and no self-access override
    });

    it('should prioritize most permissive access when multiple criteria match', () => {
      const select = getPrismaSelect('user', ['performanceRating'], {
        userRoles: ['Business Development Manager', 'Sales Manager', 'System Administrator'],
        userPermissions: ['hr:read_sensitive'],
        userId: 'user-123',
      });

      // Should include field due to Sales Manager role (even though BDM would be denied)
      expect(select).toHaveProperty('performanceRating');
    });
  });
});
