/**
 * Utility to get default select fields for a given entity type.
 * This helps in standardizing the fields returned by API endpoints.
 *
 * @param entityType - The type of the entity (e.g., 'user', 'proposal').
 * @param requestedFields - Optional array of specific fields to select.
 * @returns A Prisma select object.
 *
 * @example
 * const userSelect = getPrismaSelect('user');
 * const specificFieldsSelect = getPrismaSelect('proposal', ['id', 'title']);
 */
export function getPrismaSelect(
  entityType: keyof typeof FIELD_CONFIGS,
  requestedFields?: string[],
  options?: {
    userRole?: string;
    userRoles?: string[]; // Array of user roles for granular control
    userPermissions?: string[]; // Array of user permissions
    userId?: string;
    targetUserId?: string;
  }
): Record<string, unknown> {
  const config = FIELD_CONFIGS[entityType];

  const select: Record<string, unknown> = {};

  // Helper function to check field access based on granular role/permission requirements
  const hasFieldAccess = (field: string): boolean => {
    // Check field-specific permission requirements
    if (config.security?.fieldPermissionMap?.[field]) {
      const requiredPermissions = config.security.fieldPermissionMap[field];
      const userPermissions = options?.userPermissions || [];
      const hasRequiredPermission = requiredPermissions.some(perm =>
        userPermissions.includes(perm)
      );
      if (!hasRequiredPermission) {
        return false;
      }
    }

    // Check restricted fields (takes precedence over fieldRoleMap for security)
    if (config.security?.restrictedFields?.includes(field)) {
      const userRoles = options?.userRoles || (options?.userRole ? [options.userRole] : []);
      const isAdmin =
        userRoles.includes('System Administrator') || userRoles.includes('Administrator');
      if (!isAdmin) {
        return false;
      }
    } else {
      // Only check field-specific role requirements if field is not restricted
      if (config.security?.fieldRoleMap?.[field]) {
        const allowedRoles = config.security.fieldRoleMap[field];
        const userRoles = options?.userRoles || (options?.userRole ? [options.userRole] : []);
        const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
        if (!hasRequiredRole) {
          return false;
        }
      }
    }

    // Check self-access-only fields
    if (config.security?.selfAccessOnly?.includes(field)) {
      if (options?.userId !== options?.targetUserId) {
        const userRoles = options?.userRoles || (options?.userRole ? [options.userRole] : []);
        const isAdmin =
          userRoles.includes('System Administrator') || userRoles.includes('Administrator');
        if (!isAdmin) {
          return false;
        }
      }
    }

    // Check legacy minRole requirement (only for fields without specific role/permission/restricted/selfAccessOnly requirements)
    if (
      config.security?.minRole &&
      !config.security?.fieldRoleMap?.[field] &&
      !config.security?.fieldPermissionMap?.[field] &&
      !config.security?.restrictedFields?.includes(field) &&
      !config.security?.selfAccessOnly?.includes(field)
    ) {
      const userRoles = options?.userRoles || (options?.userRole ? [options.userRole] : []);
      const hasMinRole = userRoles.includes(config.security.minRole);
      if (!hasMinRole) {
        return false;
      }
    }

    return true;
  };

  const fieldsToSelect = requestedFields?.length
    ? requestedFields
    : config.defaultFields && config.defaultFields.length > 0
      ? config.defaultFields
      : config.allowedFields;

  fieldsToSelect.forEach(field => {
    // Check if field is in allowed fields
    if (config.allowedFields.includes(field)) {
      // Check granular field access based on roles/permissions
      const accessResult = hasFieldAccess(field);
      if (!accessResult) {
        return;
      }
      select[field] = true;
    } else {
      // Field not included in selection - skip
    }

    // Check relations
    if (config.relations && field in config.relations) {
      const relationConfig = config.relations[field];
      if (typeof relationConfig === 'object' && 'select' in relationConfig) {
        select[field] = relationConfig;
      } else {
        select[field] = {
          select: (relationConfig as string[]).reduce<Record<string, boolean>>((acc, val) => {
            acc[val] = true;
            return acc;
          }, {}),
        };
      }
    }
  });

  return select;
}

// A more flexible type for what a relation configuration can be.
// It can be a simple array of strings for basic field selection,
// or a full Prisma-style select object for complex queries.
type RelationValue = string[] | { select: unknown };

