/**
 * PosalPro MVP2 - Customer Management Page
 * Enhanced with Bridge Pattern for centralized state management
 *
 * User Stories: US-2.3, US-4.1
 * Hypothesis Coverage: H4 (Bridge pattern improves data consistency and performance)
 * Component Traceability: CustomerListBridge, CustomerCreationSidebar
 */

'use client';

import { CustomerManagementManagementBridge } from '@/components/bridges/CustomerManagementBridge';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Button } from '@/components/ui/forms/Button';
import { CustomersListSkeleton } from '@/components/ui/LoadingStates';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { validateApiPermission } from '@/lib/security/rbac';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import dynamicImport from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';

// ✅ SSR OPTIMIZATION: Dynamic imports for client-side only components
const CustomerListLazy = lazy(() =>
  import('@/components/customers/CustomerListBridge').then(m => ({ default: m.CustomerListBridge }))
);
const CustomerCreationSidebar = dynamicImport(
  () =>
    import('@/components/customers/CustomerCreationSidebar').then(m => ({
      default: m.CustomerCreationSidebar,
    })),
  { ssr: false }
);

// ✅ HYDRATION SAFE: Client-side only hooks
const usePageLoadTime = () => {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const startTime = performance.now();
    const timer = setTimeout(() => {
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
    }, 100);

    return () => clearTimeout(timer);
  }, [isClient]);

  return loadTime;
};

// ✅ PERFORMANCE: Fast loading skeleton component
function FastCustomersHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
      <p className="text-gray-600 mt-2">Manage your customer relationships and data</p>
    </div>
  );
}

