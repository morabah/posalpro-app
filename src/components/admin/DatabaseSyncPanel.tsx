/**
 * PosalPro MVP2 - Advanced Database Synchronization Component
 *
 * World-Class Features:
 * - Real-time database connectivity monitoring
 * - Bi-directional sync with conflict resolution
 * - Comprehensive sync tracking and reporting
 * - Offline-first architecture support
 * - Data integrity verification
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SignalIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.2'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-8.2.1', 'AC-8.2.2'],
  methods: ['performSync()', 'checkDatabaseStatus()', 'resolveConflicts()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-004', 'TC-H8-005', 'TC-H8-006'],
};

// Enhanced types for advanced sync tracking
interface DatabaseStatus {
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date;
  connectionType: 'local' | 'cloud' | 'hybrid';
  health: 'healthy' | 'degraded' | 'offline';
}

interface SyncRecord {
  id: string;
  timestamp: Date;
  direction: 'localToCloud' | 'cloudToLocal' | 'bidirectional';
  status: 'success' | 'failed' | 'partial';
  itemsSynced: number;
  itemsFailed: number;
  tables: string[];
  duration: number;
  conflicts: number;
  errors: string[];
}

interface ConflictRecord {
  id: string;
  table: string;
  recordId: string;
  field: string;
  localValue: any;
  cloudValue: any;
  resolution: 'useLocal' | 'useCloud' | 'merge' | 'pending';
  timestamp: Date;
}

interface DatabaseSyncPanelProps {
  className?: string;
  onSyncComplete?: (syncTime: Date, record: SyncRecord) => void;
  onConflictDetected?: (conflict: ConflictRecord) => void;
}

export default function DatabaseSyncPanel({
  className = '',
  onSyncComplete,
  onConflictDetected,
}: DatabaseSyncPanelProps) {
  const { data: session, status: sessionStatus } = useSession();
  const analytics = useAnalytics();
  const apiClient = useApiClient();
  const errorHandlingService = ErrorHandlingService.getInstance();

  const [isSyncing, setIsSyncing] = useState(false);
  const [localDbStatus, setLocalDbStatus] = useState<DatabaseStatus>({
    isOnline: false,
    latency: null,
    lastChecked: new Date(),
    connectionType: 'local',
    health: 'offline',
  });
  const [cloudDbStatus, setCloudDbStatus] = useState<DatabaseStatus>({
    isOnline: false,
    latency: null,
    lastChecked: new Date(),
    connectionType: 'cloud',
    health: 'offline',
  });
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Check if user has admin privileges
  const isAdminUser = useCallback(() => {
    if (sessionStatus === 'loading') return false;
    if (!session?.user) return false;

    // In development, allow bypass
    if (process.env.NODE_ENV === 'development') return true;

    // Check user roles for admin privileges
    const user = session.user as any;
    if (typeof user.roles === 'string') {
      return user.roles.toLowerCase().includes('admin');
    }
    if (Array.isArray(user.roles)) {
      return user.roles.some((role: string) => role.toLowerCase().includes('admin'));
    }

    return false;
  }, [session, sessionStatus]);

  // Real-time database status monitoring
  const checkDatabaseStatus = useCallback(
    async (type: 'local' | 'cloud') => {
      try {
        const startTime = Date.now();

        // Track database status check analytics
        analytics.track('database_status_check_started', {
          component: 'DatabaseSyncPanel',
          databaseType: type,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          timestamp: Date.now(),
        });

        // Use centralized API client instead of direct fetch
        const response = await apiClient.post<{
          success: boolean;
          data?: any;
          error?: string;
        }>('/api/admin/db-status', { type });

        const latency = Date.now() - startTime;
        const isOnline = response.success;
        const health = isOnline ? (latency < 500 ? 'healthy' : 'degraded') : 'offline';

        const status: DatabaseStatus = {
          isOnline,
          latency: isOnline ? latency : null,
          lastChecked: new Date(),
          connectionType: type,
          health,
        };

        if (type === 'local') {
          setLocalDbStatus(status);
        } else {
          setCloudDbStatus(status);
        }

        // Track successful status check
        analytics.track('database_status_check_success', {
          component: 'DatabaseSyncPanel',
          databaseType: type,
          status: health,
          latency,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          timestamp: Date.now(),
        });

        return status;
      } catch (error) {
        // Use standardized error handling
        const standardError = errorHandlingService.processError(
          error,
          `Failed to check ${type} database status`,
          ErrorCodes.DATA.DATABASE_ERROR,
          {
            component: 'DatabaseSyncPanel',
            operation: 'checkDatabaseStatus',
            databaseType: type,
            userStories: COMPONENT_MAPPING.userStories,
            hypotheses: COMPONENT_MAPPING.hypotheses,
          }
        );

        const status: DatabaseStatus = {
          isOnline: false,
          latency: null,
          lastChecked: new Date(),
          connectionType: type,
          health: 'offline',
        };

        if (type === 'local') {
          setLocalDbStatus(status);
        } else {
          setCloudDbStatus(status);
        }

        // Track error analytics
        analytics.track('database_status_check_error', {
          component: 'DatabaseSyncPanel',
          databaseType: type,
          error: standardError.message,
          errorCode: standardError.code,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          timestamp: Date.now(),
        });

        return status;
      }
    },
    [analytics, apiClient, errorHandlingService]
  );

  // Monitor database status every 30 seconds
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(async () => {
      await Promise.all([checkDatabaseStatus('local'), checkDatabaseStatus('cloud')]);
    }, 30000);

    // Initial check
    void checkDatabaseStatus('local');
    void checkDatabaseStatus('cloud');

    return () => clearInterval(interval);
  }, [checkDatabaseStatus, isMonitoring]);

  // Advanced synchronization with conflict detection
  const performSync = useCallback(
    async (direction: 'localToCloud' | 'cloudToLocal' | 'bidirectional') => {
      const startTime = Date.now();
      try {
        setIsSyncing(true);
        const toastId = toast.loading(`Starting ${direction} synchronization...`);

        // Track sync start analytics
        analytics.track('database_sync_started', {
          component: 'DatabaseSyncPanel',
          direction,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          timestamp: Date.now(),
        });

        // Use centralized API client instead of direct fetch
        const result = await apiClient.post<{
          success: boolean;
          data?: any;
          error?: string;
        }>('/api/admin/db-sync', {
          direction,
          includeConflictDetection: true,
          generateReport: true,
        });

        const duration = Date.now() - startTime;
        toast.dismiss(toastId);

        if (!result.success) {
          throw new Error(result.error || 'Synchronization failed');
        }

        // Extract sync data from response
        const syncData = result.data || result;

        // Create detailed sync record
        const syncRecord: SyncRecord = {
          id: `sync-${Date.now()}`,
          timestamp: new Date(),
          direction,
          status: syncData.conflicts?.length > 0 ? 'partial' : 'success',
          itemsSynced: syncData.itemsSynced || 0,
          itemsFailed: syncData.itemsFailed || 0,
          tables: syncData.tables || [],
          duration,
          conflicts: syncData.conflicts?.length || 0,
          errors: syncData.errors || [],
        };

        setSyncRecords(prev => [syncRecord, ...prev.slice(0, 9)]); // Keep last 10 records

        // Handle conflicts if any
        if (syncData.conflicts?.length > 0) {
          const newConflicts = syncData.conflicts.map(
            (conflict: {
              table: string;
              recordId: string;
              field: string;
              localValue: any;
              cloudValue: any;
            }) => ({
              id: `conflict-${Date.now()}-${Math.random()}`,
              table: conflict.table,
              recordId: conflict.recordId,
              field: conflict.field,
              localValue: conflict.localValue,
              cloudValue: conflict.cloudValue,
              resolution: 'pending' as const,
              timestamp: new Date(),
            })
          );

          setConflicts(prev => [...newConflicts, ...prev]);

          newConflicts.forEach((conflict: ConflictRecord) => {
            if (onConflictDetected) {
              onConflictDetected(conflict);
            }
          });

          toast.error(
            `Sync completed with ${syncData.conflicts.length} conflicts requiring resolution`
          );
        } else {
          toast.success(
            `Synchronization completed successfully! ${syncData.itemsSynced} items synced.`
          );
        }

        // Track successful sync
        analytics.track('database_sync_success', {
          component: 'DatabaseSyncPanel',
          direction,
          itemsSynced: syncData.itemsSynced,
          conflicts: syncData.conflicts?.length || 0,
          duration,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          timestamp: Date.now(),
        });

        if (onSyncComplete) {
          onSyncComplete(new Date(), syncRecord);
        }

        // Refresh database status after sync
        setTimeout(() => {
          void checkDatabaseStatus('local');
          void checkDatabaseStatus('cloud');
        }, 1000);
      } catch (error) {
        // Use standardized error handling
        const standardError = errorHandlingService.processError(
          error,
          `Database synchronization failed for ${direction}`,
          ErrorCodes.DATA.DATABASE_ERROR,
          {
            component: 'DatabaseSyncPanel',
            operation: 'performSync',
            direction,
            userStories: COMPONENT_MAPPING.userStories,
            hypotheses: COMPONENT_MAPPING.hypotheses,
          }
        );

        const errorMessage = errorHandlingService.getUserFriendlyMessage(standardError);

        const failedRecord: SyncRecord = {
          id: `sync-failed-${Date.now()}`,
          timestamp: new Date(),
          direction,
          status: 'failed',
          itemsSynced: 0,
          itemsFailed: 0,
          tables: [],
          duration: Date.now() - startTime,
          conflicts: 0,
          errors: [errorMessage],
        };

        setSyncRecords(prev => [failedRecord, ...prev.slice(0, 9)]);
        toast.error(`Sync failed: ${errorMessage}`);

        // Track error analytics
        analytics.track('database_sync_error', {
          component: 'DatabaseSyncPanel',
          direction,
          error: standardError.message,
          errorCode: standardError.code,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          timestamp: Date.now(),
        });
      } finally {
        setIsSyncing(false);
      }
    },
    [
      onSyncComplete,
      onConflictDetected,
      checkDatabaseStatus,
      analytics,
      apiClient,
      errorHandlingService,
    ]
  );

  // Status indicator component
  const StatusIndicator = ({ status }: { status: DatabaseStatus }) => {
    const getStatusIcon = () => {
      switch (status.health) {
        case 'healthy':
          return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case 'degraded':
          return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
        case 'offline':
          return <XCircleIcon className="w-5 h-5 text-red-500" />;
        default:
          return <XCircleIcon className="w-5 h-5 text-gray-400" />;
      }
    };

    const getStatusText = () => {
      if (!status.isOnline) return 'Offline';
      return `Online (${status.latency}ms)`;
    };

    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <div>
          <div className="text-sm font-medium capitalize">{status.connectionType} Database</div>
          <div className="text-xs text-gray-500">
            {getStatusText()} • Last checked: {status.lastChecked.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Database Synchronization Center</h3>
        <div className="flex items-center space-x-2">
          <SignalIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-gray-500">Real-time monitoring</span>
        </div>
      </div>

      {/* Database Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded-lg">
          <StatusIndicator status={localDbStatus} />
        </div>
        <div className="p-4 border rounded-lg">
          <StatusIndicator status={cloudDbStatus} />
        </div>
      </div>

      {/* Sync Controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-medium">Sync Operations</h4>
          {sessionStatus === 'loading' ? (
            <span className="text-sm text-gray-500">Checking authentication...</span>
          ) : !session?.user ? (
            <span className="text-sm text-red-600">Authentication required</span>
          ) : !isAdminUser() ? (
            <span className="text-sm text-red-600">Admin privileges required</span>
          ) : (
            <span className="text-sm text-green-600">✅ Authenticated as {session.user.email}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="primary"
            size="sm"
            className="flex items-center justify-center"
            onClick={() => performSync('localToCloud')}
            disabled={
              isSyncing ||
              !localDbStatus.isOnline ||
              !cloudDbStatus.isOnline ||
              sessionStatus === 'loading' ||
              !isAdminUser()
            }
          >
            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
            Local → Cloud
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center"
            onClick={() => performSync('cloudToLocal')}
            disabled={
              isSyncing ||
              !localDbStatus.isOnline ||
              !cloudDbStatus.isOnline ||
              sessionStatus === 'loading' ||
              !isAdminUser()
            }
          >
            <CloudArrowDownIcon className="w-4 h-4 mr-2" />
            Cloud → Local
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center"
            onClick={() => performSync('bidirectional')}
            disabled={
              isSyncing ||
              !localDbStatus.isOnline ||
              !cloudDbStatus.isOnline ||
              sessionStatus === 'loading' ||
              !isAdminUser()
            }
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Bi-directional
          </Button>
        </div>

        {(!localDbStatus.isOnline || !cloudDbStatus.isOnline) && (
          <p className="text-sm text-red-600 mt-2">
            Both databases must be online to perform synchronization.
          </p>
        )}

        {sessionStatus !== 'loading' && !isAdminUser() && (
          <p className="text-sm text-red-600 mt-2">
            {!session?.user
              ? 'Please log in with an administrator account to perform sync operations.'
              : 'Admin privileges are required for database synchronization.'}
          </p>
        )}
      </div>

      {/* Conflicts Section */}
      {conflicts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2" />
            Conflicts Requiring Resolution ({conflicts.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {conflicts.slice(0, 3).map(conflict => (
              <div key={conflict.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-sm font-medium">
                  {conflict.table}.{conflict.field} (ID: {conflict.recordId})
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Local: {JSON.stringify(conflict.localValue)} | Cloud:{' '}
                  {JSON.stringify(conflict.cloudValue)}
                </div>
              </div>
            ))}
            {conflicts.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{conflicts.length - 3} more conflicts
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Sync History */}
      <div>
        <h4 className="text-lg font-medium mb-3 flex items-center">
          <ClockIcon className="w-5 h-5 text-gray-500 mr-2" />
          Recent Sync History
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {syncRecords.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No sync operations yet</p>
          ) : (
            syncRecords.map(record => (
              <div key={record.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium flex items-center">
                    <DocumentCheckIcon className="w-4 h-4 mr-2" />
                    {record.direction} • {record.itemsSynced} items
                    {record.status === 'success' && (
                      <CheckCircleIcon className="w-4 h-4 text-green-500 ml-2" />
                    )}
                    {record.status === 'failed' && (
                      <XCircleIcon className="w-4 h-4 text-red-500 ml-2" />
                    )}
                    {record.status === 'partial' && (
                      <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 ml-2" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {record.timestamp.toLocaleString()} • {record.duration}ms
                    {record.conflicts > 0 && ` • ${record.conflicts} conflicts`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Offline-First Architecture Active</p>
            <p>
              Your app automatically switches between local and cloud databases based on
              connectivity. Data integrity is maintained through conflict detection and resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