/**
 * Field configuration for different entity types
 */
interface FieldConfig {
  allowedFields: string[];
  defaultFields?: string[];
  relations?: Record<string, RelationValue>;
  computed?: string[];
  security?: {
    requiresAuth: boolean;
    minRole?: string | null;
    restrictedFields?: string[];
    selfAccessOnly?: string[];
    fieldRoleMap?: Record<string, string[]>; // Field -> allowed roles mapping
    fieldPermissionMap?: Record<string, string[]>; // Field -> required permissions mapping
  };
}

/**
 * Defines the selectable fields for each entity type.
 * This is the single source of truth for what fields can be requested from the API.
 * It MUST be kept in sync with `prisma/schema.prisma`.
 */
const FIELD_CONFIGS: Record<string, FieldConfig> = {
  user: {
    allowedFields: [
      'id',
      'name',
      'email',
      'department',
      'status',
      'lastLogin',
      'createdAt',
      'updatedAt',
      'tenantId',
      'roles',
      'analyticsProfile',
      'permissions',
      'preferences',
      'sessions',
      'lastActivityAt',
      'loginCount',
      'failedLoginAttempts',
      'accountLockedUntil',
      'mfaEnabled',
      'passwordLastChanged',
      'profilePictureUrl',
      'bio',
      'timezone',
      'language',
      'phone',
      'jobTitle',
      'managerId',
      'employeeId',
      'hireDate',
      'terminationDate',
      'performanceRating',
      'skills',
      'certifications',
      'emergencyContact',
      'address',
      // Sensitive fields (restricted by security config)
      'password',
      'salt',
      'resetToken',
      'resetTokenExpiry',
      'emailVerificationToken',
      'failedLoginAttempts',
      'accountLockedUntil',
      'passwordLastChanged',
      // Additional fields for granular role testing
      'performanceRating',
      'skills',
      'certifications',
      'employeeId',
      'hireDate',
      'terminationDate',
      'jobTitle',
      'managerId',
      'salary',
      'performanceReviews',
      'disciplinaryActions',
    ],
    relations: {
      createdProposals: ['id', 'title', 'status', 'createdAt'],
      assignedProposals: ['id', 'title', 'status', 'createdAt'],
      roles: { select: { role: { select: { name: true } } } },
      permissions: { select: { permission: { select: { action: true, resource: true } } } },
      preferences: ['id', 'theme', 'language'],
      _count: {
        select: {
          createdProposals: true,
          assignedProposals: true,
        },
      },
    },
    computed: ['fullName', 'isOnline', 'lastActivity', 'roleNames'],
    security: {
      requiresAuth: true,
      minRole: 'Business Development Manager',
      restrictedFields: [
        'password',
        'salt',
        'resetToken',
        'resetTokenExpiry',
        'emailVerificationToken',
        'accessibilityConfig',
        'communicationPrefs',
        'temporaryAccess',
        'securityEvents',
        'failedLoginAttempts',
        'accountLockedUntil',
        'passwordLastChanged',
        'emergencyContact',
      ],
      selfAccessOnly: ['analyticsProfile', 'preferences', 'sessions'],
      fieldRoleMap: {
        performanceRating: ['Sales Manager', 'System Administrator', 'Administrator'],
        skills: ['Sales Manager', 'System Administrator', 'Administrator'],
        certifications: ['Sales Manager', 'System Administrator', 'Administrator'],
        employeeId: ['HR Manager', 'System Administrator', 'Administrator'],
        hireDate: ['HR Manager', 'System Administrator', 'Administrator'],
        terminationDate: ['HR Manager', 'System Administrator', 'Administrator'],
        emergencyContact: ['HR Manager', 'System Administrator', 'Administrator'],
        failedLoginAttempts: ['Security Administrator', 'System Administrator', 'Administrator'],
        accountLockedUntil: ['Security Administrator', 'System Administrator', 'Administrator'],
        mfaEnabled: ['Security Administrator', 'System Administrator', 'Administrator'],
      },
      fieldPermissionMap: {
        salary: ['hr:read_sensitive', 'admin:full_access'],
        performanceReviews: ['hr:read_performance', 'admin:full_access'],
        disciplinaryActions: ['hr:read_disciplinary', 'admin:full_access'],
      },
    },
  },

  proposal: {
    allowedFields: [
      'id',
      'title',
      'description',
      'status',
      'priority',
      'dueDate',
      'createdAt',
      'updatedAt',
      'createdBy',
      'projectType',
      'value',
      'currency',
      'tags',
      'customerId',
      'version',
      'validUntil',
      'submittedAt',
      'approvedAt',
      'performanceData',
      'userStoryTracking',
      'riskScore',
      'metadata',
      'cloudId',
      'lastSyncedAt',
      'syncStatus',
      'creatorName',
      'creatorEmail',
      'customerName',
      'customerTier',
      'productCount',
      'sectionCount',
      'approvalCount',
      'totalValue',
      'completionRate',
      'lastActivityAt',
      'statsUpdatedAt',
    ],
    defaultFields: [
      'id',
      'title',
      'status',
      'priority',
      'createdAt',
      'updatedAt',
      'customerName',
      'creatorName',
    ],
    relations: {
      customer: { select: { id: true, name: true, email: true, status: true } },
      products: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          unitPrice: true,
          total: true,
          product: {
            select: { name: true, category: true, price: true },
          },
        },
      },
      assignedTo: { select: { id: true, name: true, email: true, department: true } },
      approvals: {
        select: {
          id: true,
          status: true,
          currentStage: true,
          startedAt: true,
          completedAt: true,
        },
      },
      creator: { select: { id: true, name: true, email: true } },
      validationIssues: {
        select: {
          id: true,
          entityType: true,
          severity: true,
          status: true,
        },
      },
      _count: {
        select: {
          products: true,
          approvals: true,
          validationIssues: true,
        },
      },
    },
    security: {
      requiresAuth: true,
    },
  },

  customer: {
    allowedFields: [
      'id',
      'name',
      'email',
      'status',
      'phone',
      'website',
      'address',
      'industry',
      'companySize',
      'revenue',
      'tier',
      'tags',
    ],
    relations: {
      proposals: ['id', 'title', 'status'],
      contacts: ['id', 'name', 'email', 'phone'],
      _count: {
        select: {
          proposals: true,
          contacts: true,
        },
      },
    },
    security: {
      requiresAuth: true,
    },
  },

  product: {
    allowedFields: [
      'id',
      'name',
      'description',
      'category',
      'price',
      'sku',
      'availability',
      'createdAt',
      'updatedAt',
    ],
    relations: {
      proposals: {
        select: { id: true, quantity: true, proposal: { select: { id: true, title: true } } },
      },
      _count: {
        select: {
          proposals: true,
        },
      },
    },
    security: {
      requiresAuth: true,
    },
  },

  health: {
    allowedFields: [
      'status',
      'timestamp',
      'version',
      'services',
      'database',
      'cpuUsage',
      'memoryUsage',
    ],
    security: { requiresAuth: false },
  },

  validationIssue: {
    allowedFields: [
      'id',
      'entityId',
      'entityType',
      'ruleId',
      'message',
      'severity',
      'status',
      'fixSuggestion',
      'detectedAt',
      'resolvedAt',
    ],
    relations: {
      proposal: ['id', 'title'],
      resolver: ['id', 'name'],
      rule: ['id', 'name'],
    },
    security: { requiresAuth: true },
  },

  approvalExecution: {
    allowedFields: [
      'id',
      'workflowId',
      'entityId',
      'status',
      'currentStage',
      'startedAt',
      'completedAt',
      'slaCompliance',
    ],
    relations: {
      proposal: ['id', 'title'],
      workflow: ['id', 'name'],
    },
    security: { requiresAuth: true },
  },
};