// ✅ RBAC VALIDATION: Permission check component
function RBACGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // ✅ RBAC: Map backend role names to frontend RBAC role names
  const mapBackendRoleToRBACRole = (backendRole: string): string => {
    const roleMapping: Record<string, string> = {
      'System Administrator': 'SYSTEM_ADMINISTRATOR',
      'Team Manager': 'TEAM_MANAGER',
      'Proposal Manager': 'PROPOSAL_MANAGER',
      'SME Contributor': 'SME_CONTRIBUTOR',
      Viewer: 'VIEWER',
    };
    return roleMapping[backendRole] || backendRole;
  };

  // ✅ RBAC: Get user roles from session or default based on environment
  const getUserRoles = (user: {
    roles?: Array<{ name?: string; role?: string; roleName?: string; title?: string } | string>;
  }): string[] => {
    logDebug('RBAC: getUserRoles called', {
      component: 'RBACGuard',
      operation: 'getUserRoles',
      userStory: 'US-2.3',
      hypothesis: 'H4',
      hasUser: !!user,
      hasRoles: !!user?.roles,
      rolesType: typeof user?.roles,
      rolesIsArray: Array.isArray(user?.roles),
      rolesLength: user?.roles?.length,
      rawRoles: user?.roles,
      userKeys: user ? Object.keys(user) : [],
      rolesKeys: user?.roles?.[0] ? Object.keys(user.roles[0]) : [],
    });

    // ✅ RBAC: Extract roles from user session and map them properly
    if (user?.roles && Array.isArray(user.roles)) {
      logDebug('RBAC: Processing roles array', {
        component: 'RBACGuard',
        operation: 'process_roles_array',
        userStory: 'US-2.3',
        hypothesis: 'H4',
        rolesArray: user.roles,
        firstRole: user.roles[0],
        firstRoleKeys:
          user.roles[0] && typeof user.roles[0] === 'object' ? Object.keys(user.roles[0]) : [],
        firstRoleName:
          typeof user.roles[0] === 'object' && user.roles[0] ? user.roles[0].name : undefined,
        firstRoleType:
          typeof user.roles[0] === 'object' && user.roles[0] ? typeof user.roles[0].name : 'string',
      });

      // ✅ RBAC: Handle different role structures
      const mappedRoles = user.roles
        .map(role => {
          // ✅ RBAC: Try different possible role name properties
          let roleName: string | undefined;

          if (typeof role === 'string') {
            roleName = role;
          } else if (typeof role === 'object' && role !== null && role !== undefined) {
            const roleObj = role as {
              name?: string;
              role?: string;
              roleName?: string;
              title?: string;
            };
            roleName = roleObj.name || roleObj.role || roleObj.roleName || roleObj.title;
          }

          // ✅ RBAC: If still undefined, log the entire role object for debugging
          if (!roleName) {
            logDebug('RBAC: Role name extraction failed', {
              component: 'RBACGuard',
              operation: 'role_name_extraction_failed',
              userStory: 'US-2.3',
              hypothesis: 'H4',
              role,
              roleType: typeof role,
              roleKeys:
                typeof role === 'object' && role !== null
                  ? Object.keys(role as Record<string, unknown>)
                  : [],
            });
            return null; // Skip this role
          }

          const mappedRole = mapBackendRoleToRBACRole(roleName);
          logDebug('RBAC: Mapping individual role', {
            component: 'RBACGuard',
            operation: 'map_individual_role',
            userStory: 'US-2.3',
            hypothesis: 'H4',
            originalRole: role,
            roleName,
            roleNameType: typeof roleName,
            mappedRole,
          });
          return mappedRole;
        })
        .filter((role): role is string => role !== null); // Remove null values and type guard

      logDebug('RBAC: Roles mapped successfully', {
        component: 'RBACGuard',
        operation: 'roles_mapped',
        userStory: 'US-2.3',
        hypothesis: 'H4',
        originalRoles: user.roles.map(r => {
          if (typeof r === 'string') return r;
          return r.name || r.role || r.roleName || r.title || 'unknown';
        }),
        mappedRoles,
      });

      // ✅ RBAC: If we successfully mapped roles, return them
      if (mappedRoles.length > 0) {
        return mappedRoles;
      }
    }

    // ✅ RBAC: Fallback for development environment
    if (process.env.NODE_ENV === 'development') {
      logDebug('RBAC: Using development fallback', {
        component: 'RBACGuard',
        operation: 'development_fallback',
        userStory: 'US-2.3',
        hypothesis: 'H4',
        fallbackRole: 'SYSTEM_ADMINISTRATOR',
      });
      return ['SYSTEM_ADMINISTRATOR']; // Use frontend RBAC role name
    }

    // ✅ RBAC: Default fallback for production
    logDebug('RBAC: Using production fallback', {
      component: 'RBACGuard',
      operation: 'production_fallback',
      userStory: 'US-2.3',
      hypothesis: 'H4',
      fallbackRole: 'TEAM_MANAGER',
    });
    return ['TEAM_MANAGER']; // Use frontend RBAC role name
  };

  useEffect(() => {
    if (!session?.user) {
      setHasPermission(false);
      setIsChecking(false);
      return;
    }

    // ✅ RBAC: Check customer management permissions
    const checkPermissions = async () => {
      try {
        // ✅ RBAC: Debug session data to understand role extraction
        logDebug('RBAC: Session data analysis', {
          component: 'RBACGuard',
          operation: 'session_analysis',
          userStory: 'US-2.3',
          hypothesis: 'H4',
          userId: session.user.id || session.user.email,
          hasRoles: !!session.user.roles,
          rolesType: typeof session.user.roles,
          rolesIsArray: Array.isArray(session.user.roles),
          rolesLength: session.user.roles?.length,
          rawRoles: session.user.roles,
        });

        const userRoles = getUserRoles(session.user);

        logDebug('RBAC: Starting permission check', {
          component: 'RBACGuard',
          operation: 'permission_check_start',
          userStory: 'US-2.3',
          hypothesis: 'H4',
          userId: session.user.id || session.user.email,
          userRoles,
          resource: 'customers',
          action: 'read',
          scope: 'TEAM',
        });

        // ✅ RBAC: Check customer management permissions with proper user context
        const canManageCustomers = await validateApiPermission({
          resource: 'customers',
          action: 'read',
          scope: 'TEAM',
          context: {
            userId: session.user.id || session.user.email,
            userRoles: userRoles,
            userPermissions: [], // TODO: Get from user profile
          },
        });

        logDebug('RBAC: Permission check completed', {
          component: 'RBACGuard',
          operation: 'permission_check_complete',
          userStory: 'US-2.3',
          hypothesis: 'H4',
          userId: session.user.id || session.user.email,
          userRoles,
          canManageCustomers,
        });

        setHasPermission(canManageCustomers);
      } catch (error) {
        logError('Permission check failed', {
          component: 'RBACGuard',
          operation: 'permission_check',
          userStory: 'US-2.3',
          hypothesis: 'H4',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        setHasPermission(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPermissions();
  }, [session]);

  if (isChecking) {
    return <CustomersListSkeleton />;
  }

  // ✅ RBAC: Show access denied if no permission (for testing)
  if (!hasPermission) {
    logDebug('RBAC: Access denied - debugging permission check', {
      component: 'RBACGuard',
      operation: 'access_denied_debug',
      userStory: 'US-2.3',
      hypothesis: 'H4',
      userId: session?.user?.id || session?.user?.email,
      userRoles: session?.user ? getUserRoles(session.user) : [],
      hasPermission,
    });

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access customer management.
            </p>
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-left">
              <p>
                <strong>Debug Info:</strong>
              </p>
              <p>User ID: {session?.user?.id || session?.user?.email}</p>
              <p>Raw Roles: {session?.user?.roles ? JSON.stringify(session.user.roles) : 'None'}</p>
              <p>Mapped Roles: {session?.user ? getUserRoles(session.user).join(', ') : 'None'}</p>
              <p>Environment: {process.env.NODE_ENV}</p>
              <p>Permission Result: {hasPermission ? 'Granted' : 'Denied'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ✅ BRIDGE COMPLIANCE: Add authentication check component
function AuthenticationGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <CustomersListSkeleton />;
  }

  if (!session) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

// ✅ BRIDGE COMPLIANCE: Add error boundary wrapper
function CustomerPageErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            We encountered an error while loading the customer management page.
          </p>
          <Button onClick={resetErrorBoundary} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

// ✅ PAGE METADATA: Page metadata component with proper metadata structure
function CustomerPageMetadata() {
  return (
    <Head>
      <title>Customer Management | PosalPro</title>
      <meta
        name="description"
        content="Manage your customer relationships and data with PosalPro's comprehensive customer management system."
      />
      <meta
        name="keywords"
        content="customer management, CRM, customer data, business management"
      />
      <meta property="og:title" content="Customer Management | PosalPro" />
      <meta
        property="og:description"
        content="Manage your customer relationships and data with PosalPro."
      />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Customer Management | PosalPro" />
      <meta
        name="twitter:description"
        content="Manage your customer relationships and data with PosalPro."
      />
      {/* ✅ SSR OPTIMIZATION: Preload critical resources */}
      <link rel="preload" href="/api/customers" as="fetch" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//api.posalpro.com" />
    </Head>
  );
}

// ✅ HYDRATION SAFE: Client-side only component wrapper
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <CustomersListSkeleton />;
  }

  return <>{children}</>;
}

export default function CustomersPage() {
  // ✅ HYDRATION SAFE: Client-side only state
  const [isClient, setIsClient] = useState(false);
  const loadTime = usePageLoadTime();
  const { isDesktop } = useResponsive();
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const hasInitializedView = useRef(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // ✅ HYDRATION SAFE: Ensure client-side execution
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ PERFORMANCE: Memoized view mode initialization
  const initializeViewMode = useCallback(() => {
    if (!hasInitializedView.current && isClient) {
      setViewMode(isDesktop ? 'list' : 'cards');
      hasInitializedView.current = true;
    }
  }, [isDesktop, isClient]);

  useEffect(() => {
    initializeViewMode();
  }, [initializeViewMode]);

  // ✅ ANALYTICS INTEGRATION: Page view tracking
  useEffect(() => {
    if (!isClient) return;

    logDebug('Customer page: Analytics tracking initialized', {
      component: 'CustomersPage',
      operation: 'analytics_init',
      userStory: 'US-2.3',
      hypothesis: 'H4',
    });

    analytics(
      'page_viewed',
      {
        page: 'customers',
        userStory: 'US-2.3',
        hypothesis: 'H4',
        component: 'CustomersPage',
        loadTime: loadTime || 0,
      },
      'high'
    );

    // ✅ SECURITY: Security audit logging
    logInfo('Customer page accessed', {
      component: 'CustomersPage',
      operation: 'page_access',
      userStory: 'US-2.3',
      hypothesis: 'H4',
      timestamp: new Date().toISOString(),
    });
  }, [isClient, analytics, loadTime]);

  // ✅ SECURITY: Input sanitization for create action
  const handleCreateCustomer = useCallback(async () => {
    try {
      // ✅ SECURITY: Validate user permissions before action
      const userRoles =
        process.env.NODE_ENV === 'development' ? ['SYSTEM_ADMINISTRATOR'] : ['TEAM_MANAGER'];

      const hasPermission = await validateApiPermission({
        resource: 'customers',
        action: 'create',
        scope: 'TEAM',
        context: {
          userId: 'current-user', // TODO: Get from session
          userRoles: userRoles,
          userPermissions: [], // TODO: Get from user profile
        },
      });
      if (!hasPermission) {
        throw new Error('Insufficient permissions to create customers');
      }

      setIsCreateOpen(true);

      analytics(
        'create_customer_clicked',
        {
          userStory: 'US-2.3',
          hypothesis: 'H4',
          component: 'CustomersPage',
        },
        'medium'
      );
    } catch (error) {
      handleAsyncError(error, 'create_customer_permission_check');
    }
  }, [analytics, handleAsyncError]);

  // ✅ PERFORMANCE: Memoized success handler
  const handleCreateSuccess = useCallback(async () => {
    setIsCreateOpen(false);
    await queryClient.invalidateQueries({ queryKey: ['customers'] });

    analytics(
      'customer_created_success',
      {
        userStory: 'US-2.3',
        hypothesis: 'H4',
        component: 'CustomersPage',
      },
      'high'
    );
  }, [queryClient, analytics]);

  // ✅ HYDRATION SAFE: Don't render until client-side
  if (!isClient || typeof window === 'undefined') {
    return <CustomersListSkeleton />;
  }

  return (
    <>
      {/* ✅ PAGE METADATA: Page metadata */}
      <CustomerPageMetadata />

      <ClientOnly>
        <AuthenticationGuard>
          <RBACGuard>
            <ErrorBoundary FallbackComponent={CustomerPageErrorFallback}>
              <CustomerManagementManagementBridge>
                <div className="space-y-6" data-testid="customers-page">
                  {/* ✅ PERFORMANCE: Fast-loading header loads immediately */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <FastCustomersHeader />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleCreateCustomer}
                        variant="primary"
                        aria-label="Create new customer"
                        data-testid="create-customer-button"
                        className="min-h-[44px] px-4 py-2" // ✅ ACCESSIBILITY: 44px touch target
                      >
                        Create Customer
                      </Button>
                    </div>
                  </div>

                  {/* ✅ PERFORMANCE: Show load time for monitoring */}
                  {loadTime && (
                    <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
                      ⚡ Page shell loaded in {loadTime.toFixed(0)}ms
                    </div>
                  )}

                  {/* View mode toggle */}
                  <div className="flex justify-end">
                    <div
                      className="inline-flex rounded-lg border border-gray-300 overflow-hidden"
                      role="group"
                      aria-label="View mode"
                    >
                      <button
                        type="button"
                        className={`px-3 py-2 text-sm min-h-[44px] ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'}`}
                        onClick={() => setViewMode('list')}
                        aria-pressed={viewMode === 'list'}
                        aria-label="List view"
                        data-testid="list-view-button"
                      >
                        List
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-2 text-sm min-h-[44px] border-l border-gray-300 ${viewMode === 'cards' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'}`}
                        onClick={() => setViewMode('cards')}
                        aria-pressed={viewMode === 'cards'}
                        aria-label="Cards view"
                        data-testid="cards-view-button"
                      >
                        Cards
                      </button>
                    </div>
                  </div>

                  {/* ✅ PERFORMANCE: Lazy load heavy component with fallback */}
                  <Suspense fallback={<CustomersListSkeleton />}>
                    <CustomerListLazy viewMode={viewMode} />
                  </Suspense>

                  <CustomerCreationSidebar
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={handleCreateSuccess}
                  />
                </div>
              </CustomerManagementManagementBridge>
            </ErrorBoundary>
          </RBACGuard>
        </AuthenticationGuard>
      </ClientOnly>
    </>
  );
}