/**
 * Parses the 'fields' query parameter into a Prisma select object.
 *
 * @param url - The request URL.
 * @param entityType - The type of the entity.
 * @returns A Prisma select object.
 */
export function parseFields(
  url: URL,
  entityType: keyof typeof FIELD_CONFIGS
): Record<string, unknown> {
  const fields = url.searchParams.get('fields');
  if (!fields) {
    return getPrismaSelect(entityType);
  }
  const requestedFields = fields.split(',');
  return getPrismaSelect(entityType, requestedFields);
}

/**
 * Enhanced version of parseFields that returns both the select object and optimization metadata.
 * This function is used by modern API endpoints including proposals, users, and health.
 *
 * @param fieldsParam - The fields parameter string from the query (comma-separated fields).
 * @param entityType - The type of the entity.
 * @returns An object with the select object and optimization metrics.
 */
export function parseFieldsParam(
  fieldsParam: string | undefined,
  entityType: keyof typeof FIELD_CONFIGS,
  options?: {
    userRole?: string;
    userRoles?: string[];
    userPermissions?: string[];
    userId?: string;
    targetUserId?: string;
  }
) {
  const startTime = performance.now();

  // Parse the requested fields
  const requestedFields = fieldsParam ? fieldsParam.split(',') : [];

  // Get the select object for Prisma with security options
  const select = getPrismaSelect(
    entityType,
    requestedFields.length > 0 ? requestedFields : undefined,
    options
  );

  // Calculate optimization metrics
  const endTime = performance.now();
  const optimizationMetrics = {
    requestedFieldCount: requestedFields.length,
    processedFields: Object.keys(select).length,
    processingTimeMs: endTime - startTime,
    fieldSelection: requestedFields.length > 0 ? 'selective' : 'default',
    entityType,
  };

  return { select, optimizationMetrics };
}

interface WhereClause {
  [key: string]: unknown;
}

interface OrderByClause {
  [key: string]: 'asc' | 'desc';
}

interface PaginationOptions {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  entityType: string;
}

interface PaginationResult {
  where: WhereClause;
  take: number;
  orderBy: OrderByClause;
}

export function buildCursorPaginationQuery(
  options: PaginationOptions,
  baseWhere: WhereClause = {}
): PaginationResult {
  const { cursor, limit = 20, sortBy = 'id', sortOrder = 'desc' } = options;

  const where: WhereClause = cursor
    ? {
        ...baseWhere,
        [sortBy]: sortOrder === 'desc' ? { lt: cursor } : { gt: cursor },
      }
    : baseWhere;

  return {
    where,
    take: limit + 1, // +1 to check hasNextPage
    orderBy: { [sortBy]: sortOrder },
  };
}

/**
 * Processes query results for cursor-based pagination.
 * @param results The array of results from the database query
 * @param limit The requested limit of items per page
 * @param sortBy The field used for sorting/cursor
 * @returns Formatted result with pagination metadata
 */
export function processCursorResults<T extends { id: string }>(
  results: T[],
  limit: number,
  sortBy: string = 'id'
): {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
    itemCount: number;
  };
} {
  const hasNextPage = results.length > limit;
  if (hasNextPage) results.pop();

  return {
    data: results,
    pagination: {
      hasNextPage,
      nextCursor:
        hasNextPage && results.length > 0
          ? (results[results.length - 1][sortBy as keyof T] as unknown as string)
          : null,
      itemCount: results.length,
    },
  };
}

/**
 * Decide whether to use cursor-based or offset-based pagination
 * based on the request parameters and data characteristics
 */
export function decidePaginationStrategy(options: {
  cursor?: string;
  page?: number;
  limit?: number;
  totalEstimate?: number;
  sortBy?: string;
  sortOrder?: string;
  fields?: string;
}): {
  strategy: 'cursor' | 'offset';
  useCursorPagination: boolean;
  reason: string;
} {
  const { cursor, page, limit: _limit = 20, totalEstimate } = options;
  void _limit;

  // If cursor is provided, use cursor-based pagination
  if (cursor !== undefined) {
    return {
      strategy: 'cursor',
      useCursorPagination: true,
      reason: 'Cursor parameter provided - using cursor-based pagination for better performance',
    };
  }

  // If page is provided and total estimate is small, use offset
  if (page !== undefined && totalEstimate !== undefined && totalEstimate < 1000) {
    return {
      strategy: 'offset',
      useCursorPagination: false,
      reason: 'Small dataset with page parameter - using offset pagination for simplicity',
    };
  }

  // For large datasets or no specific preference, use cursor
  if (totalEstimate === undefined || totalEstimate >= 1000) {
    return {
      strategy: 'cursor',
      useCursorPagination: true,
      reason: 'Large or unknown dataset size - using cursor-based pagination for performance',
    };
  }

  // Default to offset for backward compatibility
  return {
    strategy: 'offset',
    useCursorPagination: false,
    reason: 'Default to offset pagination for backward compatibility',
  };
}
